"""
Sadaqah AI Worker — FastAPI Application
"""

import asyncio
import json
from contextlib import asynccontextmanager

import httpx
import redis.asyncio as aioredis
import structlog
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.schemas import (
    HealthResponse,
    OCRResult,
    OCRTaskPayload,
    RankingResult,
    RankingTaskPayload,
)
from app.services.ranking_service import ranking_service

logger = structlog.get_logger()

# ── Redis Connection ──
redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Get the Redis client."""
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
        )
    return redis_client


# ── Background Workers ──


async def ocr_worker():
    """Background worker that consumes OCR tasks from Redis queue."""
    rdb = await get_redis()
    logger.info("ocr_worker started", queue=settings.ocr_queue_name)

    while True:
        try:
            # Blocking pop from queue (timeout 5s to allow graceful shutdown)
            result = await rdb.brpop(settings.ocr_queue_name, timeout=5)
            if result is None:
                continue

            _, raw_payload = result
            payload = OCRTaskPayload.model_validate_json(raw_payload)
            logger.info("ocr_task received", task_id=str(payload.task_id))

            # Process the document
            from app.services.ocr_service import ocr_service
            ocr_result = ocr_service.process_document(payload)

            # Callback to Go API
            await _send_callback("/internal/ocr/results", ocr_result.model_dump(mode="json"))

        except asyncio.CancelledError:
            logger.info("ocr_worker shutting down")
            break
        except Exception as e:
            logger.error("ocr_worker error", error=str(e))
            await asyncio.sleep(1)


async def ranking_worker():
    """Background worker that consumes ranking tasks from Redis queue."""
    rdb = await get_redis()
    logger.info("ranking_worker started", queue=settings.ranking_queue_name)

    while True:
        try:
            result = await rdb.brpop(settings.ranking_queue_name, timeout=5)
            if result is None:
                continue

            _, raw_payload = result
            payload = RankingTaskPayload.model_validate_json(raw_payload)
            logger.info(
                "ranking_task received",
                cycle_id=str(payload.cycle_id),
                num_applicants=len(payload.applicants),
            )

            # Process ranking
            ranking_result = ranking_service.rank(payload)

            # Callback to Go API
            await _send_callback("/internal/ranking/results", ranking_result.model_dump(mode="json"))

        except asyncio.CancelledError:
            logger.info("ranking_worker shutting down")
            break
        except Exception as e:
            logger.error("ranking_worker error", error=str(e))
            await asyncio.sleep(1)


async def _send_callback(path: str, data: dict):
    """Send results back to Go API via HTTP callback."""
    url = f"{settings.api_base_url}{path}"
    headers = {"X-Internal-API-Key": settings.ai_internal_api_key}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code >= 400:
                logger.error(
                    "callback failed",
                    url=url,
                    status=response.status_code,
                    body=response.text[:500],
                )
            else:
                logger.info("callback sent", url=url, status=response.status_code)
    except Exception as e:
        logger.error("callback error", url=url, error=str(e))


# ── Application Lifecycle ──


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    logger.info("ai-worker starting", env=settings.app_env)

    # Start background workers
    ocr_task = asyncio.create_task(ocr_worker())
    ranking_task = asyncio.create_task(ranking_worker())

    yield

    # Shutdown workers
    logger.info("ai-worker shutting down")
    ocr_task.cancel()
    ranking_task.cancel()

    try:
        await asyncio.gather(ocr_task, ranking_task, return_exceptions=True)
    except asyncio.CancelledError:
        pass

    if redis_client:
        await redis_client.close()


# ── FastAPI App ──

app = FastAPI(
    title="Sadaqah AI Worker",
    description="AI services for OCR processing and candidate ranking",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ──


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    redis_ok = False
    try:
        rdb = await get_redis()
        await rdb.ping()
        redis_ok = True
    except Exception:
        pass

    return HealthResponse(
        status="healthy" if redis_ok else "degraded",
        redis_connected=redis_ok,
    )


@app.post("/rank", response_model=RankingResult)
async def rank_sync(payload: RankingTaskPayload):
    """Synchronous ranking endpoint (for testing/small batches)."""
    try:
        result = ranking_service.rank(payload)
        return result
    except Exception as e:
        logger.error("ranking failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

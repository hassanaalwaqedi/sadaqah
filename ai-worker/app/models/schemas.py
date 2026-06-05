"""
Sadaqah AI Worker — Pydantic V2 Models
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── OCR Models ──


class OCRTaskPayload(BaseModel):
    """Payload received from Redis queue for OCR processing."""

    task_id: UUID
    document_id: UUID
    file_url: str
    document_type: str = "transcript"


class OCRExtractedData(BaseModel):
    """Structured data extracted from OCR processing."""

    student_name: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None
    gpa: Optional[float] = None
    gpa_scale: Optional[float] = Field(default=4.0, description="GPA scale (e.g., 4.0 or 5.0)")
    academic_year: Optional[int] = None
    graduation_date: Optional[str] = None
    raw_fields: dict[str, Any] = Field(default_factory=dict)


class OCRResult(BaseModel):
    """Result of OCR processing, sent back to Go API."""

    task_id: UUID
    extracted_data: OCRExtractedData
    confidence_score: float = Field(ge=0.0, le=1.0)
    raw_text: Optional[str] = None
    needs_review: bool = False
    error_message: Optional[str] = None


# ── Ranking Models ──


class RankingCriteria(BaseModel):
    """A single ranking criterion with its weight."""

    name: str
    weight: float = Field(gt=0)
    max_score: float
    data_source: str = "manual"


class ApplicantData(BaseModel):
    """Applicant data for ranking."""

    application_id: UUID
    gpa: Optional[float] = None
    family_income: Optional[float] = None
    family_size: Optional[int] = None
    distance_km: Optional[float] = None
    special_circumstances: Optional[str] = None
    custom_fields: dict[str, Any] = Field(default_factory=dict)


class RankingTaskPayload(BaseModel):
    """Payload received from Redis queue for ranking."""

    cycle_id: UUID
    criteria: list[RankingCriteria]
    applicants: list[ApplicantData]


class ApplicantRankResult(BaseModel):
    """Ranking result for a single applicant."""

    application_id: UUID
    total_score: float
    rank: int
    criteria_breakdown: dict[str, float]
    flags: list[str] = Field(default_factory=list)


class RankingResult(BaseModel):
    """Complete ranking result, sent back to Go API."""

    cycle_id: UUID
    rankings: list[ApplicantRankResult]
    ranked_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)


# ── Health ──


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    service: str = "ai-worker"
    version: str = "1.0.0"
    redis_connected: bool = False

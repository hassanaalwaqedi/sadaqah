"""
Sadaqah AI Worker — Configuration
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # General
    app_env: str = "development"

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    redis_db: int = 0

    # Go API
    api_base_url: str = "http://localhost:8080"
    ai_internal_api_key: str = ""

    # OCR
    ocr_confidence_threshold: float = 0.80
    ocr_max_retries: int = 3
    ocr_queue_name: str = "ocr_queue"

    # Ranking
    ranking_queue_name: str = "ranking_queue"

    @property
    def redis_url(self) -> str:
        """Build Redis URL from components."""
        auth = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{auth}{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()

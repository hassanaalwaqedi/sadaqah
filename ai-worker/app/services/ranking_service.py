"""
Sadaqah AI Worker — Ranking Service
"""

import structlog
import numpy as np
from typing import Any

from app.models.schemas import (
    ApplicantData,
    ApplicantRankResult,
    RankingCriteria,
    RankingResult,
    RankingTaskPayload,
)

logger = structlog.get_logger()


class RankingService:
    """Scores and ranks applicants based on weighted multi-criteria evaluation."""

    def rank(self, payload: RankingTaskPayload) -> RankingResult:
        """
        Process a ranking task:
        1. Normalize applicant data to 0-1 scale
        2. Apply weighted scoring
        3. Sort and assign ranks
        4. Detect anomalies
        """
        logger.info(
            "starting ranking",
            cycle_id=str(payload.cycle_id),
            num_applicants=len(payload.applicants),
            num_criteria=len(payload.criteria),
        )

        if not payload.applicants:
            return RankingResult(cycle_id=payload.cycle_id, rankings=[])

        # Step 1: Extract raw scores per criterion
        criteria_names = [c.name for c in payload.criteria]
        raw_scores = self._extract_raw_scores(payload.applicants, payload.criteria)

        # Step 2: Normalize to 0-1
        normalized = self._normalize_scores(raw_scores)

        # Step 3: Weighted sum
        weights = np.array([c.weight for c in payload.criteria])
        weights = weights / weights.sum()  # Normalize weights to sum to 1

        weighted_scores = normalized @ weights  # Matrix multiplication

        # Step 4: Sort and rank
        rankings = []
        sorted_indices = np.argsort(-weighted_scores)  # Descending

        for rank_idx, applicant_idx in enumerate(sorted_indices):
            applicant = payload.applicants[applicant_idx]
            total_score = float(weighted_scores[applicant_idx])

            # Per-criterion breakdown
            breakdown = {}
            for j, name in enumerate(criteria_names):
                breakdown[name] = round(float(normalized[applicant_idx, j] * weights[j]), 4)

            # Flag anomalies
            flags = self._detect_anomalies(applicant, total_score)

            rankings.append(
                ApplicantRankResult(
                    application_id=applicant.application_id,
                    total_score=round(total_score, 4),
                    rank=rank_idx + 1,
                    criteria_breakdown=breakdown,
                    flags=flags,
                )
            )

        logger.info(
            "ranking complete",
            cycle_id=str(payload.cycle_id),
            num_ranked=len(rankings),
            top_score=rankings[0].total_score if rankings else 0,
        )

        return RankingResult(
            cycle_id=payload.cycle_id,
            rankings=rankings,
            metadata={
                "algorithm": "weighted_sum",
                "weights": {c.name: float(w) for c, w in zip(payload.criteria, weights)},
            },
        )

    def _extract_raw_scores(
        self,
        applicants: list[ApplicantData],
        criteria: list[RankingCriteria],
    ) -> np.ndarray:
        """Extract raw numerical scores from applicant data per criterion."""
        n = len(applicants)
        m = len(criteria)
        scores = np.zeros((n, m))

        for i, applicant in enumerate(applicants):
            for j, criterion in enumerate(criteria):
                scores[i, j] = self._get_criterion_value(applicant, criterion)

        return scores

    def _get_criterion_value(self, applicant: ApplicantData, criterion: RankingCriteria) -> float:
        """Map criterion name to applicant data field."""
        name = criterion.name.lower().replace(" ", "_")

        mapping: dict[str, Any] = {
            "gpa": applicant.gpa or 0,
            "family_income": applicant.family_income or 0,
            "family_size": applicant.family_size or 1,
            "distance_km": applicant.distance_km or 0,
            "distance": applicant.distance_km or 0,
        }

        # Check custom fields
        if name in mapping:
            return float(mapping[name])
        if name in applicant.custom_fields:
            return float(applicant.custom_fields[name])

        return 0.0

    def _normalize_scores(self, scores: np.ndarray) -> np.ndarray:
        """Min-max normalize scores to 0-1 range per criterion."""
        normalized = np.zeros_like(scores)
        for j in range(scores.shape[1]):
            col = scores[:, j]
            col_min = col.min()
            col_max = col.max()
            if col_max - col_min > 0:
                normalized[:, j] = (col - col_min) / (col_max - col_min)
            else:
                normalized[:, j] = 0.5  # All same value
        return normalized

    def _detect_anomalies(self, applicant: ApplicantData, score: float) -> list[str]:
        """Flag unusual patterns for manual review."""
        flags = []

        if applicant.gpa is not None and applicant.gpa > 4.0:
            flags.append("gpa_exceeds_scale")
        if applicant.family_income is not None and applicant.family_income < 0:
            flags.append("negative_income")
        if applicant.distance_km is not None and applicant.distance_km > 5000:
            flags.append("extreme_distance")

        return flags


# Singleton
ranking_service = RankingService()

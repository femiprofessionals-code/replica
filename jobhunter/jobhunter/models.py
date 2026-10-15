"""Normalized domain models for JobHunter.

Every job source returns the same `Job` shape so the rest of the pipeline
(scoring, documents, tracking, reporting) never depends on a specific board.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
import hashlib


class Stage(str, Enum):
    """Where a job sits in the pipeline. Stored in the tracker."""

    FOUND = "found"
    SCORED = "scored"
    QUEUED = "queued"          # tailored docs prepared, awaiting human approval
    APPROVED = "approved"      # human approved; ready to submit
    APPLIED = "applied"
    SKIPPED = "skipped"
    RESPONSE = "response"       # employer replied
    REJECTED = "rejected"
    INTERVIEW = "interview"
    OFFER = "offer"


@dataclass
class Job:
    """A single remote job posting, normalized across sources."""

    source: str
    external_id: str
    title: str
    company: str
    url: str
    description: str = ""
    apply_url: Optional[str] = None
    apply_email: Optional[str] = None
    location: str = ""
    remote: bool = True
    regions: list[str] = field(default_factory=list)   # e.g. ["worldwide"], ["usa"], ["europe"]
    salary: Optional[str] = None
    tags: list[str] = field(default_factory=list)
    posted_at: Optional[str] = None                    # ISO 8601
    raw: dict[str, Any] = field(default_factory=dict)

    @property
    def id(self) -> str:
        """Stable, source-scoped id used for dedupe across runs."""
        base = f"{self.source}:{self.external_id}"
        return hashlib.sha1(base.encode("utf-8")).hexdigest()[:16]

    def to_row(self) -> dict[str, Any]:
        d = asdict(self)
        d.pop("raw", None)
        d["id"] = self.id
        d["regions"] = ", ".join(self.regions)
        d["tags"] = ", ".join(self.tags)
        return d


@dataclass
class ScoredJob:
    """A job plus its deterministic match score and the reasons behind it."""

    job: Job
    score: int                       # 0-100
    reasons: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)
    disqualified: bool = False


@dataclass
class ApplicationDocs:
    """Tailored documents generated for one job. Facts come from the CV only."""

    job_id: str
    cover_letter: str
    cv_summary: str                  # tailored headline/summary for the CV
    highlighted_skills: list[str] = field(default_factory=list)
    model_used: str = "template"     # "template" or an Anthropic model id


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

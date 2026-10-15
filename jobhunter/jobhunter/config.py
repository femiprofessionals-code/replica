"""Configuration loading. The user's search intent, filters, and scoring
weights live in a YAML file so the engine stays declarative and reviewable."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
import os
import yaml


@dataclass
class ScoringWeights:
    title: int = 35
    skills: int = 35
    keywords: int = 15
    recency: int = 15

    @property
    def total(self) -> int:
        return self.title + self.skills + self.keywords + self.recency


@dataclass
class Config:
    # What to search for.
    queries: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=lambda: ["remotive", "remoteok", "weworkremotely"])

    # Hard filters (applied before scoring).
    required_keywords: list[str] = field(default_factory=list)   # at least one must appear
    exclude_keywords: list[str] = field(default_factory=list)    # any disqualifies
    allowed_regions: list[str] = field(default_factory=list)     # empty = any remote region
    max_age_days: int = 30

    # Location and compensation (used by location-aware sources: adzuna, usajobs).
    country: str = "us"
    location: str = ""              # e.g. "Glendale, Maryland"
    distance_miles: int = 25
    remote_priority: bool = True
    salary_min: int = 0
    salary_target: int = 0

    # Soft matching.
    target_titles: list[str] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)
    nice_to_have: list[str] = field(default_factory=list)
    min_score: int = 55
    daily_apply_cap: int = 10

    weights: ScoringWeights = field(default_factory=ScoringWeights)

    @staticmethod
    def load(path: str) -> "Config":
        with open(path, "r", encoding="utf-8") as f:
            data: dict[str, Any] = yaml.safe_load(f) or {}
        weights = ScoringWeights(**(data.pop("weights", {}) or {}))
        known = {
            "queries", "sources", "required_keywords", "exclude_keywords",
            "allowed_regions", "max_age_days", "country", "location",
            "distance_miles", "remote_priority", "salary_min", "salary_target",
            "target_titles", "skills", "nice_to_have", "min_score", "daily_apply_cap",
        }
        kwargs = {k: v for k, v in data.items() if k in known}
        return Config(weights=weights, **kwargs)


def env(name: str, default: str | None = None) -> str | None:
    return os.environ.get(name, default)

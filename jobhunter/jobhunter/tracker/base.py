"""Tracker interface: the single place the whole pipeline is recorded. The
Google Sheets implementation is the user-facing tracker; CSV is the local
fallback so the engine runs with no cloud credentials."""
from __future__ import annotations

from abc import ABC, abstractmethod

# Canonical column order for the tracker sheet/CSV.
COLUMNS = [
    "id",
    "found_at",
    "updated_at",
    "stage",
    "score",
    "source",
    "company",
    "title",
    "location",
    "salary",
    "url",
    "apply_url",
    "apply_email",
    "reasons",
    "cv_summary",
    "cover_letter",
    "model_used",
    "applied_at",
    "response",
    "notes",
]


class Tracker(ABC):
    @abstractmethod
    def known_ids(self) -> set[str]:
        """Ids already recorded, for cross-run dedupe."""

    @abstractmethod
    def upsert(self, record: dict) -> None:
        """Insert a new row or update an existing one, keyed by `id`."""

    @abstractmethod
    def all_records(self) -> list[dict]:
        ...

    def by_stage(self, stage: str) -> list[dict]:
        return [r for r in self.all_records() if (r.get("stage") or "") == stage]

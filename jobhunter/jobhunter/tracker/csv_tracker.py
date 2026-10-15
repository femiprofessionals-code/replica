"""CSV tracker. Local-file fallback when Google Sheets is not configured."""
from __future__ import annotations

import csv
import os

from jobhunter.tracker.base import Tracker, COLUMNS


class CsvTracker(Tracker):
    def __init__(self, path: str = "jobhunter_tracker.csv"):
        self.path = path
        self._rows: dict[str, dict] = {}
        self._load()

    def _load(self) -> None:
        if not os.path.exists(self.path):
            return
        with open(self.path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row.get("id"):
                    self._rows[row["id"]] = row

    def _flush(self) -> None:
        with open(self.path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=COLUMNS, extrasaction="ignore")
            w.writeheader()
            for row in self._rows.values():
                w.writerow({c: row.get(c, "") for c in COLUMNS})

    def known_ids(self) -> set[str]:
        return set(self._rows.keys())

    def upsert(self, record: dict) -> None:
        rid = record["id"]
        existing = self._rows.get(rid, {})
        existing.update({k: ("" if v is None else v) for k, v in record.items()})
        self._rows[rid] = existing
        self._flush()

    def all_records(self) -> list[dict]:
        return list(self._rows.values())

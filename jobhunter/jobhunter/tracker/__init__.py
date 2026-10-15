"""Tracker factory: Google Sheets when configured, else local CSV."""
from __future__ import annotations

import os

from jobhunter.tracker.base import Tracker, COLUMNS
from jobhunter.tracker.csv_tracker import CsvTracker


def get_tracker() -> Tracker:
    sheet_id = os.environ.get("JOBHUNTER_SHEET_ID")
    has_creds = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON") or os.environ.get(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )
    if sheet_id and has_creds:
        from jobhunter.tracker.sheets_tracker import SheetsTracker

        return SheetsTracker(sheet_id=sheet_id)
    return CsvTracker(os.environ.get("JOBHUNTER_CSV", "jobhunter_tracker.csv"))


__all__ = ["Tracker", "COLUMNS", "get_tracker", "CsvTracker"]

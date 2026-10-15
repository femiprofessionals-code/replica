"""Adzuna Jobs API: https://developer.adzuna.com/
All industries, supports what/where/distance/salary filters, so it is the best
fit for location-plus-salary searches like healthcare compliance near a city.

Needs free credentials: ADZUNA_APP_ID and ADZUNA_APP_KEY. Without them this
source returns nothing (so the run still works on other sources)."""
from __future__ import annotations

import os
import re

from jobhunter.config import Config
from jobhunter.models import Job
from jobhunter.sources.base import JobSource


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").replace("&nbsp;", " ").strip()


class AdzunaSource(JobSource):
    name = "adzuna"

    def __init__(self, cfg: Config | None = None):
        self.cfg = cfg or Config()
        self.app_id = os.environ.get("ADZUNA_APP_ID", "")
        self.app_key = os.environ.get("ADZUNA_APP_KEY", "")

    def _base(self) -> str:
        return f"https://api.adzuna.com/v1/api/jobs/{self.cfg.country or 'us'}/search/1"

    def fetch(self, queries: list[str]) -> list[Job]:
        if not (self.app_id and self.app_key):
            return []  # not configured; skip quietly
        jobs: list[Job] = []
        for q in queries or [""]:
            # Pass 1: location + radius (covers "within N miles of city").
            if self.cfg.location:
                jobs += self._query(q, where=self.cfg.location, distance=self.cfg.distance_miles)
            # Pass 2: remote-focused, nationwide (no where = whole country).
            if self.cfg.remote_priority:
                jobs += self._query(f"{q} remote".strip())
        return jobs

    def _query(self, what: str, where: str = "", distance: int = 0) -> list[Job]:
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "what": what,
            "results_per_page": 50,
            "content-type": "application/json",
            "max_days_old": self.cfg.max_age_days,
        }
        if where:
            params["where"] = where
        if distance:
            params["distance"] = distance
        if self.cfg.salary_min:
            params["salary_min"] = self.cfg.salary_min
        try:
            data = self._get(self._base(), params=params).json()
        except Exception:
            return []
        return [self._map(item) for item in data.get("results", [])]

    def _map(self, item: dict) -> Job:
        loc = (item.get("location") or {}).get("display_name", "")
        areas = [a.lower() for a in (item.get("location") or {}).get("area", [])]
        sal = None
        if item.get("salary_min"):
            sal = f"${int(item['salary_min']):,} - ${int(item.get('salary_max', item['salary_min'])):,}"
        return Job(
            source=self.name,
            external_id=str(item.get("id")),
            title=(item.get("title") or "").strip(),
            company=((item.get("company") or {}).get("display_name") or "").strip(),
            url=item.get("redirect_url", ""),
            apply_url=item.get("redirect_url"),
            description=_strip_html(item.get("description", "")),
            location=loc,
            remote="remote" in (loc + " " + item.get("title", "")).lower(),
            regions=areas,
            salary=sal,
            tags=[(item.get("category") or {}).get("label", "")] if item.get("category") else [],
            posted_at=item.get("created"),
            raw=item,
        )

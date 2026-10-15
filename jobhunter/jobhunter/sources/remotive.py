"""Remotive public API: https://remotive.com/api/remote-jobs"""
from __future__ import annotations

import re
from jobhunter.models import Job
from jobhunter.sources.base import JobSource


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").replace("&nbsp;", " ").strip()


class RemotiveSource(JobSource):
    name = "remotive"
    BASE = "https://remotive.com/api/remote-jobs"

    def fetch(self, queries: list[str]) -> list[Job]:
        jobs: list[Job] = []
        for q in queries or [""]:
            params = {"search": q} if q else {}
            data = self._get(self.BASE, params=params).json()
            for item in data.get("jobs", []):
                jobs.append(self._map(item))
        return jobs

    def _map(self, item: dict) -> Job:
        loc = item.get("candidate_required_location") or "Worldwide"
        return Job(
            source=self.name,
            external_id=str(item.get("id")),
            title=item.get("title", "").strip(),
            company=item.get("company_name", "").strip(),
            url=item.get("url", ""),
            apply_url=item.get("url"),
            description=_strip_html(item.get("description", "")),
            location=loc,
            regions=[r.strip().lower() for r in loc.split(",") if r.strip()],
            salary=item.get("salary") or None,
            tags=item.get("tags", []) or [],
            posted_at=item.get("publication_date"),
            raw=item,
        )

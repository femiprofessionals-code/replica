"""RemoteOK public API: https://remoteok.com/api
The first array element is legal metadata and is skipped. A descriptive
User-Agent is required by their API."""
from __future__ import annotations

import re
from jobhunter.models import Job
from jobhunter.sources.base import JobSource


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").replace("&nbsp;", " ").strip()


class RemoteOKSource(JobSource):
    name = "remoteok"
    BASE = "https://remoteok.com/api"

    def fetch(self, queries: list[str]) -> list[Job]:
        # RemoteOK returns the whole feed; we filter locally by query terms.
        data = self._get(self.BASE).json()
        items = [x for x in data if isinstance(x, dict) and x.get("id")]
        jobs = [self._map(x) for x in items]
        if not queries:
            return jobs
        terms = [q.lower() for q in queries if q]
        if not terms:
            return jobs
        return [
            j for j in jobs
            if any(t in (j.title + " " + " ".join(j.tags)).lower() for t in terms)
        ]

    def _map(self, item: dict) -> Job:
        salary = None
        if item.get("salary_min") and item.get("salary_max"):
            salary = f"${item['salary_min']:,} - ${item['salary_max']:,}"
        loc = item.get("location") or "Worldwide"
        return Job(
            source=self.name,
            external_id=str(item.get("id")),
            title=item.get("position", "").strip(),
            company=item.get("company", "").strip(),
            url=item.get("url", ""),
            apply_url=item.get("apply_url") or item.get("url"),
            description=_strip_html(item.get("description", "")),
            location=loc,
            regions=[r.strip().lower() for r in str(loc).split(",") if r.strip()],
            salary=salary,
            tags=item.get("tags", []) or [],
            posted_at=item.get("date"),
            raw=item,
        )

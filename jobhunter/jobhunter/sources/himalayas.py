"""Himalayas public jobs API: https://himalayas.app/jobs/api"""
from __future__ import annotations

import re
from jobhunter.models import Job
from jobhunter.sources.base import JobSource


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").replace("&nbsp;", " ").strip()


class HimalayasSource(JobSource):
    name = "himalayas"
    BASE = "https://himalayas.app/jobs/api"

    def fetch(self, queries: list[str]) -> list[Job]:
        data = self._get(self.BASE, params={"limit": 100}).json()
        jobs = [self._map(x) for x in data.get("jobs", [])]
        terms = [q.lower() for q in queries if q]
        if not terms:
            return jobs
        return [
            j for j in jobs
            if any(t in (j.title + " " + " ".join(j.tags)).lower() for t in terms)
        ]

    def _map(self, item: dict) -> Job:
        regions = item.get("locationRestrictions") or []
        return Job(
            source=self.name,
            external_id=str(item.get("guid") or item.get("title")),
            title=(item.get("title") or "").strip(),
            company=(item.get("companyName") or "").strip(),
            url=item.get("applicationLink") or item.get("url") or "",
            apply_url=item.get("applicationLink"),
            description=_strip_html(item.get("description", "")),
            location=", ".join(regions) if regions else "Worldwide",
            regions=[r.lower() for r in regions],
            salary=(f"{item.get('minSalary')}-{item.get('maxSalary')}"
                    if item.get("minSalary") else None),
            tags=(item.get("categories") or []) + (item.get("seniority") or []),
            posted_at=str(item.get("pubDate")) if item.get("pubDate") else None,
            raw=item,
        )

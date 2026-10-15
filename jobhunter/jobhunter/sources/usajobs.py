"""USAJobs API: https://developer.usajobs.gov/
Federal jobs, including many health, Medicaid, compliance, and program-analyst
roles. Supports keyword, location, radius, remote, and minimum salary.

Needs free credentials: USAJOBS_API_KEY and USAJOBS_EMAIL (the email you
registered). Without them this source returns nothing."""
from __future__ import annotations

import os
import re

from jobhunter.config import Config
from jobhunter.models import Job
from jobhunter.sources.base import JobSource


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").replace("&nbsp;", " ").strip()


class USAJobsSource(JobSource):
    name = "usajobs"
    BASE = "https://data.usajobs.gov/api/search"

    def __init__(self, cfg: Config | None = None):
        self.cfg = cfg or Config()
        self.api_key = os.environ.get("USAJOBS_API_KEY", "")
        self.email = os.environ.get("USAJOBS_EMAIL", "")

    def _headers(self) -> dict:
        return {
            "Host": "data.usajobs.gov",
            "User-Agent": self.email,
            "Authorization-Key": self.api_key,
        }

    def fetch(self, queries: list[str]) -> list[Job]:
        if not (self.api_key and self.email):
            return []
        jobs: list[Job] = []
        for q in queries or [""]:
            params = {
                "Keyword": q,
                "ResultsPerPage": 50,
                "DatePosted": min(self.cfg.max_age_days, 60),
            }
            if self.cfg.location:
                params["LocationName"] = self.cfg.location
                params["Radius"] = self.cfg.distance_miles
            if self.cfg.salary_min:
                params["RemunerationMinimumAmount"] = self.cfg.salary_min
            if self.cfg.remote_priority:
                params["RemoteIndicator"] = "True"
            try:
                data = self._get(self.BASE, params=params, headers=self._headers()).json()
            except Exception:
                continue
            items = (data.get("SearchResult", {}) or {}).get("SearchResultItems", [])
            jobs += [self._map(it.get("MatchedObjectDescriptor", {})) for it in items]
        return jobs

    def _map(self, d: dict) -> Job:
        remun = d.get("PositionRemuneration") or [{}]
        sal = None
        if remun and remun[0].get("MinimumRange"):
            sal = f"${remun[0]['MinimumRange']} - ${remun[0].get('MaximumRange', '')}"
        summary = (d.get("UserArea", {}).get("Details", {}) or {}).get("JobSummary", "")
        locs = [l.get("LocationName", "").lower() for l in (d.get("PositionLocation") or [])]
        return Job(
            source=self.name,
            external_id=str(d.get("PositionID") or d.get("MatchedObjectId") or d.get("PositionURI")),
            title=(d.get("PositionTitle") or "").strip(),
            company=(d.get("OrganizationName") or "").strip(),
            url=d.get("PositionURI", ""),
            apply_url=(d.get("ApplyURI") or [d.get("PositionURI", "")])[0],
            description=_strip_html(summary or d.get("QualificationSummary", "")),
            location=d.get("PositionLocationDisplay", ""),
            regions=locs,
            salary=sal,
            tags=[c.get("Name", "") for c in (d.get("JobCategory") or [])],
            posted_at=d.get("PublicationStartDate"),
            raw={"PositionID": d.get("PositionID")},
        )

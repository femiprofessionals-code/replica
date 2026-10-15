"""JobSource interface. Every board implements `fetch(queries)` and returns
normalized `Job` objects. Add a board by implementing this and registering it."""
from __future__ import annotations

from abc import ABC, abstractmethod
import requests

from jobhunter.models import Job

USER_AGENT = "jobhunter/1.0 (+https://github.com/femiprofessionals-code/replica)"
DEFAULT_TIMEOUT = 30


class JobSource(ABC):
    name: str = "base"

    @abstractmethod
    def fetch(self, queries: list[str]) -> list[Job]:
        """Return jobs for the given search queries."""
        raise NotImplementedError

    def _get(self, url: str, params: dict | None = None, headers: dict | None = None):
        h = {"User-Agent": USER_AGENT, "Accept": "application/json"}
        if headers:
            h.update(headers)
        resp = requests.get(url, params=params, headers=h, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()
        return resp


def dedupe(jobs: list[Job]) -> list[Job]:
    """Drop duplicate postings (same stable id) keeping first seen."""
    seen: set[str] = set()
    out: list[Job] = []
    for j in jobs:
        if j.id in seen:
            continue
        seen.add(j.id)
        out.append(j)
    return out

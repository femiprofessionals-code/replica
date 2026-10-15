"""We Work Remotely category RSS feeds. No JSON API, so we parse RSS.
Item titles are formatted "Company: Position"."""
from __future__ import annotations

import re
import feedparser

from jobhunter.models import Job
from jobhunter.sources.base import JobSource

# A sensible default set of remote categories. Configurable later if needed.
CATEGORY_FEEDS = {
    "programming": "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    "devops": "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
    "design": "https://weworkremotely.com/categories/remote-design-jobs.rss",
    "product": "https://weworkremotely.com/categories/remote-product-jobs.rss",
    "data": "https://weworkremotely.com/categories/remote-data-jobs.rss",
}


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text or "").replace("&nbsp;", " ").strip()


class WeWorkRemotelySource(JobSource):
    name = "weworkremotely"

    def __init__(self, categories: list[str] | None = None):
        self.categories = categories or list(CATEGORY_FEEDS.keys())

    def fetch(self, queries: list[str]) -> list[Job]:
        jobs: list[Job] = []
        for cat in self.categories:
            feed_url = CATEGORY_FEEDS.get(cat)
            if not feed_url:
                continue
            parsed = feedparser.parse(feed_url)
            for entry in parsed.entries:
                jobs.append(self._map(entry, cat))
        terms = [q.lower() for q in queries if q]
        if not terms:
            return jobs
        return [j for j in jobs if any(t in (j.title + " " + j.description).lower() for t in terms)]

    def _map(self, entry, category: str) -> Job:
        title_raw = entry.get("title", "")
        company, _, position = title_raw.partition(":")
        if not position:
            company, position = "", title_raw
        region = entry.get("region", "") or ""
        link = entry.get("link", "")
        return Job(
            source=self.name,
            external_id=entry.get("id", link),
            title=position.strip() or title_raw.strip(),
            company=company.strip(),
            url=link,
            apply_url=link,
            description=_strip_html(entry.get("summary", "")),
            location=region or "Remote",
            regions=[region.lower()] if region else ["remote"],
            tags=[category],
            posted_at=entry.get("published"),
            raw={k: entry.get(k) for k in ("title", "link", "published", "region")},
        )

"""Source registry: maps config source names to implementations. Location-aware
sources (adzuna, usajobs) receive the Config so they can filter by place/salary."""
from __future__ import annotations

from jobhunter.config import Config
from jobhunter.sources.base import JobSource
from jobhunter.sources.remotive import RemotiveSource
from jobhunter.sources.remoteok import RemoteOKSource
from jobhunter.sources.weworkremotely import WeWorkRemotelySource
from jobhunter.sources.himalayas import HimalayasSource
from jobhunter.sources.adzuna import AdzunaSource
from jobhunter.sources.usajobs import USAJobsSource

# Builders that take the Config (location/salary aware).
_CFG_BUILDERS = {
    "adzuna": AdzunaSource,
    "usajobs": USAJobsSource,
}

# Builders that take no arguments.
_PLAIN_BUILDERS = {
    "remotive": RemotiveSource,
    "remoteok": RemoteOKSource,
    "weworkremotely": WeWorkRemotelySource,
    "himalayas": HimalayasSource,
}


def build_sources(names: list[str], cfg: Config | None = None) -> list[JobSource]:
    cfg = cfg or Config()
    sources: list[JobSource] = []
    for name in names:
        key = name.lower()
        if key in _CFG_BUILDERS:
            sources.append(_CFG_BUILDERS[key](cfg))
        elif key in _PLAIN_BUILDERS:
            sources.append(_PLAIN_BUILDERS[key]())
    return sources


def available_sources() -> list[str]:
    return list(_CFG_BUILDERS.keys()) + list(_PLAIN_BUILDERS.keys())

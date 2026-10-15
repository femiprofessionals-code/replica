"""Source registry: maps config source names to implementations."""
from __future__ import annotations

from jobhunter.sources.base import JobSource
from jobhunter.sources.remotive import RemotiveSource
from jobhunter.sources.remoteok import RemoteOKSource
from jobhunter.sources.weworkremotely import WeWorkRemotelySource
from jobhunter.sources.himalayas import HimalayasSource

_BUILDERS = {
    "remotive": RemotiveSource,
    "remoteok": RemoteOKSource,
    "weworkremotely": WeWorkRemotelySource,
    "himalayas": HimalayasSource,
}


def build_sources(names: list[str]) -> list[JobSource]:
    sources: list[JobSource] = []
    for name in names:
        builder = _BUILDERS.get(name.lower())
        if builder:
            sources.append(builder())
    return sources


def available_sources() -> list[str]:
    return list(_BUILDERS.keys())

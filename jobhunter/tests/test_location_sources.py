import json
from pathlib import Path

from jobhunter.config import Config
from jobhunter.sources.adzuna import AdzunaSource
from jobhunter.sources.usajobs import USAJobsSource

FIX = Path(__file__).parent / "fixtures"


class FakeResp:
    def __init__(self, payload):
        self._payload = payload

    def json(self):
        return self._payload

    def raise_for_status(self):
        return None


def test_adzuna_skips_without_keys(monkeypatch):
    monkeypatch.delenv("ADZUNA_APP_ID", raising=False)
    monkeypatch.delenv("ADZUNA_APP_KEY", raising=False)
    assert AdzunaSource(Config()).fetch(["compliance"]) == []


def test_adzuna_maps(monkeypatch):
    monkeypatch.setenv("ADZUNA_APP_ID", "x")
    monkeypatch.setenv("ADZUNA_APP_KEY", "y")
    payload = json.loads((FIX / "adzuna.json").read_text())
    cfg = Config(location="Glendale, Maryland", distance_miles=20, salary_min=75000,
                 remote_priority=False)
    src = AdzunaSource(cfg)
    monkeypatch.setattr(src, "_get", lambda *a, **k: FakeResp(payload))

    jobs = src.fetch(["healthcare compliance analyst"])
    assert len(jobs) == 1
    j = jobs[0]
    assert j.source == "adzuna"
    assert j.title == "Healthcare Compliance Analyst"
    assert j.company == "Beacon Health"
    assert "82,000" in j.salary
    assert j.remote is True


def test_usajobs_skips_without_keys(monkeypatch):
    monkeypatch.delenv("USAJOBS_API_KEY", raising=False)
    monkeypatch.delenv("USAJOBS_EMAIL", raising=False)
    assert USAJobsSource(Config()).fetch(["medicaid"]) == []


def test_usajobs_maps(monkeypatch):
    monkeypatch.setenv("USAJOBS_API_KEY", "k")
    monkeypatch.setenv("USAJOBS_EMAIL", "me@example.com")
    payload = json.loads((FIX / "usajobs.json").read_text())
    src = USAJobsSource(Config(location="Glendale, Maryland"))
    monkeypatch.setattr(src, "_get", lambda *a, **k: FakeResp(payload))

    jobs = src.fetch(["medicaid program analyst"])
    assert len(jobs) == 1
    j = jobs[0]
    assert j.source == "usajobs"
    assert j.title == "Medicaid Program Analyst"
    assert "Medicare & Medicaid" in j.company
    assert j.apply_url.endswith("/apply")

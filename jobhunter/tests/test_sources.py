import json
import os
from pathlib import Path

from jobhunter.sources.remotive import RemotiveSource
from jobhunter.sources.remoteok import RemoteOKSource

FIX = Path(__file__).parent / "fixtures"


class FakeResp:
    def __init__(self, payload):
        self._payload = payload

    def json(self):
        return self._payload

    def raise_for_status(self):
        return None


def test_remotive_maps_jobs(monkeypatch):
    payload = json.loads((FIX / "remotive.json").read_text())
    src = RemotiveSource()
    monkeypatch.setattr(src, "_get", lambda *a, **k: FakeResp(payload))

    jobs = src.fetch([""])
    assert len(jobs) == 2
    j = jobs[0]
    assert j.source == "remotive"
    assert j.title == "Senior Python Engineer"
    assert j.company == "Globex"
    assert "python" in j.tags
    assert "<p>" not in j.description  # html stripped
    assert j.id  # stable id computed


def test_remoteok_skips_legal_row_and_filters(monkeypatch):
    payload = json.loads((FIX / "remoteok.json").read_text())
    src = RemoteOKSource()
    monkeypatch.setattr(src, "_get", lambda *a, **k: FakeResp(payload))

    # No query -> returns the single real job (legal row skipped).
    jobs = src.fetch([])
    assert len(jobs) == 1
    assert jobs[0].company == "Globex"
    assert jobs[0].salary == "$130,000 - $170,000"
    assert jobs[0].apply_url == "https://globex.example/careers/99881"

    # Query filter keeps matching, drops non-matching.
    assert len(src.fetch(["kubernetes"])) == 1
    assert len(src.fetch(["designer"])) == 0


def test_stable_id_is_deterministic(monkeypatch):
    payload = json.loads((FIX / "remotive.json").read_text())
    src = RemotiveSource()
    monkeypatch.setattr(src, "_get", lambda *a, **k: FakeResp(payload))
    a = src.fetch([""])
    b = src.fetch([""])
    assert [j.id for j in a] == [j.id for j in b]

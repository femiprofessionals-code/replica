from jobhunter.config import Config, ScoringWeights
from jobhunter.cv import CVProfile
from jobhunter.models import Job
from jobhunter.score import score_job, rank
from jobhunter.documents import generate_documents
from jobhunter.models import now_iso


def make_job(title="Senior Python Engineer", desc="Python AWS PostgreSQL FastAPI", tags=None, **kw):
    return Job(
        source="remotive",
        external_id=kw.get("external_id", "1"),
        title=title,
        company=kw.get("company", "Globex"),
        url="https://example.com/job/1",
        description=desc,
        tags=tags or ["python", "aws"],
        posted_at=now_iso(),
        regions=kw.get("regions", ["worldwide"]),
    )


def base_cfg(**over):
    cfg = Config(
        target_titles=["Python Engineer", "Backend Engineer"],
        skills=["python", "aws", "postgres", "fastapi"],
        nice_to_have=["kubernetes"],
        exclude_keywords=["clearance"],
        min_score=50,
    )
    for k, v in over.items():
        setattr(cfg, k, v)
    return cfg


CV = CVProfile(name="Jane Doe", headline="Senior Backend Engineer",
               summary="Backend engineer focused on Python and AWS.",
               skills=["python", "aws", "docker"])


def test_strong_match_scores_high():
    s = score_job(make_job(), base_cfg(), CV)
    assert not s.disqualified
    assert s.score >= 70
    assert any("skills" in r for r in s.reasons)


def test_exclude_keyword_disqualifies():
    s = score_job(make_job(desc="Requires security clearance"), base_cfg(), CV)
    assert s.disqualified
    assert s.score == 0


def test_required_keyword_filter():
    cfg = base_cfg(required_keywords=["golang"])
    s = score_job(make_job(), cfg, CV)
    assert s.disqualified


def test_region_filter():
    cfg = base_cfg(allowed_regions=["europe"])
    s = score_job(make_job(regions=["usa only"]), cfg, CV)
    assert s.disqualified


def test_ranking_orders_by_score():
    good = make_job(external_id="g")
    weak = make_job(external_id="w", title="Marketing Lead", desc="SEO and ads", tags=["marketing"])
    ranked = rank([weak, good], base_cfg(), CV)
    assert ranked[0].job.external_id == "g"


def test_documents_template_fallback(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    s = score_job(make_job(), base_cfg(), CV)
    docs = generate_documents(s, CV)
    assert docs.model_used == "template"
    assert "Globex" in docs.cover_letter
    assert "Senior Python Engineer" in docs.cover_letter
    assert "Jane Doe" in docs.cover_letter  # uses real CV name, nothing invented

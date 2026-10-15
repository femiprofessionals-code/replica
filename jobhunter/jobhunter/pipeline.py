"""Pipeline orchestration. Ties sources, scoring, documents, and the tracker
together. The apply step is deliberately conservative: it only auto-submits
where a legitimate email-apply path exists and the user has opted in; otherwise
it prepares the package and leaves submission to the human."""
from __future__ import annotations

import os

from jobhunter.config import Config
from jobhunter.cv import CVProfile
from jobhunter.models import Job, Stage, now_iso
from jobhunter.sources.base import dedupe
from jobhunter.sources.registry import build_sources
from jobhunter.score import rank
from jobhunter.documents import generate_documents, generate_resume
from jobhunter.tracker.base import Tracker
from jobhunter.report import send_email


def run_search(cfg: Config, cv: CVProfile, tracker: Tracker) -> dict:
    """Fetch, score, and queue the best new matches with tailored docs."""
    sources = build_sources(cfg.sources, cfg)
    raw: list[Job] = []
    errors: list[str] = []
    for src in sources:
        try:
            raw.extend(src.fetch(cfg.queries))
        except Exception as e:  # one bad source must not kill the run
            errors.append(f"{src.name}: {e}")
    raw = dedupe(raw)

    scored = rank(raw, cfg, cv)
    known = tracker.known_ids()

    queued = 0
    new_found = 0
    for s in scored:
        job = s.job
        is_new = job.id not in known
        record = {
            **job.to_row(),
            "score": s.score,
            "reasons": "; ".join(s.reasons),
            "updated_at": now_iso(),
        }
        if is_new:
            record["found_at"] = now_iso()
            new_found += 1

        # Queue tailored docs for strong matches, within the daily cap.
        if s.score >= cfg.min_score and queued < cfg.daily_apply_cap and is_new:
            docs = generate_documents(s, cv)
            record["stage"] = Stage.QUEUED.value
            record["cv_summary"] = docs.cv_summary
            record["cover_letter"] = docs.cover_letter
            record["ats_match"] = docs.ats_match
            record["tailoring_summary"] = docs.tailoring_summary
            record["model_used"] = docs.model_used
            queued += 1
        elif is_new:
            record["stage"] = Stage.SCORED.value

        if is_new:
            tracker.upsert(record)

    return {
        "fetched": len(raw),
        "new": new_found,
        "queued": queued,
        "errors": errors,
    }


def approve(tracker: Tracker, ids: list[str]) -> int:
    n = 0
    for rid in ids:
        tracker.upsert({"id": rid, "stage": Stage.APPROVED.value, "updated_at": now_iso()})
        n += 1
    return n


def run_apply(tracker: Tracker, cfg: Config, cv: CVProfile) -> dict:
    """Process approved rows: generate the full tailored resume, then submit only
    via email-apply when opted in; otherwise leave a clear manual note."""
    send_enabled = os.environ.get("SEND_APPLICATIONS", "").lower() == "true"
    approved = tracker.by_stage(Stage.APPROVED.value)
    submitted, manual = 0, 0

    for r in approved[: cfg.daily_apply_cap]:
        update: dict = {"id": r["id"], "updated_at": now_iso()}

        # Generate the tailored resume now (only for jobs the user approved).
        if not (r.get("resume") or "").strip():
            job = Job(
                source=r.get("source", ""),
                external_id=str(r.get("id")),
                title=r.get("title", ""),
                company=r.get("company", ""),
                url=r.get("url", ""),
                description=r.get("description", ""),
            )
            update["resume"] = generate_resume(job, cv)

        apply_email = (r.get("apply_email") or "").strip()
        if send_enabled and apply_email:
            subject = f"Application: {r.get('title')} - {r.get('company')}"
            body = r.get("cover_letter") or ""
            if send_email(subject, body):
                update.update(stage=Stage.APPLIED.value, applied_at=now_iso(),
                              notes="submitted by email")
                tracker.upsert(update)
                submitted += 1
                continue
        update["notes"] = f"ready to submit manually: {r.get('apply_url') or r.get('url')}"
        tracker.upsert(update)
        manual += 1

    return {"submitted": submitted, "manual": manual}

"""Deterministic, transparent match scoring. No model is involved so every
score is explainable and reproducible. Numbers never come from an LLM."""
from __future__ import annotations

from datetime import datetime, timezone
import re

from dateutil import parser as dateparser

from jobhunter.config import Config
from jobhunter.cv import CVProfile
from jobhunter.models import Job, ScoredJob


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9\+\#\.]+", (text or "").lower()))


def _job_text(job: Job) -> str:
    return " ".join([job.title, job.company, job.description, " ".join(job.tags)])


def _age_days(posted_at: str | None) -> float | None:
    if not posted_at:
        return None
    try:
        dt = dateparser.parse(posted_at)
    except (ValueError, OverflowError, TypeError):
        return None
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - dt).total_seconds() / 86400.0


def score_job(job: Job, cfg: Config, cv: CVProfile) -> ScoredJob:
    text = _job_text(job).lower()
    job_tokens = _tokens(text)
    reasons: list[str] = []
    missing: list[str] = []

    # ---- Hard filters (disqualify) ----
    if cfg.exclude_keywords:
        hit = [k for k in cfg.exclude_keywords if k.lower() in text]
        if hit:
            return ScoredJob(job, 0, reasons=[f"excluded by: {', '.join(hit)}"], disqualified=True)

    if cfg.required_keywords:
        if not any(k.lower() in text for k in cfg.required_keywords):
            return ScoredJob(
                job, 0,
                reasons=[f"missing all required keywords: {', '.join(cfg.required_keywords)}"],
                disqualified=True,
            )

    if cfg.allowed_regions and job.regions:
        jr = " ".join(job.regions)
        if not any(r.lower() in jr for r in cfg.allowed_regions):
            return ScoredJob(job, 0, reasons=[f"region {job.regions} not allowed"], disqualified=True)

    age = _age_days(job.posted_at)
    if age is not None and age > cfg.max_age_days:
        return ScoredJob(job, 0, reasons=[f"older than {cfg.max_age_days} days"], disqualified=True)

    w = cfg.weights

    # ---- Title match ----
    title_tokens = _tokens(job.title)
    title_score = 0.0
    if cfg.target_titles:
        best = 0.0
        for t in cfg.target_titles:
            tt = _tokens(t)
            if tt:
                overlap = len(tt & title_tokens) / len(tt)
                best = max(best, overlap)
        title_score = best
        if best >= 0.5:
            reasons.append(f"title matches target ({int(best*100)}%)")
    title_points = round(title_score * w.title)

    # ---- Skills match ----
    all_skills = [s.lower() for s in (cfg.skills + cv.skills)]
    all_skills = list(dict.fromkeys(all_skills))  # dedupe, preserve order
    matched_skills = [s for s in all_skills if s in text or _tokens(s) & job_tokens]
    skills_frac = (len(matched_skills) / len(all_skills)) if all_skills else 0.0
    skills_points = round(skills_frac * w.skills)
    if matched_skills:
        reasons.append(f"skills: {', '.join(sorted(set(matched_skills))[:6])}")
    missing = [s for s in cfg.skills if s.lower() not in [m for m in matched_skills]]

    # ---- Nice-to-have keywords ----
    kw_frac = 0.0
    if cfg.nice_to_have:
        present = [k for k in cfg.nice_to_have if k.lower() in text]
        kw_frac = len(present) / len(cfg.nice_to_have)
        if present:
            reasons.append(f"bonus: {', '.join(present[:4])}")
    kw_points = round(kw_frac * w.keywords)

    # ---- Recency ----
    if age is None:
        recency_frac = 0.5
    else:
        recency_frac = max(0.0, 1.0 - (age / max(cfg.max_age_days, 1)))
    recency_points = round(recency_frac * w.recency)

    total = title_points + skills_points + kw_points + recency_points
    # Normalize to 0-100 against configured weight total.
    score = round(total / max(w.total, 1) * 100)

    return ScoredJob(job, score=score, reasons=reasons, missing=missing, disqualified=False)


def rank(jobs: list[Job], cfg: Config, cv: CVProfile) -> list[ScoredJob]:
    scored = [score_job(j, cfg, cv) for j in jobs]
    live = [s for s in scored if not s.disqualified]
    live.sort(key=lambda s: s.score, reverse=True)
    return live

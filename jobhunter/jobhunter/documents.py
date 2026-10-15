"""Document generation: tailored CV summary + cover letter.

Facts come only from the CV. When ANTHROPIC_API_KEY is set we use Claude to
phrase the copy (copy only, never numbers or claims not in the CV); otherwise
we fall back to a deterministic template. This mirrors the rule from the rest
of the stack: AI for wording, never for facts."""
from __future__ import annotations

import os

from jobhunter.cv import CVProfile
from jobhunter.models import Job, ScoredJob, ApplicationDocs

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5")

SYSTEM = (
    "You write concise, honest job application copy. You may ONLY use facts "
    "present in the candidate's CV. Never invent employers, dates, metrics, "
    "degrees, or skills the CV does not state. No hype, no em dashes. If the CV "
    "lacks something the job wants, do not claim it."
)


def _template_cover_letter(job: Job, cv: CVProfile, matched: list[str]) -> str:
    skills = ", ".join(matched[:5]) if matched else ", ".join(cv.skills[:5])
    name = cv.name or "The candidate"
    intro = cv.summary.split("\n")[0].strip() if cv.summary else ""
    lines = [
        f"Dear {job.company or 'Hiring Team'},",
        "",
        f"I am applying for the {job.title} role. {intro}".strip(),
        "",
        (
            f"My background lines up with what you are looking for, "
            f"particularly {skills}." if skills else
            "My background lines up with what you are looking for."
        ),
        "",
        "I would welcome the chance to discuss how I can contribute to your team.",
        "",
        "Best regards,",
        name,
    ]
    return "\n".join(lines)


def _template_summary(job: Job, cv: CVProfile, matched: list[str]) -> str:
    base = cv.headline or (cv.summary.split(".")[0] if cv.summary else cv.name)
    focus = f" Focused on {', '.join(matched[:4])}." if matched else ""
    return (base + focus).strip()


def _anthropic_generate(job: Job, cv: CVProfile, matched: list[str]) -> ApplicationDocs | None:
    try:
        import anthropic
    except ImportError:
        return None
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None

    client = anthropic.Anthropic()
    prompt = (
        f"Candidate CV (the only allowed source of facts):\n---\n{cv.raw_text[:6000]}\n---\n\n"
        f"Job: {job.title} at {job.company}\n"
        f"Job description (excerpt):\n{job.description[:2500]}\n\n"
        f"Skills that overlap: {', '.join(matched) or '(none detected)'}\n\n"
        "Write two sections separated by a line '===COVER==='.\n"
        "First: a one or two sentence tailored CV summary for this role.\n"
        "After the marker: a cover letter of 150-200 words. Plain, specific, honest."
    )
    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=900,
            system=SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
    except Exception:
        return None

    if "===COVER===" in text:
        summary, cover = text.split("===COVER===", 1)
    else:
        summary, cover = _template_summary(job, cv, matched), text
    return ApplicationDocs(
        job_id=job.id,
        cover_letter=cover.strip(),
        cv_summary=summary.strip(),
        highlighted_skills=matched,
        model_used=MODEL,
    )


def generate_documents(scored: ScoredJob, cv: CVProfile) -> ApplicationDocs:
    job = scored.job
    matched = [r.split(":", 1)[1].strip() for r in scored.reasons if r.startswith("skills:")]
    matched_skills = matched[0].split(", ") if matched else []

    via_ai = _anthropic_generate(job, cv, matched_skills)
    if via_ai:
        return via_ai

    return ApplicationDocs(
        job_id=job.id,
        cover_letter=_template_cover_letter(job, cv, matched_skills),
        cv_summary=_template_summary(job, cv, matched_skills),
        highlighted_skills=matched_skills,
        model_used="template",
    )

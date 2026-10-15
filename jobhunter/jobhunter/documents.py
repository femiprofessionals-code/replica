"""Document generation: tailored cover letter, CV summary, and (on approval) a
full tailored resume.

The rules are adapted from the candidate's own resume-tailoring prompt: treat
the CV as the single Source of Truth, never invent anything, optimize for ATS
and human recruiters, and write bullets as Action -> Scope -> Result -> Impact.
When ANTHROPIC_API_KEY is set we use Claude for the wording; otherwise a
deterministic template. Facts always come from the CV, never from the model."""
from __future__ import annotations

import os
import re

from jobhunter.cv import CVProfile
from jobhunter.models import Job, ScoredJob, ApplicationDocs

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5")

# Condensed from the candidate's Source-of-Truth prompt. The essentials only.
SYSTEM = (
    "You are an expert resume strategist and ATS optimization specialist. The "
    "candidate CV is the single Source of Truth: if a fact is not in it or "
    "reasonably implied by it, you do not include it. Never invent metrics, "
    "skills, employers, dates, certifications, software, or responsibilities, "
    "and never exaggerate scope. Optimize for both ATS parsers and human "
    "recruiters: mirror the job description's terminology only where it is "
    "truthful, incorporate real keywords naturally, and write accomplishments "
    "as Action -> Scope -> Result -> Business Impact. Plain language, no hype, "
    "no em dashes. If a stronger claim would need unsupported information, use "
    "the truthful version instead."
)


def _anthropic():
    try:
        import anthropic
    except ImportError:
        return None
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None
    return anthropic.Anthropic()


def _matched_skills(scored: ScoredJob) -> list[str]:
    for r in scored.reasons:
        if r.startswith("skills:"):
            return [s.strip() for s in r.split(":", 1)[1].split(",")]
    return []


# --------------------------------------------------------------------------
# Search-time: cover letter + tailored summary + ATS estimate (lighter spend)
# --------------------------------------------------------------------------

def _template_cover_letter(job: Job, cv: CVProfile, matched: list[str]) -> str:
    skills = ", ".join(matched[:5]) if matched else ", ".join(cv.skills[:5])
    name = cv.name or "The candidate"
    intro = cv.summary.split("\n")[0].strip() if cv.summary else ""
    return "\n".join([
        f"Dear {job.company or 'Hiring Team'},",
        "",
        f"I am applying for the {job.title} role. {intro}".strip(),
        "",
        (f"My background aligns with this position, particularly {skills}."
         if skills else "My background aligns closely with this position."),
        "",
        "I would welcome the chance to discuss how I can contribute to your team.",
        "",
        "Best regards,",
        name,
    ])


def _template_summary(job: Job, cv: CVProfile, matched: list[str]) -> str:
    base = cv.headline or (cv.summary.split(".")[0] if cv.summary else cv.name)
    focus = f" Focused on {', '.join(matched[:4])}." if matched else ""
    return (base + focus).strip()


def generate_documents(scored: ScoredJob, cv: CVProfile) -> ApplicationDocs:
    """Cover letter + tailored summary + ATS estimate for a queued job."""
    job = scored.job
    matched = _matched_skills(scored)
    client = _anthropic()

    if client:
        prompt = (
            f"Resume Source of Truth:\n---\n{cv.raw_text[:6000]}\n---\n\n"
            f"Target role: {job.title} at {job.company}\n"
            f"Job description (excerpt):\n{job.description[:2500]}\n\n"
            "Return exactly three sections separated by the markers shown:\n"
            "[SUMMARY] a 1-2 sentence tailored professional summary for this role.\n"
            "[COVER] a 150-200 word cover letter, specific and honest.\n"
            "[ATS] a single integer 0-100 estimating ATS keyword match, then a "
            "short phrase on what you emphasized."
        )
        try:
            msg = client.messages.create(
                model=MODEL, max_tokens=900, system=SYSTEM,
                messages=[{"role": "user", "content": prompt}],
            )
            text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
            summary = _between(text, "[SUMMARY]", "[COVER]") or _template_summary(job, cv, matched)
            cover = _between(text, "[COVER]", "[ATS]") or _template_cover_letter(job, cv, matched)
            ats_block = _after(text, "[ATS]")
            ats = _first_int(ats_block)
            return ApplicationDocs(
                job_id=job.id, cover_letter=cover.strip(), cv_summary=summary.strip(),
                highlighted_skills=matched, ats_match=ats, tailoring_summary=ats_block.strip()[:300],
                model_used=MODEL,
            )
        except Exception:
            pass

    return ApplicationDocs(
        job_id=job.id,
        cover_letter=_template_cover_letter(job, cv, matched),
        cv_summary=_template_summary(job, cv, matched),
        highlighted_skills=matched,
        ats_match=scored.score,  # fall back to the deterministic match score
        tailoring_summary=f"Emphasized: {', '.join(matched[:5])}" if matched else "",
        model_used="template",
    )


# --------------------------------------------------------------------------
# On approval: full tailored resume (only for jobs the user wants)
# --------------------------------------------------------------------------

def generate_resume(job: Job, cv: CVProfile) -> str:
    """Produce a full tailored resume in Markdown, strictly from the CV."""
    client = _anthropic()
    if client:
        prompt = (
            f"Resume Source of Truth:\n---\n{cv.raw_text[:9000]}\n---\n\n"
            f"Target role: {job.title} at {job.company}\n"
            f"Job description:\n{job.description[:4000]}\n\n"
            "Produce a complete, ATS-friendly resume in Markdown tailored to this "
            "role. Use standard headings (Summary, Core Competencies, Experience, "
            "Education and Certifications). Select and reorder the most relevant "
            "bullets, mirror the job's language only where truthful, and keep every "
            "claim supported by the Source of Truth. Do not invent anything."
        )
        try:
            msg = client.messages.create(
                model=MODEL, max_tokens=2000, system=SYSTEM,
                messages=[{"role": "user", "content": prompt}],
            )
            out = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text").strip()
            if out:
                return out
        except Exception:
            pass
    # Fallback: the base CV is already a truthful, ATS-friendly resume.
    return cv.raw_text


# ---- small text helpers ----

def _between(text: str, a: str, b: str) -> str:
    if a in text and b in text:
        return text.split(a, 1)[1].split(b, 1)[0].strip()
    return ""


def _after(text: str, a: str) -> str:
    return text.split(a, 1)[1].strip() if a in text else ""


def _first_int(text: str) -> int:
    m = re.search(r"\d{1,3}", text or "")
    if not m:
        return 0
    return max(0, min(100, int(m.group(0))))

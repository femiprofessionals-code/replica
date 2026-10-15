"""Reporting: compute pipeline stats and deliver a Markdown report by email.
Scheduled for Tuesdays and Fridays via GitHub Actions."""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone, timedelta
import os
import smtplib
from email.mime.text import MIMEText

from jobhunter.tracker.base import Tracker


def _recent(records: list[dict], days: int, field: str) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    out = []
    for r in records:
        val = r.get(field)
        if not val:
            continue
        try:
            dt = datetime.fromisoformat(str(val))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        if dt >= cutoff:
            out.append(r)
    return out


def build_report(tracker: Tracker, window_days: int = 4) -> str:
    records = tracker.all_records()
    stages = Counter((r.get("stage") or "unknown") for r in records)

    new_jobs = _recent(records, window_days, "found_at")
    applied = _recent(records, window_days, "applied_at")
    awaiting = [r for r in records if (r.get("stage") or "") == "queued"]
    approved = [r for r in records if (r.get("stage") or "") == "approved"]
    responses = [r for r in records if (r.get("response") or "").strip()]

    today = datetime.now(timezone.utc).strftime("%A, %d %b %Y")
    lines = [
        f"# JobHunter report - {today}",
        "",
        f"Window: last {window_days} days.",
        "",
        "## Pipeline",
        f"- Total tracked: {len(records)}",
        f"- New this period: {len(new_jobs)}",
        f"- Awaiting your approval: {len(awaiting)}",
        f"- Approved, not yet submitted: {len(approved)}",
        f"- Applied this period: {len(applied)}",
        f"- Employer responses so far: {len(responses)}",
        "",
        "## By stage",
    ]
    for stage, count in stages.most_common():
        lines.append(f"- {stage}: {count}")

    if awaiting:
        lines += ["", "## Top matches awaiting approval"]
        top = sorted(awaiting, key=lambda r: int(r.get("score") or 0), reverse=True)[:10]
        for r in top:
            lines.append(
                f"- [{r.get('score')}] {r.get('title')} at {r.get('company')} "
                f"({r.get('source')}) - {r.get('url')}"
            )
        lines.append("")
        lines.append("Approve in the sheet by setting the `stage` cell to `approved`.")

    if responses:
        lines += ["", "## Responses"]
        for r in responses[:10]:
            lines.append(f"- {r.get('company')} - {r.get('title')}: {r.get('response')}")

    return "\n".join(lines)


def send_email(subject: str, body: str, *, html: bool = False) -> bool:
    """Send via Resend if RESEND_API_KEY is set, else SMTP. Returns True if sent."""
    to = os.environ.get("REPORT_TO")
    if not to:
        return False

    if os.environ.get("RESEND_API_KEY"):
        try:
            import requests

            requests.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {os.environ['RESEND_API_KEY']}"},
                json={
                    "from": os.environ.get("REPORT_FROM", "JobHunter <onboarding@resend.dev>"),
                    "to": [to],
                    "subject": subject,
                    ("html" if html else "text"): body,
                },
                timeout=30,
            ).raise_for_status()
            return True
        except Exception:
            return False

    host = os.environ.get("SMTP_HOST")
    if not host:
        return False
    try:
        msg = MIMEText(body, "html" if html else "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = os.environ.get("REPORT_FROM", os.environ.get("SMTP_USER", ""))
        msg["To"] = to
        with smtplib.SMTP(host, int(os.environ.get("SMTP_PORT", "587"))) as s:
            s.starttls()
            if os.environ.get("SMTP_USER"):
                s.login(os.environ["SMTP_USER"], os.environ.get("SMTP_PASS", ""))
            s.send_message(msg)
        return True
    except Exception:
        return False

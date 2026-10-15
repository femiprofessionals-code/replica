"""CV profile. Loaded from a Markdown file. The parsed facts are the ONLY
source for generated documents; nothing here is invented."""
from __future__ import annotations

from dataclasses import dataclass, field
import re


@dataclass
class CVProfile:
    name: str = ""
    headline: str = ""
    summary: str = ""
    skills: list[str] = field(default_factory=list)
    sections: dict[str, str] = field(default_factory=dict)
    raw_text: str = ""

    @staticmethod
    def load(path: str) -> "CVProfile":
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        return CVProfile.parse(text)

    @staticmethod
    def parse(text: str) -> "CVProfile":
        name = ""
        m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
        if m:
            name = m.group(1).strip()

        # Split into "## Section" blocks.
        sections: dict[str, str] = {}
        current = None
        buf: list[str] = []
        for line in text.splitlines():
            h = re.match(r"^##\s+(.+)$", line)
            if h:
                if current is not None:
                    sections[current] = "\n".join(buf).strip()
                current = h.group(1).strip().lower()
                buf = []
            elif current is not None:
                buf.append(line)
        if current is not None:
            sections[current] = "\n".join(buf).strip()

        summary = ""
        for key in ("summary", "profile", "about"):
            if key in sections:
                summary = sections[key]
                break

        headline = ""
        hm = re.search(r"^#\s+.+\n+([^\n#].*)$", text, re.MULTILINE)
        if hm:
            headline = hm.group(1).strip()

        skills = CVProfile._extract_skills(sections)

        return CVProfile(
            name=name,
            headline=headline,
            summary=summary,
            skills=skills,
            sections=sections,
            raw_text=text,
        )

    @staticmethod
    def _extract_skills(sections: dict[str, str]) -> list[str]:
        for key in ("skills", "technical skills", "core skills", "technologies"):
            if key in sections:
                blob = sections[key]
                # Split on commas, bullets, pipes, newlines.
                parts = re.split(r"[,\n•\|•]+", blob)
                out = []
                for p in parts:
                    s = re.sub(r"^[\s\-*]+", "", p).strip()
                    if s and len(s) <= 40:
                        out.append(s)
                return out
        return []

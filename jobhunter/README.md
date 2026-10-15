# JobHunter

Finds remote jobs that fit a specific CV, tailors the application documents,
queues them for your approval, records the whole process in a sheet, and emails
you a report every Tuesday and Friday.

Built on a **review-and-approve** model: the system does the searching, scoring,
and drafting, but nothing is submitted to an employer until it is approved. It
pulls from boards with legitimate public APIs (Adzuna, USAJobs, Remotive,
Himalayas), so it does not scrape or risk accounts on sites that forbid
automation.

## Profiles

A profile is a CV (the resume "Source of Truth") plus a search config. The
committed profile is `profiles/jummy/` (healthcare regulatory/compliance:
Medicaid, DDA, HIPAA, audit readiness). Point the CLI at it with
`--cv profiles/jummy/cv.md --config profiles/jummy/config.yaml` or the
`JOBHUNTER_CV` / `JOBHUNTER_CONFIG` env vars.

## Sources

| Source | Industries | Location/salary filter | Key needed |
| --- | --- | --- | --- |
| `adzuna` | all (incl. healthcare) | yes (city + radius + salary) | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` (free) |
| `usajobs` | federal (health/Medicaid/compliance) | yes | `USAJOBS_API_KEY`, `USAJOBS_EMAIL` (free) |
| `remotive` | remote, broad | no | none |
| `himalayas` | remote, broad | no | none |
| `remoteok` | remote tech | no | none |
| `weworkremotely` | remote, category feeds | no | none |

A source with a missing key is skipped quietly so the rest of the run proceeds.

## How it works

```
sources -> normalize -> score against CV -> tailor docs -> QUEUE (await approval)
                                                               |
                                            you approve in the sheet
                                                               v
                                        apply (email-apply + opt-in) or manual
                                                               |
                                              tracked in Google Sheet
                                                               v
                                       Tue/Fri email report (GitHub Actions)
```

- **Sources** (`jobhunter/sources/`): one adapter per board behind a single
  `JobSource` interface. Add a board by implementing it and registering it.
- **Scoring** (`score.py`): deterministic and explainable. Title, skills,
  bonus keywords, and recency, weighted to a 0-100 score. Hard filters
  (excluded keywords, required keywords, region, age) disqualify up front.
  No model is involved in scoring, so every number is reproducible.
- **Documents** (`documents.py`): a tailored CV summary and cover letter at
  queue time, and a full tailored resume generated on approval (to control
  cost). The rules are adapted from the candidate's own resume-tailoring prompt:
  the CV is the single Source of Truth, nothing is invented, bullets follow
  Action -> Scope -> Result -> Impact, and copy is ATS-aware. Uses the Anthropic
  API when `ANTHROPIC_API_KEY` is set, else a deterministic template.
- **Tracker** (`tracker/`): Google Sheets when configured, local CSV otherwise.
  One row per job across the full pipeline. You approve by setting the `stage`
  cell to `approved`.
- **Reporting** (`report.py`): pipeline stats as Markdown, delivered by Resend
  or SMTP.

## Apply modes (safety)

Submission is conservative by design:
- Jobs reach `queued`, then only move forward once you mark them `approved`.
- `apply` auto-submits **only** postings that expose an email-apply address,
  and **only** when `SEND_APPLICATIONS=true`. Everything else is left with a
  one-line note and the apply link for you to finish by hand.
- Nothing on LinkedIn/Indeed is scraped or auto-applied.

## Quick start (local)

```bash
cd jobhunter
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

# Use the committed profile (or copy the examples for a new person).
export JOBHUNTER_CONFIG=profiles/jummy/config.yaml
export JOBHUNTER_CV=profiles/jummy/cv.md

python -m jobhunter search           # fetch, score, queue tailored docs
python -m jobhunter report --print   # see the pipeline report
python -m jobhunter approve <id>...  # or set stage=approved in the sheet
python -m jobhunter apply            # resume + submit approved (email-apply + opt-in)
```

Without any keys it still runs: free sources work, documents fall back to
templates, and the tracker is a local CSV. Adzuna/USAJobs need their free keys
to return results.

## Security

- Never put a password in this repo, a config, or a secret value that is logged.
  For email, use a Gmail **App Password** (revocable), not the account password.
- The Google Sheet is accessed by a **service account** you share the sheet
  with. The system never logs into anyone's Gmail with their password.
- Treat any credential shared in plain text as compromised and rotate it.

## Going live (Google Sheet + Tue/Fri reports)

The engine runs on **GitHub Actions** (`.github/workflows/jobhunter.yml` at the
repo root), which has open network access to the job boards:

- daily `search` at 07:07 UTC
- `report` on Tuesday and Friday at 13:17 UTC
- manual `workflow_dispatch` with a `task` input (search/report/apply)

Set these as repository secrets (all optional except where noted):

| Secret | Purpose |
| --- | --- |
| `JOBHUNTER_CV_B64` | base64 of your `cv.md` (keeps the CV out of git) |
| `JOBHUNTER_CONFIG_B64` | base64 of your `config.yaml` |
| `ANTHROPIC_API_KEY` | enables tailored copy (else templates) |
| `JOBHUNTER_SHEET_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Sheet tracker |
| `RESEND_API_KEY` or `SMTP_*` | report + email-apply delivery |
| `REPORT_TO`, `REPORT_FROM` | report recipient/sender |
| `SEND_APPLICATIONS` | `true` to allow email-apply auto-submit |

### Google Sheet setup

1. Create a Google Cloud service account, download its JSON key.
2. Create a Google Sheet, share it with the service account email as Editor.
3. Put the sheet id in `JOBHUNTER_SHEET_ID` and the key JSON in
   `GOOGLE_SERVICE_ACCOUNT_JSON`. The `Applications` worksheet and header are
   created automatically.

## Tests

```bash
. .venv/bin/activate && python -m pytest -q
```

Parsing, scoring, document fallback, CV parsing, and the tracker are covered
with offline fixtures, so the suite runs without network or secrets.

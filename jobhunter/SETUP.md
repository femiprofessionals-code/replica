# JobHunter go-live runbook (Adejumoke Adeyemi)

Everything on the code side is done. This is the operator checklist to turn the
automation on. Nothing here puts a password in the repo.

## 0. What is already wired

- Profile: `profiles/jummy/cv.md` (resume Source of Truth) + `profiles/jummy/config.yaml`.
- Tracker Google Sheet ID: `1rFfLriFhNkAkEo_fFqNk89flkOk33Ml4W5Vjf_xVqIs`
  (set as the default in `.github/workflows/jobhunter.yml`; override with the
  `JOBHUNTER_SHEET_ID` secret if the sheet ever changes).
- Schedule (GitHub Actions): daily search 07:07 UTC, reports Tue + Fri 13:17 UTC.

## 1. Free job-source API keys

- Adzuna: sign up at https://developer.adzuna.com/ -> get `app_id` and `app_key`.
- USAJobs: request a key at https://developer.usajobs.gov/apirequest/ -> you get
  an API key tied to the email you register.

## 2. Google service account (lets the automation write the sheet)

1. In Google Cloud Console, create a service account and a JSON key.
2. Enable the Google Sheets API for that project.
3. Open the tracker sheet (in the adeyemijummi account) -> Share -> add the
   service account's email (ends in `.iam.gserviceaccount.com`) as **Editor**.

## 3. Email for the Tuesday/Friday reports (pick one)

- Resend: get an API key at https://resend.com -> set `RESEND_API_KEY`.
- Or Gmail SMTP: create a Gmail **App Password** (Google Account -> Security ->
  App passwords), set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`,
  `SMTP_USER=<the gmail>`, `SMTP_PASS=<app password>`. Never the real password.

## 4. Add GitHub repository secrets

Repo -> Settings -> Secrets and variables -> Actions -> New repository secret:

| Secret | Value |
| --- | --- |
| `ADZUNA_APP_ID` | from step 1 |
| `ADZUNA_APP_KEY` | from step 1 |
| `USAJOBS_API_KEY` | from step 1 |
| `USAJOBS_EMAIL` | the email you registered with USAJobs |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | the full service-account JSON from step 2 |
| `ANTHROPIC_API_KEY` | optional, enables AI-tailored resume/cover copy |
| `REPORT_TO` | adeyemijummi@gmail.com (report recipient) |
| `RESEND_API_KEY` *or* `SMTP_*` | from step 3 |
| `SEND_APPLICATIONS` | leave unset (or `false`) to keep submit human-reviewed |

## 5. Turn it on

- Actions tab -> JobHunter -> Run workflow -> `search` to do the first run now.
- Check the sheet fills with scored, tailored rows at `stage = queued`.
- Approve the ones to pursue by setting their `stage` cell to `approved`.
- Run `apply` (or wait for the daily run) to generate the full tailored resume
  and record each as submitted (email-apply) or ready for manual submit.
- Reports arrive automatically Tue + Fri.

## Apply model (as agreed)

The system finds, scores, tailors (resume + cover letter), logs, and queues at
volume. A person submits from the prepared package; only postings that expose an
email-apply address are auto-sent, and only if `SEND_APPLICATIONS=true`. No
scraping or bot submission to employer portals.

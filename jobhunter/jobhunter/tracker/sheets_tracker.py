"""Google Sheets tracker using a service account. The sheet is the user-facing
record of the whole process and the place they approve applications (set the
`stage` cell to `approved`)."""
from __future__ import annotations

import json
import os

from jobhunter.tracker.base import Tracker, COLUMNS


class SheetsTracker(Tracker):
    """Requires gspread + a service account.

    Env:
      GOOGLE_SERVICE_ACCOUNT_JSON  inline JSON, or
      GOOGLE_APPLICATION_CREDENTIALS  path to the JSON key file
      JOBHUNTER_SHEET_ID  the spreadsheet id (shared with the service account)
    """

    def __init__(self, sheet_id: str | None = None, worksheet: str | None = None):
        import gspread
        from google.oauth2.service_account import Credentials

        scopes = ["https://www.googleapis.com/auth/spreadsheets"]
        inline = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
        if inline:
            info = json.loads(inline)
            creds = Credentials.from_service_account_info(info, scopes=scopes)
        else:
            path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if not path:
                raise RuntimeError(
                    "Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS."
                )
            creds = Credentials.from_service_account_file(path, scopes=scopes)

        self.gc = gspread.authorize(creds)
        self.sheet_id = sheet_id or os.environ["JOBHUNTER_SHEET_ID"]
        sh = self.gc.open_by_key(self.sheet_id)

        # Use a named tab if asked, else the first tab of the imported sheet.
        name = worksheet or os.environ.get("JOBHUNTER_WORKSHEET")
        if name:
            try:
                self.ws = sh.worksheet(name)
            except Exception:
                self.ws = sh.add_worksheet(title=name, rows=1000, cols=len(COLUMNS))
        else:
            self.ws = sh.sheet1

        self._ensure_header()

    def _ensure_header(self) -> None:
        header = self.ws.row_values(1)
        if header != COLUMNS:
            self.ws.update(range_name="A1", values=[COLUMNS])

    def _records(self) -> list[dict]:
        rows = self.ws.get_all_records(expected_headers=COLUMNS)
        return rows

    def known_ids(self) -> set[str]:
        return {str(r.get("id")) for r in self._records() if r.get("id")}

    def _id_to_rownum(self) -> dict[str, int]:
        ids = self.ws.col_values(1)  # includes header at index 0
        return {val: i + 1 for i, val in enumerate(ids) if i > 0 and val}

    def upsert(self, record: dict) -> None:
        row = [("" if record.get(c) is None else str(record.get(c, ""))) for c in COLUMNS]
        rid = str(record["id"])
        mapping = self._id_to_rownum()
        if rid in mapping:
            rownum = mapping[rid]
            # Merge: only overwrite provided fields to preserve manual edits.
            existing = self.ws.row_values(rownum)
            existing += [""] * (len(COLUMNS) - len(existing))
            merged = [
                row[i] if (record.get(COLUMNS[i]) not in (None, "")) else existing[i]
                for i in range(len(COLUMNS))
            ]
            self.ws.update(range_name=f"A{rownum}", values=[merged])
        else:
            self.ws.append_row(row, value_input_option="RAW")

    def all_records(self) -> list[dict]:
        return self._records()

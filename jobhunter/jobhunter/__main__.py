"""JobHunter command line.

  python -m jobhunter search     # fetch, score, queue tailored docs
  python -m jobhunter approve ID [ID...]
  python -m jobhunter apply      # submit approved (email-apply + opt-in only)
  python -m jobhunter report     # build + email the Tue/Fri report
  python -m jobhunter sources    # list available sources
"""
from __future__ import annotations

import argparse
import os
import sys

from jobhunter.config import Config
from jobhunter.cv import CVProfile
from jobhunter.sources.registry import available_sources
from jobhunter.tracker import get_tracker
from jobhunter import pipeline
from jobhunter.report import build_report, send_email


def _load(cfg_path: str, cv_path: str):
    cfg = Config.load(cfg_path)
    cv = CVProfile.load(cv_path)
    tracker = get_tracker()
    return cfg, cv, tracker


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="jobhunter")
    p.add_argument("--config", default=os.environ.get("JOBHUNTER_CONFIG", "config.yaml"))
    p.add_argument("--cv", default=os.environ.get("JOBHUNTER_CV", "cv.md"))
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("search", help="fetch, score, and queue matches")
    ap = sub.add_parser("approve", help="approve queued jobs by id")
    ap.add_argument("ids", nargs="+")
    sub.add_parser("apply", help="submit approved applications")
    rp = sub.add_parser("report", help="build and send the report")
    rp.add_argument("--window", type=int, default=4)
    rp.add_argument("--print", action="store_true", help="print instead of emailing")
    sub.add_parser("sources", help="list available job sources")

    args = p.parse_args(argv)

    if args.cmd == "sources":
        print("Available sources:", ", ".join(available_sources()))
        return 0

    if args.cmd == "approve":
        tracker = get_tracker()
        n = pipeline.approve(tracker, args.ids)
        print(f"Approved {n} job(s).")
        return 0

    if args.cmd == "search":
        cfg, cv, tracker = _load(args.config, args.cv)
        summary = pipeline.run_search(cfg, cv, tracker)
        print(
            f"Fetched {summary['fetched']}, new {summary['new']}, "
            f"queued {summary['queued']} for review."
        )
        for e in summary["errors"]:
            print(f"  source error: {e}", file=sys.stderr)
        return 0

    if args.cmd == "apply":
        cfg = Config.load(args.config)
        tracker = get_tracker()
        res = pipeline.run_apply(tracker, cfg)
        print(f"Submitted {res['submitted']} by email, {res['manual']} left for manual submit.")
        return 0

    if args.cmd == "report":
        tracker = get_tracker()
        report = build_report(tracker, window_days=args.window)
        if args.print or not send_email(
            f"JobHunter report", report
        ):
            print(report)
        else:
            print("Report emailed.")
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())

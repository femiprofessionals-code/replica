from jobhunter.cv import CVProfile
from jobhunter.tracker.csv_tracker import CsvTracker


def test_cv_parse_example():
    cv = CVProfile.parse(
        "# Jane Doe\n\nSenior Backend Engineer\n\n"
        "## Summary\nBackend engineer focused on Python.\n\n"
        "## Skills\nPython, AWS, Docker, PostgreSQL\n"
    )
    assert cv.name == "Jane Doe"
    assert "Python" in cv.skills
    assert "PostgreSQL" in cv.skills
    assert "Backend engineer" in cv.summary


def test_csv_tracker_roundtrip(tmp_path):
    path = tmp_path / "t.csv"
    t = CsvTracker(str(path))
    t.upsert({"id": "abc", "stage": "found", "title": "Eng", "company": "Globex"})
    assert "abc" in t.known_ids()

    # Update preserves prior fields.
    t.upsert({"id": "abc", "stage": "queued"})
    t2 = CsvTracker(str(path))
    row = t2.all_records()[0]
    assert row["stage"] == "queued"
    assert row["company"] == "Globex"

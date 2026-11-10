"""State-machine tests with a fake clock and fake store.

Run:  python -m unittest discover -s app   (from premiere-tracker folder)
"""

from __future__ import annotations

import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import db  # noqa: E402
from profiles import PROFILES, parse_explorer_title, parse_premiere_title  # noqa: E402
from tracker import Sample, Tracker  # noqa: E402

PR = "Adobe Premiere Pro.exe"


def pr(title="Adobe Premiere Pro 2025 - D:\\Jobs\\Alpha.prproj", idle=0.0):
    return Sample(PR, "DroverLord - Window Class", title, idle)


def other(idle=0.0):
    return Sample("chrome.exe", "Chrome_WidgetWin_1", "YouTube", idle)


class FakeStore:
    def __init__(self):
        self.rows = {}

    def open_session(self, user, profile, project, start):
        sid = len(self.rows) + 1
        self.rows[sid] = [project, start, start]
        return sid

    def update_end(self, sid, end):
        self.rows[sid][2] = end

    def sessions(self):
        return [tuple(r) for r in self.rows.values()]


T0 = datetime(2026, 11, 9, 10, 0, 0).timestamp()


class TrackerTests(unittest.TestCase):
    def setUp(self):
        self.store = FakeStore()
        self.t = Tracker(self.store, "ana", PROFILES["premiere"], idle_limit=180, max_gap=60)

    def run_ticks(self, start, end, sample_fn, step=5):
        now = start
        while now <= end:
            self.t.tick(now, sample_fn(now))
            now += step

    def test_active_session(self):
        self.run_ticks(T0, T0 + 600, lambda n: pr())
        self.assertEqual(self.store.sessions(), [("Alpha", T0, T0 + 600)])

    def test_idle_closes_at_last_input_plus_limit(self):
        last_input = T0 + 300
        self.run_ticks(T0, T0 + 900, lambda n: pr(idle=max(0, n - last_input)))
        self.assertEqual(self.store.sessions(), [("Alpha", T0, last_input + 180)])

    def test_short_pause_does_not_split(self):
        def sample(n):
            pause = T0 + 100 <= n < T0 + 220  # 2 min no input
            return pr(idle=(n - (T0 + 100)) if pause else 0)
        self.run_ticks(T0, T0 + 400, sample)
        self.assertEqual(len(self.store.sessions()), 1)

    def test_resume_after_idle_new_session(self):
        def sample(n):
            if n < T0 + 300:
                return pr()
            if n < T0 + 900:
                return pr(idle=n - (T0 + 300))
            return pr()
        self.run_ticks(T0, T0 + 1200, sample)
        s = self.store.sessions()
        self.assertEqual(len(s), 2)
        self.assertEqual(s[1][1], T0 + 900)

    def test_focus_leaves_closes_now(self):
        self.run_ticks(T0, T0 + 100, lambda n: pr())
        self.t.tick(T0 + 105, other())
        self.assertEqual(self.store.sessions(), [("Alpha", T0, T0 + 105)])

    def test_project_change(self):
        self.run_ticks(T0, T0 + 100, lambda n: pr())
        self.t.tick(T0 + 105, pr("Adobe Premiere Pro 2025 - D:\\Jobs\\Beta.prproj *"))
        s = self.store.sessions()
        self.assertEqual([x[0] for x in s], ["Alpha", "Beta"])
        self.assertEqual(s[0][2], T0 + 105)

    def test_dialog_keeps_project(self):
        self.run_ticks(T0, T0 + 100, lambda n: pr())
        self.t.tick(T0 + 105, pr("Export Settings"))
        self.assertEqual(len(self.store.sessions()), 1)

    def test_midnight_split(self):
        start = datetime(2026, 11, 9, 23, 58, 0).timestamp()
        midnight = datetime(2026, 11, 10).timestamp()
        self.run_ticks(start, start + 300, lambda n: pr())
        s = self.store.sessions()
        self.assertEqual(len(s), 2)
        self.assertEqual(s[0][2], midnight)
        self.assertEqual(s[1][1], midnight)

    def test_sleep_gap_closes_at_last_tick(self):
        self.run_ticks(T0, T0 + 100, lambda n: pr())
        self.t.tick(T0 + 3600, pr())
        s = self.store.sessions()
        self.assertEqual(s[0][2], T0 + 100)
        self.assertEqual(s[1][1], T0 + 3600)

    def test_explorer_profile_ignores_desktop(self):
        t = Tracker(self.store, "ana", PROFILES["explorer"], idle_limit=180)
        t.tick(T0, Sample("explorer.exe", "Progman", "", 0))
        t.tick(T0 + 5, Sample("explorer.exe", "Shell_TrayWnd", "", 0))
        self.assertEqual(self.store.sessions(), [])
        t.tick(T0 + 10, Sample("explorer.exe", "CabinetWClass", "Downloads", 0))
        t.tick(T0 + 15, Sample("explorer.exe", "CabinetWClass", "Downloads", 0))
        self.assertEqual(self.store.sessions(), [("Downloads", T0 + 10, T0 + 15)])


class ParserTests(unittest.TestCase):
    def test_premiere(self):
        self.assertEqual(parse_premiere_title(
            "Adobe Premiere Pro 2025 - C:\\Users\\x\\Client_v02.prproj *"), "Client_v02")
        self.assertIsNone(parse_premiere_title("Adobe Premiere Pro 2025"))

    def test_explorer(self):
        self.assertEqual(parse_explorer_title("Downloads - File Explorer"), "Downloads")
        self.assertEqual(parse_explorer_title("Projects"), "Projects")
        self.assertIsNone(parse_explorer_title("File Explorer"))


class DatabaseTests(unittest.TestCase):
    def test_roundtrip_totals_export(self):
        with tempfile.TemporaryDirectory() as d:
            database = db.Database(Path(d) / "s.db")
            a = database.open_session("ana", "premiere", "Alpha", T0)
            database.update_end(a, T0 + 600)
            b = database.open_session("ana", "premiere", "Alpha", T0 + 1000)
            database.update_end(b, T0 + 1300)
            database.open_session("ana", "explorer", "Downloads", T0)
            rows = database.sessions(T0 - 1, T0 + 86400, "premiere")
            self.assertEqual(len(rows), 2)
            self.assertEqual(db.totals_by_project(rows), [("Alpha", 900.0, 2)])
            out = Path(d) / "out.csv"
            db.export_csv(rows, out)
            text = out.read_text(encoding="utf-8-sig")
            self.assertIn("Alpha", text)
            lines = text.strip().splitlines()
            self.assertEqual(len(lines), 4)  # header + 2 sessions + TOTAL
            self.assertIn("TOTAL", lines[-1])
            self.assertTrue(lines[-1].endswith("15.0") or lines[-1].endswith("15,0"))
            database.close()


if __name__ == "__main__":
    unittest.main()

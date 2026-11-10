"""SQLite storage for sessions. One file per PC."""

from __future__ import annotations

import csv
import locale
import sqlite3
import threading
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user     TEXT NOT NULL,
    profile  TEXT NOT NULL,
    project  TEXT NOT NULL,
    start_ts REAL NOT NULL,
    end_ts   REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_ts);
"""


@dataclass
class SessionRow:
    id: int
    user: str
    profile: str
    project: str
    start: float
    end: float

    @property
    def seconds(self) -> float:
        return max(0.0, self.end - self.start)


class Database:
    """Thread-safe wrapper: tracker thread writes, UI thread reads."""

    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(path), check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.executescript(SCHEMA)
        self.lock = threading.Lock()

    # SessionStore protocol (used by Tracker)
    def open_session(self, user: str, profile: str, project: str, start: float) -> int:
        with self.lock, self.conn:
            cur = self.conn.execute(
                "INSERT INTO sessions(user, profile, project, start_ts, end_ts) VALUES (?,?,?,?,?)",
                (user, profile, project, start, start),
            )
            return int(cur.lastrowid)

    def update_end(self, session_id: int, end: float) -> None:
        with self.lock, self.conn:
            self.conn.execute("UPDATE sessions SET end_ts=? WHERE id=?", (end, session_id))

    # Queries (used by UI)
    def sessions(self, start: float, end: float, profile: str) -> list[SessionRow]:
        with self.lock:
            rows = self.conn.execute(
                "SELECT id, user, profile, project, start_ts, end_ts FROM sessions "
                "WHERE start_ts >= ? AND start_ts < ? AND profile = ? AND end_ts > start_ts "
                "ORDER BY start_ts DESC",
                (start, end, profile),
            ).fetchall()
        return [SessionRow(*r) for r in rows]

    def close(self) -> None:
        with self.lock:
            self.conn.close()


def totals_by_project(rows: list[SessionRow]) -> list[tuple[str, float, int]]:
    """[(project, seconds, session_count)] sorted by most time first."""
    totals: dict[str, list[float]] = {}
    for r in rows:
        t = totals.setdefault(r.project, [0.0, 0])
        t[0] += r.seconds
        t[1] += 1
    return sorted(((p, s, int(n)) for p, (s, n) in totals.items()), key=lambda x: -x[1])


def export_csv(rows: list[SessionRow], path: Path) -> None:
    """Excel-friendly CSV: follows the PC's decimal separator (',' -> ';' delimiter)."""
    try:
        locale.setlocale(locale.LC_NUMERIC, "")
        decimal = locale.localeconv()["decimal_point"]
    except locale.Error:
        decimal = "."
    delimiter = ";" if decimal == "," else ","

    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=delimiter)
        w.writerow(["user", "project", "date", "start", "end", "minutes"])
        ordered = sorted(rows, key=lambda r: r.start)
        for r in ordered:
            s, e = datetime.fromtimestamp(r.start), datetime.fromtimestamp(r.end)
            minutes = f"{r.seconds / 60:.1f}".replace(".", decimal)
            w.writerow([r.user, r.project, s.strftime("%Y-%m-%d"),
                        s.strftime("%H:%M:%S"), e.strftime("%H:%M:%S"), minutes])
        if ordered:  # grand total of all exported sessions
            first = datetime.fromtimestamp(ordered[0].start).strftime("%Y-%m-%d")
            last = datetime.fromtimestamp(ordered[-1].start).strftime("%Y-%m-%d")
            days = first if first == last else f"{first} - {last}"
            total = f"{sum(r.seconds for r in ordered) / 60:.1f}".replace(".", decimal)
            w.writerow([ordered[0].user, "TOTAL", days, "", "", total])

"""Session state machine + polling thread.

Rules (agreed):
- Active = tracked app is the foreground window AND last keyboard/mouse input
  is younger than the idle limit (default 3 min).
- Idle gap counts up to the limit: an idle-closed session ends at
  last input + limit.
- Focus leaves the app -> session ends now.
- Project changes -> close and open a new session.
- Midnight -> split, so each session belongs to one day.
- Big gap between ticks (sleep, hang) -> close at the last tick seen.
- End time is written every tick, so a crash loses at most one tick.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Protocol

from profiles import Profile


@dataclass
class Sample:
    process: str
    window_class: str
    title: str
    idle_seconds: float


class SessionStore(Protocol):
    def open_session(self, user: str, profile: str, project: str, start: float) -> int: ...
    def update_end(self, session_id: int, end: float) -> None: ...


@dataclass
class OpenSession:
    id: int
    project: str
    start: float
    end: float


def local_midnight(ts: float) -> float:
    day = datetime.fromtimestamp(ts).replace(hour=0, minute=0, second=0, microsecond=0)
    return day.timestamp()


class Tracker:
    def __init__(
        self,
        store: SessionStore,
        user: str,
        profile: Profile,
        idle_limit: float = 180.0,
        max_gap: float = 60.0,
    ) -> None:
        self.store = store
        self.user = user
        self.profile = profile
        self.idle_limit = idle_limit
        self.max_gap = max_gap
        self.current: Optional[OpenSession] = None
        self.last_tick: Optional[float] = None
        self.lock = threading.Lock()

    # ---- state machine -------------------------------------------------

    def tick(self, now: float, sample: Optional[Sample]) -> None:
        with self.lock:
            self._tick(now, sample)

    def _tick(self, now: float, sample: Optional[Sample]) -> None:
        if self.current and self.last_tick is not None and now - self.last_tick > self.max_gap:
            self._close(self.last_tick)
        self.last_tick = now

        in_app = sample is not None and self.profile.matches(sample.process, sample.window_class)
        active = in_app and sample.idle_seconds < self.idle_limit

        if not active:
            if self.current:
                if in_app:  # went idle: count up to the limit after last input
                    end = now - sample.idle_seconds + self.idle_limit
                else:  # focus left the app
                    end = now
                self._close(min(max(end, self.current.start), now))
            return

        project = self.profile.parse_title(sample.title)
        if project is None:  # dialog / sub-window: keep current project
            project = self.current.project if self.current else self.profile.unknown_project

        if self.current:
            midnight = local_midnight(now)
            if self.current.start < midnight:
                self._close(midnight)
                self._open(project, midnight)
            elif project != self.current.project:
                self._close(now)
        if not self.current:
            self._open(project, now)

        self.current.end = now
        self.store.update_end(self.current.id, now)

    def close(self) -> None:
        """Close any open session at its last active tick (app exit)."""
        with self.lock:
            if self.current:
                self._close(self.current.end)

    def _open(self, project: str, start: float) -> None:
        sid = self.store.open_session(self.user, self.profile.key, project, start)
        self.current = OpenSession(sid, project, start, start)

    def _close(self, end: float) -> None:
        assert self.current is not None
        end = max(end, self.current.start)
        self.store.update_end(self.current.id, end)
        self.current = None

    # ---- settings + status for the UI ------------------------------------

    def reconfigure(self, user: str, profile: Profile, idle_limit: float) -> None:
        with self.lock:
            if self.current:
                self._close(self.current.end)
            self.user = user
            self.profile = profile
            self.idle_limit = idle_limit

    def status(self) -> tuple[bool, str, float]:
        """(active, project, start timestamp of current session)."""
        with self.lock:
            if self.current:
                return True, self.current.project, self.current.start
            return False, "", 0.0


class TrackerThread(threading.Thread):
    """Polls the foreground window every `poll_seconds` and feeds the tracker."""

    def __init__(self, tracker: Tracker, poll_seconds: float = 5.0) -> None:
        super().__init__(daemon=True, name="tracker")
        self.tracker = tracker
        self.poll_seconds = poll_seconds
        self.stop_event = threading.Event()

    def run(self) -> None:
        import win_activity

        while not self.stop_event.is_set():
            try:
                sample = win_activity.read_sample()
            except Exception:  # never let a bad read kill tracking
                sample = None
            self.tracker.tick(time.time(), sample)
            self.stop_event.wait(self.poll_seconds)
        self.tracker.close()

    def stop(self) -> None:
        self.stop_event.set()


def format_duration(seconds: float) -> str:
    """Seconds -> 'h:mm'."""
    minutes = int(round(seconds / 60))
    return f"{minutes // 60}:{minutes % 60:02d}"

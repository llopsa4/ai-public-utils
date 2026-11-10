"""Paths + JSON config."""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path

from profiles import DEFAULT_PROFILE

# PREMIERE_TRACKER_HOME lets you run a throwaway copy without touching real data.
HOME = Path(os.environ.get("PREMIERE_TRACKER_HOME")
            or Path(os.environ.get("LOCALAPPDATA", Path.home())) / "PremiereTracker")
CONFIG_PATH = HOME / "config.json"
DB_PATH = HOME / "sessions.db"
SHOW_FLAG = HOME / "show.flag"  # a 2nd launch drops this; the running app opens its window


@dataclass
class Config:
    user: str = ""
    profile: str = DEFAULT_PROFILE
    idle_minutes: float = 3.0
    poll_seconds: float = 5.0
    autostart: bool = True

    @property
    def idle_limit(self) -> float:
        return self.idle_minutes * 60.0


def load() -> Config | None:
    """None = first run (wizard needed)."""
    try:
        data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    known = {k: v for k, v in data.items() if k in Config.__dataclass_fields__}
    cfg = Config(**known)
    return cfg if cfg.user else None


def save(cfg: Config) -> None:
    HOME.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps(asdict(cfg), indent=2), encoding="utf-8")

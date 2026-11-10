"""Premiere Tracker entry point.

    pythonw main.py           run (wizard on first run), tray + hidden window
    pythonw main.py --setup   wizard only (used by setup.ps1), then exit
    pythonw main.py --show    run and open the window immediately
"""

from __future__ import annotations

import ctypes
import os
import queue
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # allow `python app/main.py`

import config  # noqa: E402
import db  # noqa: E402
import wizard  # noqa: E402
from profiles import get_profile  # noqa: E402
from tracker import Tracker, TrackerThread, format_duration  # noqa: E402

ERROR_ALREADY_EXISTS = 183
MUTEX_NAME = "Local\\PremiereTrackerSingleInstance"


def acquire_single_instance():
    """Windows named mutex. Returns handle, or None if another copy runs."""
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CreateMutexW.restype = ctypes.c_void_p
    handle = kernel32.CreateMutexW(None, False, MUTEX_NAME)
    if ctypes.get_last_error() == ERROR_ALREADY_EXISTS:
        return None
    return handle


def ask_running_copy_to_show() -> None:
    config.HOME.mkdir(parents=True, exist_ok=True)
    config.SHOW_FLAG.write_text("show", encoding="utf-8")


def run(show_window: bool) -> None:
    cfg = config.load() or wizard.run_wizard()
    if cfg is None:
        return  # wizard cancelled

    from tray import Tray  # imported late: wizard-only runs don't need pystray
    from ui import MainWindow

    database = db.Database(config.DB_PATH)
    tracker = Tracker(database, cfg.user, get_profile(cfg.profile), cfg.idle_limit,
                      max_gap=max(60.0, cfg.poll_seconds * 6))
    thread = TrackerThread(tracker, cfg.poll_seconds)
    thread.start()

    actions: "queue.Queue[str]" = queue.Queue()
    tray = Tray(actions)
    tray.start()

    import customtkinter as ctk
    import theme

    theme.setup()
    root = ctk.CTk()
    root.withdraw()

    def on_settings(new_cfg: config.Config) -> None:
        tracker.reconfigure(new_cfg.user, get_profile(new_cfg.profile), new_cfg.idle_limit)

    window = MainWindow(root, database, tracker, cfg, on_settings)

    def quit_app() -> None:
        thread.stop()
        thread.join(timeout=10)
        tray.stop()
        database.close()
        root.destroy()

    def pump() -> None:
        # Tk is not thread-safe: tray/2nd-launch requests are handled here, on Tk's thread.
        try:
            while True:
                action = actions.get_nowait()
                if action == "show":
                    window.show()
                elif action == "export":
                    window.export()
                elif action == "quit":
                    quit_app()
                    return
        except queue.Empty:
            pass
        if config.SHOW_FLAG.exists():
            try:
                config.SHOW_FLAG.unlink()
            except OSError:
                pass
            window.show()
        active, project, start = tracker.status()
        app = get_profile(window.cfg.profile).label
        tray.set_state(active, f"Tracking {project} ({format_duration(time.time() - start)})" if active
                       else f"Premiere Tracker - idle ({app})")
        root.after(300, pump)

    if show_window:
        window.show()
    root.after(300, pump)
    root.mainloop()


def main() -> None:
    args = sys.argv[1:]
    if "--setup" in args:
        wizard.run_wizard(config.load())
        return
    mutex = acquire_single_instance()
    if mutex is None:
        ask_running_copy_to_show()  # e.g. desktop shortcut clicked while running
        return
    run(show_window="--show" in args or os.environ.get("PREMIERE_TRACKER_SHOW") == "1")


if __name__ == "__main__":
    main()

"""Create/remove the 'start with Windows' shortcut (Startup folder .lnk)."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

STARTUP_DIR = Path(os.environ.get("APPDATA", "")) / "Microsoft/Windows/Start Menu/Programs/Startup"
LNK_NAME = "Premiere Tracker.lnk"
CREATE_NO_WINDOW = 0x08000000


def _pythonw() -> str:
    exe = Path(sys.executable)
    candidate = exe.with_name("pythonw.exe")
    return str(candidate if candidate.exists() else exe)


def _main_script() -> str:
    return str(Path(__file__).with_name("main.py"))


def create_shortcut(lnk_path: Path) -> None:
    # WScript.Shell via PowerShell: no pywin32 needed. Values travel in env vars,
    # not pasted into the script, so paths with quotes/spaces are safe.
    script = (
        "$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:PT_LNK);"
        "$s.TargetPath=$env:PT_TARGET;$s.Arguments=$env:PT_ARGS;"
        "$s.WorkingDirectory=$env:PT_DIR;$s.Save()"
    )
    main = _main_script()
    env = dict(os.environ, PT_LNK=str(lnk_path), PT_TARGET=_pythonw(),
               PT_ARGS=f'"{main}"', PT_DIR=str(Path(main).parent))
    subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
        check=True, env=env, creationflags=CREATE_NO_WINDOW,
    )


def set_autostart(enabled: bool) -> None:
    lnk = STARTUP_DIR / LNK_NAME
    if enabled:
        STARTUP_DIR.mkdir(parents=True, exist_ok=True)
        create_shortcut(lnk)
    elif lnk.exists():
        lnk.unlink()

"""Tracked-app profiles.

A profile says which window counts as "the app" and how to turn the window
title into a project name. Premiere is the real target; Explorer exists so the
tracker can be tested on a PC without Premiere installed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable, Optional


@dataclass(frozen=True)
class Profile:
    key: str
    label: str
    process: str  # executable name, compared case-insensitively
    window_classes: tuple[str, ...]  # empty = any window class of the process
    parse_title: Callable[[str], Optional[str]]  # None = title has no project
    unknown_project: str = "(no project)"

    def matches(self, process: str, window_class: str) -> bool:
        if process.lower() != self.process.lower():
            return False
        return not self.window_classes or window_class in self.window_classes


_PRPROJ = re.compile(r"([^\\/:*?\"<>|]+)\.prproj", re.IGNORECASE)


def parse_premiere_title(title: str) -> Optional[str]:
    """'Adobe Premiere Pro 2025 - D:\\Jobs\\Client_v02.prproj *' -> 'Client_v02'.

    Dialogs and the home screen have no .prproj in the title -> None, so the
    tracker keeps whatever project was already open.
    """
    match = _PRPROJ.search(title)
    return match.group(1).strip() if match else None


_EXPLORER_SUFFIXES = (
    " - File Explorer",
    " - Explorador de archivos",
    " - Explorador de fitxers",
    " - Explorer",
)
_EXPLORER_PLACEHOLDERS = {"File Explorer", "Explorador de archivos", "Explorador de fitxers", ""}


def parse_explorer_title(title: str) -> Optional[str]:
    """Explorer window title is the open folder name (Win11), sometimes with a suffix."""
    title = title.strip()
    if title in _EXPLORER_PLACEHOLDERS:  # shown while a window is still loading
        return None
    for suffix in _EXPLORER_SUFFIXES:
        if title.endswith(suffix):
            title = title[: -len(suffix)].strip()
            break
    return title or None


PROFILES: dict[str, Profile] = {
    "premiere": Profile(
        key="premiere",
        label="Adobe Premiere Pro",
        process="Adobe Premiere Pro.exe",
        window_classes=(),
        parse_title=parse_premiere_title,
    ),
    "explorer": Profile(
        key="explorer",
        label="Windows Explorer (test)",
        process="explorer.exe",
        # CabinetWClass = real folder windows. Excludes desktop (Progman/WorkerW)
        # and taskbar (Shell_TrayWnd), which belong to explorer.exe too.
        window_classes=("CabinetWClass",),
        parse_title=parse_explorer_title,
        unknown_project="(unknown folder)",
    ),
}

DEFAULT_PROFILE = "premiere"


def get_profile(key: str) -> Profile:
    return PROFILES.get(key, PROFILES[DEFAULT_PROFILE])

"""System tray icon (pystray). Runs in its own thread; actions are queued for Tk."""

from __future__ import annotations

import queue
from typing import Callable

import pystray
from PIL import Image, ImageDraw

GREEN = (46, 160, 67, 255)
GREY = (140, 140, 140, 255)


def _dot(color: tuple[int, int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((6, 6, 58, 58), fill=color, outline=(255, 255, 255, 255), width=4)
    return img


class Tray:
    def __init__(self, actions: "queue.Queue[str]") -> None:
        self.actions = actions
        self.active = False
        self.icons = {True: _dot(GREEN), False: _dot(GREY)}

        def post(name: str) -> Callable[..., None]:
            return lambda *_: self.actions.put(name)

        self.icon = pystray.Icon(
            "premiere-tracker",
            self.icons[False],
            "Premiere Tracker",
            menu=pystray.Menu(
                pystray.MenuItem("Open", post("show"), default=True),  # default = left click
                pystray.MenuItem("Export CSV...", post("export")),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Quit", post("quit")),
            ),
        )

    def start(self) -> None:
        self.icon.run_detached()

    def set_state(self, active: bool, tooltip: str) -> None:
        if active != self.active:
            self.active = active
            self.icon.icon = self.icons[active]
        if self.icon.title != tooltip:
            self.icon.title = tooltip[:120]

    def stop(self) -> None:
        self.icon.stop()

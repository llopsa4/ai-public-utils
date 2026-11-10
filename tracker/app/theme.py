"""Shared look: colours (light, dark) + fonts for CustomTkinter widgets.

Only BMP symbols (U+0000-U+FFFF) are used in UI text: Tk 8.6 on Windows
can't reliably draw emoji above that range (e.g. most faces/hands).
"""

from __future__ import annotations

import customtkinter as ctk

ACCENT = "#7c5cff"
ACCENT_HOVER = "#6846f0"
ACCENT_SOFT = ("#ddd5ff", "#7c5cff")  # selected tab: readable with TEXT in both modes
ACCENT_SOFT_HOVER = ("#cfc4ff", "#6846f0")
GREEN = "#22c55e"
GREY = "#9ca3af"

BG = ("#f3f2fa", "#15151c")
CARD = ("#ffffff", "#20202a")
CARD_HOVER = ("#ecebf7", "#2a2a36")
TEXT = ("#1c1b29", "#f2f1fa")
MUTED = ("#6e6c84", "#9d9bb3")
TRACK = ("#e6e4f3", "#2e2d3b")  # progress-bar background

FAMILY = "Segoe UI"


def setup() -> None:
    ctk.set_appearance_mode("system")  # follows Windows light/dark
    ctk.set_default_color_theme("blue")


def font(size: int, weight: str = "normal") -> ctk.CTkFont:
    return ctk.CTkFont(family=FAMILY, size=size, weight=weight)


def card(parent, **kw) -> ctk.CTkFrame:
    return ctk.CTkFrame(parent, corner_radius=16, fg_color=CARD, **kw)


def accent_button(parent, text: str, command, **kw) -> ctk.CTkButton:
    opts = dict(height=40, corner_radius=12, fg_color=ACCENT, hover_color=ACCENT_HOVER,
                text_color="#ffffff", font=font(14, "bold"))
    opts.update(kw)
    return ctk.CTkButton(parent, text=text, command=command, **opts)


def ghost_button(parent, text: str, command, **kw) -> ctk.CTkButton:
    opts = dict(height=40, corner_radius=12, fg_color=CARD, hover_color=CARD_HOVER,
                text_color=TEXT, font=font(14))
    opts.update(kw)
    return ctk.CTkButton(parent, text=text, command=command, **opts)

"""First-run wizard + reusable settings form (CustomTkinter)."""

from __future__ import annotations

import getpass
from tkinter import messagebox
from typing import Callable, Optional

import customtkinter as ctk

import config
import shortcuts
import theme
from profiles import PROFILES

IDLE_CHOICES = ["1", "2", "3", "5", "10", "15", "30"]


def build_settings_form(parent, cfg: config.Config) -> Callable[[], Optional[config.Config]]:
    """Adds name/app/idle/autostart fields to `parent` (grid). Returns a getter
    that validates and returns a new Config, or None (after showing an error)."""
    labels = {p.label: p.key for p in PROFILES.values()}
    current_label = PROFILES[cfg.profile].label if cfg.profile in PROFILES else next(iter(labels))
    idle_now = f"{cfg.idle_minutes:g}"
    idle_values = IDLE_CHOICES if idle_now in IDLE_CHOICES else sorted(
        IDLE_CHOICES + [idle_now], key=float)

    name_var = ctk.StringVar(value=cfg.user or getpass.getuser())
    profile_var = ctk.StringVar(value=current_label)
    idle_var = ctk.StringVar(value=idle_now)
    auto_var = ctk.BooleanVar(value=cfg.autostart)

    menu_style = dict(fg_color=theme.ACCENT, button_color=theme.ACCENT_HOVER,
                      button_hover_color=theme.ACCENT_HOVER, text_color="#ffffff",
                      font=theme.font(13), dropdown_font=theme.font(13), corner_radius=10)
    rows = [
        ("Your name", ctk.CTkEntry(parent, textvariable=name_var, width=240, height=36,
                                   corner_radius=10, font=theme.font(13))),
        ("App to track", ctk.CTkOptionMenu(parent, values=list(labels), variable=profile_var,
                                           width=240, height=36, **menu_style)),
        ("Idle limit (minutes)", ctk.CTkOptionMenu(parent, values=idle_values, variable=idle_var,
                                                   width=90, height=36, **menu_style)),
    ]
    for i, (text, widget) in enumerate(rows):
        ctk.CTkLabel(parent, text=text, font=theme.font(13), text_color=theme.MUTED).grid(
            row=i, column=0, sticky="w", padx=(0, 16), pady=7)
        widget.grid(row=i, column=1, sticky="w", pady=7)
    ctk.CTkSwitch(parent, text="Start with Windows", variable=auto_var, font=theme.font(13),
                  progress_color=theme.ACCENT).grid(row=len(rows), column=1, sticky="w", pady=7)

    def get() -> Optional[config.Config]:
        name = name_var.get().strip()
        if not name:
            messagebox.showerror("Premiere Tracker", "Please enter your name.", parent=parent)
            return None
        return config.Config(user=name, profile=labels.get(profile_var.get(), cfg.profile),
                             idle_minutes=float(idle_var.get()), poll_seconds=cfg.poll_seconds,
                             autostart=auto_var.get())

    return get


def apply_and_save(cfg: config.Config, parent) -> None:
    config.save(cfg)
    try:
        shortcuts.set_autostart(cfg.autostart)
    except Exception as exc:  # shortcut failure must not block tracking
        messagebox.showwarning("Premiere Tracker", f"Could not update Windows startup:\n{exc}",
                               parent=parent)


def run_wizard(existing: Optional[config.Config] = None) -> Optional[config.Config]:
    """Blocking first-run dialog. Returns saved config, or None if cancelled."""
    theme.setup()
    result: list[config.Config] = []
    root = ctk.CTk(fg_color=theme.BG)
    root.title("Premiere Tracker - Setup")
    root.resizable(False, False)

    body = ctk.CTkFrame(root, fg_color="transparent")
    body.pack(fill="both", expand=True, padx=24, pady=22)
    ctk.CTkLabel(body, text="Welcome to Premiere Tracker ✨", font=theme.font(22, "bold"),
                 text_color=theme.TEXT).pack(anchor="w")
    ctk.CTkLabel(body, wraplength=400, justify="left", font=theme.font(13),
                 text_color=theme.MUTED, text=(
                     "I count the time you actively work in your editing app — only while "
                     "it's in front and you're using the keyboard or mouse. Everything stays on "
                     "this PC.")).pack(anchor="w", pady=(6, 16))

    form_card = theme.card(body)
    form_card.pack(fill="x")
    form = ctk.CTkFrame(form_card, fg_color="transparent")
    form.pack(padx=18, pady=14, anchor="w")
    get = build_settings_form(form, existing or config.Config())

    def on_save() -> None:
        cfg = get()
        if cfg:
            apply_and_save(cfg, root)
            result.append(cfg)
            root.destroy()

    buttons = ctk.CTkFrame(body, fg_color="transparent")
    buttons.pack(fill="x", pady=(18, 0))
    theme.accent_button(buttons, "Let's go →", on_save, width=140).pack(side="right")
    theme.ghost_button(buttons, "Cancel", root.destroy, width=100).pack(side="right", padx=10)
    root.bind("<Return>", lambda _e: on_save())

    root.mainloop()
    return result[0] if result else None

"""Main window (CustomTkinter): live 'now' card, range picker, totals, per-project
bars, session list, export."""

from __future__ import annotations

import time
from datetime import date, datetime, timedelta
from pathlib import Path
from tkinter import filedialog, messagebox
from typing import Callable

import customtkinter as ctk

import config
import db
import theme
import wizard
from profiles import get_profile
from tracker import Tracker, format_duration

REFRESH_MS = 10_000  # data lists
CLOCK_MS = 1_000  # live timer
RANGES = ["Today", "Week", "Month", "All", "Custom"]
MAX_PROJECT_BARS = 50  # list scrolls; cap only guards against huge ranges


def format_clock(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}"


class MainWindow:
    def __init__(self, root: ctk.CTk, database: db.Database, tracker: Tracker,
                 cfg: config.Config, on_settings: Callable[[config.Config], None]) -> None:
        self.root = root
        self.db = database
        self.tracker = tracker
        self.cfg = cfg
        self.on_settings = on_settings
        self.rows: list[db.SessionRow] = []
        self.settings_win: ctk.CTkToplevel | None = None

        root.title("Premiere Tracker")
        root.geometry(f"480x{self._fit_height(760)}")
        root.minsize(420, 520)
        root.configure(fg_color=theme.BG)
        root.protocol("WM_DELETE_WINDOW", self.hide)

        body = ctk.CTkFrame(root, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=18, pady=16)
        self._build_header(body)
        self._build_now_card(body)
        self._build_range(body)
        self._build_stats(body)
        # packed before the tabs so it always stays visible; the tabs shrink instead
        theme.accent_button(body, "↓  Export CSV", self.export).pack(
            side="bottom", fill="x", pady=(12, 0))
        self._build_tabs(body)

        self._tick_clock()
        self._tick_data()

    # ---- layout --------------------------------------------------------------

    def _fit_height(self, wanted: int) -> int:
        """Shrink on small/high-DPI screens so the Export button stays visible."""
        try:
            scale = ctk.ScalingTracker.get_window_scaling(self.root)
        except Exception:
            scale = 1.0
        usable = int(self.root.winfo_screenheight() / scale) - 110  # taskbar + title bar
        return max(520, min(wanted, usable))

    def _build_header(self, parent) -> None:
        head = ctk.CTkFrame(parent, fg_color="transparent")
        head.pack(fill="x")
        titles = ctk.CTkFrame(head, fg_color="transparent")
        titles.pack(side="left")
        ctk.CTkLabel(titles, text="Premiere Tracker", font=theme.font(22, "bold"),
                     text_color=theme.TEXT).pack(anchor="w")
        self.hello = ctk.CTkLabel(titles, text="", font=theme.font(13), text_color=theme.MUTED)
        self.hello.pack(anchor="w")
        theme.ghost_button(head, "⚙", self.open_settings, width=42, height=42,
                           corner_radius=21, font=theme.font(20)).pack(side="right")

    def _build_now_card(self, parent) -> None:
        card = theme.card(parent)
        card.pack(fill="x", pady=(14, 12))
        inner = ctk.CTkFrame(card, fg_color="transparent")
        inner.pack(fill="x", padx=18, pady=14)
        top = ctk.CTkFrame(inner, fg_color="transparent")
        top.pack(fill="x")
        self.dot = ctk.CTkLabel(top, text="●", font=theme.font(16))
        self.dot.pack(side="left")
        self.caption = ctk.CTkLabel(top, text="", font=theme.font(11, "bold"),
                                    text_color=theme.MUTED)
        self.caption.pack(side="left", padx=6)
        self.now_project = ctk.CTkLabel(inner, text="", font=theme.font(17, "bold"),
                                        text_color=theme.TEXT, anchor="w", justify="left",
                                        wraplength=400)
        self.now_project.pack(fill="x", pady=(4, 0))
        self.timer = ctk.CTkLabel(inner, text="", font=theme.font(34, "bold"), anchor="w")
        self.timer.pack(fill="x")

    def _build_range(self, parent) -> None:
        self.range_btn = ctk.CTkSegmentedButton(
            parent, values=RANGES, command=self._on_range, font=theme.font(13), height=34,
            # light mode: lavender pill + dark text; dark mode: purple pill + light text
            corner_radius=12, selected_color=theme.ACCENT_SOFT,
            selected_hover_color=theme.ACCENT_SOFT_HOVER,
            unselected_color=theme.CARD, unselected_hover_color=theme.CARD_HOVER,
            fg_color=theme.CARD, text_color=theme.TEXT)
        self.range_btn.set("Today")
        self.range_btn.pack(fill="x")

        today = date.today().isoformat()
        self.from_var = ctk.StringVar(value=today)
        self.to_var = ctk.StringVar(value=today)
        self.custom_row = ctk.CTkFrame(parent, fg_color="transparent")
        for text, var in (("From", self.from_var), ("To", self.to_var)):
            ctk.CTkLabel(self.custom_row, text=text, font=theme.font(12),
                         text_color=theme.MUTED).pack(side="left", padx=(0, 4))
            ctk.CTkEntry(self.custom_row, textvariable=var, width=104, height=30, corner_radius=8,
                         placeholder_text="YYYY-MM-DD").pack(side="left", padx=(0, 10))
        theme.accent_button(self.custom_row, "Apply", self.refresh, width=70, height=30,
                            font=theme.font(12, "bold")).pack(side="left")
        self.custom_anchor = ctk.CTkFrame(parent, fg_color="transparent", height=0)
        self.custom_anchor.pack(fill="x")

    def _build_stats(self, parent) -> None:
        stats = ctk.CTkFrame(parent, fg_color="transparent")
        stats.pack(fill="x", pady=12)
        stats.grid_columnconfigure((0, 1), weight=1, uniform="s")
        self.total_value = self._stat(stats, 0, "TOTAL ⏱", theme.ACCENT)
        self.count_value = self._stat(stats, 1, "SESSIONS", theme.TEXT)

    @staticmethod
    def _stat(parent, col: int, caption: str, color) -> ctk.CTkLabel:
        card = theme.card(parent)
        card.grid(row=0, column=col, sticky="nsew", padx=(0, 6) if col == 0 else (6, 0))
        ctk.CTkLabel(card, text=caption, font=theme.font(11, "bold"),
                     text_color=theme.MUTED).pack(anchor="w", padx=16, pady=(12, 0))
        value = ctk.CTkLabel(card, text="0:00", font=theme.font(28, "bold"), text_color=color)
        value.pack(anchor="w", padx=16, pady=(0, 10))
        return value

    def _build_tabs(self, parent) -> None:
        tabs = ctk.CTkTabview(
            parent, corner_radius=16, fg_color=theme.CARD, height=150,
            segmented_button_fg_color=theme.CARD, segmented_button_selected_color=theme.ACCENT_SOFT,
            segmented_button_selected_hover_color=theme.ACCENT_SOFT_HOVER,
            segmented_button_unselected_color=theme.CARD,
            segmented_button_unselected_hover_color=theme.CARD_HOVER, text_color=theme.TEXT)
        self.tabs = tabs
        tabs.pack(fill="both", expand=True)
        tabs._segmented_button.configure(font=theme.font(13, "bold"))
        for name in ("Projects", "Sessions"):
            tabs.add(name)
        self.proj_list = ctk.CTkScrollableFrame(tabs.tab("Projects"), fg_color="transparent",
                                                corner_radius=0, height=60)
        self.sess_list = ctk.CTkScrollableFrame(tabs.tab("Sessions"), fg_color="transparent",
                                                corner_radius=0, height=60)
        for lst in (self.proj_list, self.sess_list):
            lst.pack(fill="both", expand=True)
            lst.grid_columnconfigure(1, weight=1)

    # ---- ranges --------------------------------------------------------------

    def _on_range(self, value: str) -> None:
        if value == "Custom":
            self.custom_row.pack(fill="x", pady=(8, 0), after=self.custom_anchor)
        else:
            self.custom_row.pack_forget()
        self.refresh()

    def _range_dates(self) -> tuple[date, date] | None:
        t = date.today()
        key = self.range_btn.get()
        if key == "Today":
            return t, t
        if key == "Week":
            return t - timedelta(days=t.weekday()), t
        if key == "Month":
            return t.replace(day=1), t
        if key == "All":
            return date(2000, 1, 1), t
        try:
            return (datetime.strptime(self.from_var.get().strip(), "%Y-%m-%d").date(),
                    datetime.strptime(self.to_var.get().strip(), "%Y-%m-%d").date())
        except ValueError:
            messagebox.showerror("Premiere Tracker", "Dates must be YYYY-MM-DD.", parent=self.root)
            return None

    def _range(self) -> tuple[float, float] | None:
        dates = self._range_dates()
        if dates is None:
            return None
        start = datetime.combine(dates[0], datetime.min.time())
        end = datetime.combine(dates[1], datetime.min.time()) + timedelta(days=1)
        return start.timestamp(), end.timestamp()

    # ---- data ----------------------------------------------------------------

    def refresh(self) -> None:
        rng = self._range()
        if rng is None:
            return
        self.rows = self.db.sessions(rng[0], rng[1], self.cfg.profile)
        totals = db.totals_by_project(self.rows)
        grand = sum(t[1] for t in totals)
        self.total_value.configure(text=format_duration(grand))
        self.count_value.configure(text=str(len(self.rows)))
        self._fill_projects(totals)
        self._fill_sessions()

    def _empty(self, parent, text: str) -> None:
        ctk.CTkLabel(parent, text=text, font=theme.font(13), text_color=theme.MUTED,
                     justify="left").grid(row=0, column=0, columnspan=3, sticky="w", pady=6)

    def _fill_projects(self, totals: list[tuple[str, float, int]]) -> None:
        for w in self.proj_list.winfo_children():
            w.destroy()
        if not totals:
            self._empty(self.proj_list, "Nothing here yet ✨")
            return
        top = totals[0][1] or 1
        for i, (project, seconds, _count) in enumerate(totals[:MAX_PROJECT_BARS]):
            ctk.CTkLabel(self.proj_list, text=project, font=theme.font(13), anchor="w",
                         text_color=theme.TEXT, width=130).grid(row=i, column=0, sticky="w", pady=3)
            bar = ctk.CTkProgressBar(self.proj_list, height=10, corner_radius=5,
                                     progress_color=theme.ACCENT, fg_color=theme.TRACK)
            bar.set(seconds / top)
            bar.grid(row=i, column=1, sticky="ew", padx=10)
            ctk.CTkLabel(self.proj_list, text=format_duration(seconds), font=theme.font(13, "bold"),
                         text_color=theme.TEXT).grid(row=i, column=2, sticky="e")
        extra = len(totals) - MAX_PROJECT_BARS
        if extra > 0:
            ctk.CTkLabel(self.proj_list, text=f"+ {extra} more (see Export)", font=theme.font(12),
                         text_color=theme.MUTED).grid(row=MAX_PROJECT_BARS, column=0,
                                                      columnspan=3, sticky="w", pady=(4, 0))

    def _fill_sessions(self) -> None:
        for w in self.sess_list.winfo_children():
            w.destroy()
        if not self.rows:
            app = get_profile(self.cfg.profile).label
            self._empty(self.sess_list, f"No sessions yet. Open {app} and get creative!")
            return
        for i, r in enumerate(self.rows):
            s, e = datetime.fromtimestamp(r.start), datetime.fromtimestamp(r.end)
            when = f"{s:%d %b}  {s:%H:%M}–{e:%H:%M}"
            ctk.CTkLabel(self.sess_list, text=when, font=theme.font(12),
                         text_color=theme.MUTED).grid(row=i, column=0, sticky="w", padx=(10, 12), pady=3)
            ctk.CTkLabel(self.sess_list, text=r.project, font=theme.font(13), anchor="w",
                         text_color=theme.TEXT).grid(row=i, column=1, sticky="w")
            ctk.CTkLabel(self.sess_list, text=format_duration(r.seconds), font=theme.font(13, "bold"),
                         text_color=theme.TEXT).grid(row=i, column=2, sticky="e", padx=10)

    def update_status(self) -> None:
        active, project, start = self.tracker.status()
        app = get_profile(self.cfg.profile).label
        self.hello.configure(text=f"Hi {self.cfg.user} ✨  ·  watching {app}")
        if active:
            self.dot.configure(text_color=theme.GREEN)
            self.caption.configure(text="NOW TRACKING")
            self.now_project.configure(text=project)
            self.timer.configure(text=format_clock(time.time() - start), text_color=theme.ACCENT)
        else:
            self.dot.configure(text_color=theme.GREY)
            self.caption.configure(text="ON A BREAK ☕")
            self.now_project.configure(text=f"Waiting for you in {app}")
            self.timer.configure(text="0:00:00", text_color=theme.MUTED)

    def _visible(self) -> bool:
        return self.root.state() != "withdrawn"

    def _tick_clock(self) -> None:
        if self._visible():
            self.update_status()
        self.root.after(CLOCK_MS, self._tick_clock)

    def _tick_data(self) -> None:
        if self._visible():
            self.refresh()
        self.root.after(REFRESH_MS, self._tick_data)

    # ---- actions -------------------------------------------------------------

    def show(self) -> None:
        self.root.deiconify()
        self.root.lift()
        self.root.focus_force()
        self.update_status()
        self.refresh()

    def hide(self) -> None:
        self.root.withdraw()

    def export(self) -> None:
        self.show()
        dates = self._range_dates()
        if dates is None:
            return
        default = f"time_{self.cfg.user}_{dates[0]}_{dates[1]}.csv"
        path = filedialog.asksaveasfilename(parent=self.root, defaultextension=".csv",
                                            initialfile=default, filetypes=[("CSV", "*.csv")])
        if not path:
            return
        self.refresh()
        try:
            db.export_csv(self.rows, Path(path))
        except OSError as exc:
            messagebox.showerror("Premiere Tracker", f"Export failed:\n{exc}", parent=self.root)
            return
        messagebox.showinfo("Premiere Tracker",
                            f"Exported {len(self.rows)} sessions ✔", parent=self.root)

    def open_settings(self) -> None:
        if self.settings_win is not None and self.settings_win.winfo_exists():
            self.settings_win.lift()
            return
        win = ctk.CTkToplevel(self.root, fg_color=theme.BG)
        self.settings_win = win
        win.title("Settings")
        win.resizable(False, False)
        win.transient(self.root)

        body = ctk.CTkFrame(win, fg_color="transparent")
        body.pack(padx=22, pady=20)
        ctk.CTkLabel(body, text="Settings ⚙", font=theme.font(20, "bold"),
                     text_color=theme.TEXT).pack(anchor="w", pady=(0, 12))
        form_card = theme.card(body)
        form_card.pack(fill="x")
        form = ctk.CTkFrame(form_card, fg_color="transparent")
        form.pack(padx=18, pady=14)
        get = wizard.build_settings_form(form, self.cfg)

        def save() -> None:
            cfg = get()
            if cfg:
                wizard.apply_and_save(cfg, win)
                self.cfg = cfg
                self.on_settings(cfg)
                win.destroy()
                self.show()

        buttons = ctk.CTkFrame(body, fg_color="transparent")
        buttons.pack(fill="x", pady=(16, 0))
        theme.accent_button(buttons, "Save", save, width=110).pack(side="right")
        theme.ghost_button(buttons, "Cancel", win.destroy, width=100).pack(side="right", padx=10)
        # CTkToplevel opens behind its parent on Windows unless lifted after mapping.
        win.after(150, lambda: (win.lift(), win.focus_force(), win.grab_set()))

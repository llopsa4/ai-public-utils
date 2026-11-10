# Premiere Tracker

Measures the time each person **actively** works in Adobe Premiere Pro, per
project. Runs on each PC, with a dot icon next to the clock. Data stays on that PC.

## Install (each PC, Windows 10/11)
1. Get the files: on GitHub, **Code → Download ZIP** ([direct link](https://github.com/llopsa4/ai-public-utils/archive/refs/heads/main.zip)),
   then extract it and open the `tracker` folder. (Or `git clone` the repo.)
2. Double-click `Setup.bat`. If Windows SmartScreen warns you, choose
   **More info → Run anyway**: the script is plain text, so you can read it first.
   - If Python 3.10+ is missing, it installs it (winget, falling back to python.org).
   - It installs the app in `%LOCALAPPDATA%\PremiereTracker`.
   - The wizard asks for: your name, the app to track, the idle limit, and whether to start with Windows.
3. A **Premiere Tracker** desktop shortcut and a tray icon appear.

Running `Setup.bat` again updates the app and keeps your data.

## What counts as active time
- The tracked app must be the window in front, **and**
- there must have been keyboard or mouse input within the idle limit (default 3 min).
- After the idle limit, the session ends at last input + limit. Any input after that starts a new session.
- Switching to another app ends the session right away.
- Project = `.prproj` file name from Premiere's title bar. Renamed or versioned files show as separate projects.
- Sessions split at midnight.

## Window
Click the tray icon (or the desktop shortcut) to open it. The modern card-style UI
(CustomTkinter) follows Windows light/dark mode. It shows:
- a **live card** with the current project and a running timer (or "On a break"),
- a range picker: Today / Week / Month / All / Custom,
- a **TOTAL** of all sessions in the range, plus the session count,
- tabs: **Projects** (time bar per project) and **Sessions** (every session),
- ⚙ settings (name, app to track, idle limit, start with Windows),
- **Export CSV**, which writes one file per person. Combine the partners' files in Excel.
  The last CSV row is `TOTAL` (sum of all exported sessions). When you combine files or build a
  pivot table, filter out project = `TOTAL` so it isn't counted twice.

The delimiter follows your Windows settings: `;` when the decimal separator is a comma (for example on Spanish or Catalan Windows).

## Testing without Premiere
Settings → App to track → **Windows Explorer (test)**. Each Explorer folder
window counts as a "project" (folder name = project). The desktop and taskbar
are ignored. Test data is stored separately from Premiere data (the window filters by app).

Tip: set the idle limit to 1 minute while testing.

## Files
| Path | What |
|---|---|
| `%LOCALAPPDATA%\PremiereTracker\sessions.db` | SQLite data |
| `%LOCALAPPDATA%\PremiereTracker\config.json` | settings |
| `...\Startup\Premiere Tracker.lnk` | autostart |

## Uninstall
Tray icon → Quit. Then delete `%LOCALAPPDATA%\PremiereTracker`, the desktop
shortcut, and `shell:startup\Premiere Tracker.lnk`.

## Dev
```
py -3 -m unittest discover -s app      # state-machine tests
py -3 app\win_activity.py              # print the foreground window + idle every second
```
`PREMIERE_TRACKER_HOME=<folder>` runs with a separate data folder.

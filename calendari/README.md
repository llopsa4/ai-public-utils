# Duty calendar

A personal monthly duty planner. This folder is a complete static website: no build step, accounts, backend, or external scripts are needed. All interface and report content is in English.

## Run locally

Use a current browser and serve the folder over HTTP. Opening `index.html` directly as a file will not reliably load JavaScript modules or the scheduling worker.

From this folder:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. Stop the server with Ctrl+C.

## Use the planner

1. Add participants individually or in a batch. Click a participant to open their configuration in a centred popup, where you can edit their temporary name, permitted shift types, blocked weekdays, and blocked dates. Use the small calendar to select or deselect dates in the displayed month (arrow keys move between dates; Enter or Space toggles a date). Recurring weekday restrictions remain separate. Press **Confirm participant changes** (or Enter in a text field) to apply all edits together and close the popup. **Cancel changes**, Escape, or the close button discards pending edits and closes it. Invalid values keep the popup open for correction. Names still clear on reload. Coverage & checks sits below the participant list, followed by the ground rules.
2. Select a month and enter a city or settlement in Catalonia. Choose a listed result and press **Apply city** (or Enter). The selected city is highlighted; local and public holidays are marked automatically. Holiday coverage adapts per date; there is no monthly coverage filter. Open a date to mark an additional weekday holiday manually.
3. Generate a fresh proposal, replacing all assignments in the displayed month, including manual duties and exceptions. Participant settings, availability, city, holiday dates, and other months stay unchanged. Search runs for up to 10 seconds in a worker, prioritizing covered duty hours, similar monthly hours, and balanced holiday/weekend duties. Stop early to keep the best proposal found so far. This is a bounded heuristic, not a proof of optimality or infeasibility.
4. Review yellow dates: these have missing coverage, both during generation and in the final proposal. Workload differences and warnings appear below the calendar. Open a date to change or clear an assignment. On holidays, each of the two coverage places can use one 24-hour duty or separate day/night duties; use the split/merge controls to edit these manually. Generate month also replaces manual assignments.
5. Click an assigned duty to open **Assignment options**. Choose **Move assignment** to highlight valid destinations, or **Cancel assignment** to remove the duty and leave its spot unfilled. Closing the options popup makes no changes. You can also move a duty by dragging its entry directly. On touch screens, hold for 300 ms before dragging; swipe before the hold to scroll. Keyboard users can focus an entry, press Enter to open its options, choose Move assignment, and Tab to a destination. Escape or **Cancel move** cancels without changing assignments. Use the date-number button to open the date editor.
6. Export anonymous backups regularly. Use **Print / save PDF**, select **Save as PDF**, and keep A4 landscape paper. Turn off the browser's own headers/footers for the cleanest output. The PDF contains one landscape calendar page matching the current View selection: all participants or only the selected participant. It uses the same names, shift labels, coverage colours, holiday badges, and highlighted workdays as the screen.

Moves stay within the displayed month and preserve the original shift type. Highlighted spots are empty and satisfy every scheduling rule, evaluated after removing the original duty. While moving a short duty, matching 12-hour targets are revealed on empty holiday places; these previews do not save any changes. A successful move removes the original duty, fills the destination, and clears any previous exception flag. Invalid drops leave the original duty in place. Month navigation and generation are disabled while moving; moves are disabled during generation.

**Green means fully covered, yellow means missing coverage, and red means overstaffed / overlapping coverage**, including incompatible overlaps in older backups. Red takes priority over yellow, but missing-coverage text and holiday badges remain visible. The global PDF uses these coverage colours too. Three or four people covering separate holiday shifts are valid and do not make a day red. Ordinary availability and monthly-limit conflicts retain their individual warnings. Moves cannot add extra people to occupied coverage places.

The current month opens on each visit. Previously saved months remain available through navigation. Each holiday is independently flexible; new participants default to 24-hour duties and have no blocked dates. The popup separates 24-hour and 12-hour duties with a divider. Selecting 24 hours disables both 12-hour options; selecting either 12-hour option disables 24 hours. Uncheck the active choice (both day and night if both are selected) before switching groups. Day and night are vertically aligned and may both be selected. Confirm participant changes to apply the choice. Existing mixed 24/12-hour permissions default to 24 hours on load/import; assignments remain intact and any new conflicts are flagged for review.

In the date popup, selecting a participant or **Unfilled** is a pending choice. Press **Confirm assignment** for that spot to apply it, or **Cancel selection** to restore its current assignment. Closing the popup also discards pending choices. Confirmation rechecks the scheduling rules; rule exceptions still require their explicit confirmation, and structural conflicts cannot be overridden. Drag-and-drop moves, holiday marking, and split/merge controls retain their existing behavior.

**Restart planner** clears this planner’s saved data for every month in the current browser after confirmation: participants, session names, restrictions, assignments, manually added holidays, and the selected city. It returns to the current month and resets participant codes. Export a backup first if needed. Other applications’ browser data is left alone. Restart also stops an active search.

**Calendar view:** choose **All participants** or a participant in the View selector above the calendar. Individual view shows only that person’s duties, highlights their workdays, and mutes other dates. Moves and cancellation still work; valid destination spots appear when moving. The view stays selected when browsing months, but resets on reload, backup import, restart, or deletion of the selected participant. The PDF follows this selection too; filtering never changes saved schedules.

## Scheduling rules

- Two people must be present at all times: 48 nominal duty hours per start date.
- Non-holidays: two 24-hour duties, 09:00 to 09:00 the following day.
- Holidays independently allow two 24-hour duties, four 12-hour shifts (two day and two night), or mixed coverage: one person works 24 hours, one works the 12-hour day, and a third works the 12-hour night. The 24-hour duty covers one continuous place; the two shorter duties cover the other. Different combinations can coexist in the same month, including additional weekday holidays, while maintaining two simultaneous people and 48 total hours.
- Day is 09:00–21:00. Night is 21:00–09:00 the following day. A participant cannot cover both on the same date.
- Saturdays, Sundays, and additional manually marked dates are holidays. A marked weekday allows the same flexible combinations.
- With a city selected, its official local holidays and Catalonia-wide public holidays also count as holidays for shift coverage, monthly limits, and workload totals.
- Each person has a monthly holiday allowance of 24 hours: one 24-hour duty or two 12-hour duties on separate holiday dates, according to their permissions. Three non-holiday dates per month remain the limit. The one-duty-per-date and non-consecutive-date rules still apply.
- No consecutive start dates, including saved adjacent months. No unknown assignments are invented for an unsaved month.
- Individual allowed shift types, recurring blocked weekdays, and month-specific blocked dates must be respected. Someone allowing only 12-hour shifts cannot cover a non-holiday 24-hour duty.
- A confirmed manual exception can override availability, shift permissions, monthly limits, or consecutive-date rest. It remains flagged in the interface and report until edited, removed, or replaced by generation. Duplicate seats, two shifts for one person on the same date, and incompatible shift structures can never be forced.

With 20 participants, complete coverage may be impossible. Eight holidays require 384 hours of coverage, so at least 16 participants are needed with a 24-hour holiday allowance each. Participants choosing 12-hour shifts can contribute on two separate, non-consecutive holiday dates. Availability and permitted day/night shifts can require more people; 12-hour-only participants cannot cover ordinary dates, which still require 24-hour duties. The generator can combine holiday patterns across dates, respects each participant's allowance, and marks incomplete dates yellow.

Changing availability or marking/unmarking a holiday does not silently regenerate the schedule. Existing conflicts are shown. If a holiday with 12-hour duties becomes a non-holiday, those duties are flagged. Generate month replaces all existing assignments, including incompatible duties and legacy fixed assignments. Old anonymous backups remain readable; their monthly coverage preference is ignored and their assignments are preserved.

Times are displayed in the intended Europe/Madrid duty convention. Hours are nominal (12/24); an actual clock-change date can contain a different elapsed duration. This app does not export timed calendar events.

## Mandatory name privacy

Participant names exist only in the live page and an in-memory map. They are never sent to a server, scheduling worker, URL, log, browser storage, or JSON backup. Anonymous participant identifiers and numeric codes are used for all saved data. The persistence/import boundary selects and validates known fields rather than serializing UI objects. No analytics, remote fonts, or third-party scripts are used.

The selected city is saved as a recognized municipal code, including in anonymous backups. Its display name comes from the public dataset. Free text entered in the city field is never saved; unrecognized entries are rejected. The city search and holiday lookup work locally without online requests.

**Reloading clears every entered name.** Re-enter names for each session. Anonymous restrictions, assignments, and participant codes remain available in the same browser. This is local storage, not cross-device synchronization; clearing site data removes it.

**Explicitly printed/exported PDFs are the sole authorized exception:** they may contain participant names. Treat those files accordingly. Print-report DOM is removed after printing. Anonymous backups deliberately cannot restore names.

Deleting a participant, after confirmation, deletes their assignments from every saved month. Imports replace the entire anonymous dataset after validation and confirmation and clear temporary names. Unreadable existing storage is not silently overwritten. Storage failures remain visible; export a backup before leaving.

## Tests

Run core tests with Node.js 20 or later:

```powershell
node --test tests/core.test.mjs tests/flexible.test.mjs tests/holidays.test.mjs tests/moves.test.mjs tests/encoding.test.mjs
```

Optional browser tests require Playwright, a headless Edge installation (or set `BROWSER_CHANNEL`), and `pdf-lib` for PDF page checks. They use synthetic names only, run their own local server under a nested URL, and place screenshots/PDFs in the operating system's temporary folder:

```powershell
node tests/browser.test.mjs
node tests/moves.browser.test.mjs
```

## City holidays and data coverage

The bundled official **2026** snapshot contains 1,398 municipal/settlement entries and 2,794 local holiday dates, together with the 12 Catalonia-wide public dates. Sources: [Generalitat municipal holiday dataset](https://analisi.transparenciacatalunya.cat/d/b4eh-r8up), [Generalitat general calendar dataset](https://analisi.transparenciacatalunya.cat/d/yf2b-mjr6), and [2026 calendar and Aran exception](https://treball.gencat.cat/ca/ambits/relacions_laborals/ci/calendari_laboral/calendari-festes-2026/). For Aran settlements, June 17 replaces December 26 as the general holiday; weekends remain holidays independently.

Calendar badges distinguish **Local holiday**, **Public holiday**, and **Added holiday**. Saturday and Sunday share a **Weekend** column header and subtle highlighting instead of repeated tags on each day; PDFs use the same header treatment. Local and public holidays share a dark green badge and border, with distinct text labels, including when they fall on weekends. Both remain visible even when missing coverage makes the date yellow. PDFs include the city and holiday labels.

Selecting another city rechecks all saved months without deleting assignments or manual dates. Official dates are not editable individually in the date dialog; clear/change the city to remove automatic dates. Manual dates remain independent.

**Other years are not inferred.** When navigating outside 2026, the application prominently warns that official city/public dates are unavailable and asks you to add dates manually. A city/settlement absent from the snapshot cannot be auto-matched; consult its council and use manual dates. Entries containing only one published local date are explicitly flagged as incomplete.

`holiday-data.mjs` is a local snapshot, not a live API. To refresh the 2026 source data, developers can run:

```powershell
python scripts/refresh-holidays.py
```

The refresh script reads only the public datasets and validates counts before overwriting the snapshot. Adding another supported year requires reviewing that year's official data, labels, and territorial exceptions and updating tests; changing the year constant alone is insufficient. This command is not needed to run the app. The data is reused under the Generalitat's open-data terms; see the [official catalogue licence](https://datos.gob.es/es/catalogo/a09002970-calendario-de-fiestas-locales-en-catalunya).

## GitHub Pages

The planner's public URL is **https://llopsa4.github.io/ai-public-utils/calendari/**. All asset and worker URLs are relative so the folder works under this project subpath.

Repository Settings → Pages uses **Deploy from a branch**, with **main** and **/(root)** selected. The repository root contains `.nojekyll` to serve the static files without Jekyll processing, plus a homepage linking to this planner.

To update the live planner, commit changes in `calendari/` and push `main` to `origin`. GitHub Pages deploys the new version automatically; check the Actions tab for its status. No build step or package installation is needed. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

QR codes, Google Calendar integration, calendar import links, and shared online storage are not included in this version.

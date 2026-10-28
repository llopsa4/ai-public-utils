# Calendar project instructions

This is a personal, static scheduling application. Keep implementation readable and independent of other repository projects.

## Mandatory privacy requirements

- All application text, instructions, documentation, and PDF content must be in English.
- Participant names must exist only in session memory and the live document. Never save names in browser storage, JSON backups, URLs, logs, worker messages, source files, analytics, or servers.
- Persist participants and assignments using randomly generated anonymous identifiers and numeric participant codes only. Use an explicit allowlist when serializing or importing data; never serialize UI state or name maps.
- Reloading the page must discard names. Ask users to re-enter them; never offer name persistence.
- Names are authorized only in PDFs explicitly exported or printed by the user. Do not write temporary reports containing names to disk or upload them.
- Do not add telemetry, remote fonts, or third-party scripts that could receive names.
- Test name exclusion from storage and backups whenever persistence changes.
- Participant names and availability edits remain in a session-only draft until the participant form is confirmed. Apply name, shift permissions, blocked weekdays, and this month's blocked dates together after validation. Cancellation restores confirmed values. Never persist participant drafts or their names. Select blocked dates with a small calendar for the displayed month, not a free-text field. Keep existing restrictions in other months, support toggling dates by pointer/keyboard, and apply date selections only on participant confirmation.
- Open participant configuration in a centred modal only when the participant is selected; do not show the editor beneath the list. Successful confirmation closes the modal. Cancel, Escape, and close discard drafts and restore focus to the participant list. Keep Coverage & checks beneath the list and the ground rules beneath those checks, including on mobile.
- Participant selections in the date editor, including selecting Unfilled, remain pending until Confirm assignment is pressed for that spot. Cancel selection or closing the popup discards unconfirmed selections. Validate again on confirmation and keep the explicit manual-exception prompt for rule violations. Structural conflicts cannot be overridden. Drag-and-drop moves keep their existing behavior.
- A selected city is stored only as a recognized official municipal code. Never persist the free-text city input. City display names come from the bundled public dataset, not participant input.

## Scheduling requirements

- Cover two simultaneous people throughout each day: 48 nominal hours per date.
- Non-holidays have two 24-hour shifts. Every holiday, including manually marked weekday holidays, independently allows two 24-hour duties, four 12-hour duties, or one 24-hour duty plus one day and one night duty of 12 hours each. Do not add a monthly coverage selector or mode restriction. The generator chooses combinations automatically, and manual editing can split or merge each coverage place. Preserve legacy assignments but discard old monthly mode preferences when loading backups.
- Mark dates with any missing coverage yellow, including live generation previews and the final proposal. Include a textual missing-coverage indication so color is not the only signal. Fully covered dates without overlapping coverage are green, including the global PDF. Overstaffed or overlapping coverage takes priority with a red background and explicit warning on screen and in PDFs; retain missing-coverage text when both apply. Valid separate day/night holiday duties are not overstaffing. Do not add the removed summary boxes for shift seats covered, hours of cover, unfilled seats, or fixed assignments.
- Clicking an assigned entry opens an options popup: Move assignment starts destination selection; Cancel assignment removes that duty and leaves missing coverage. Closing the popup changes nothing. Dragging still starts a move directly. Moves preserve the shift type and stay within the visible month. Validate against all scheduling rules with the source removed, including saved adjacent months. Commit source removal and destination insertion atomically as a non-exception assignment. Invalid or cancelled moves leave the original unchanged. Previewed holiday splits and drag state must never be persisted.
- Saturdays and Sundays are holidays. Day starts at 09:00, night at 21:00; overnight shifts finish the next day.
- Identify weekends with a shared Weekend header over Saturday/Sunday and a subtle column highlight, rather than repeating Weekend tags inside date cells. Retain local/public/added holiday labels on those dates, coverage colours, and weekend identification in accessible date labels and the date editor. Use corresponding weekend headers in PDFs.
- City selection covers Catalonia, Spain. Apply the selected city's published local holidays and Catalonia-wide public holidays to scheduling rules, workload counts, and PDFs. Keep these separate from manually added dates so changing or clearing the city removes only automatic dates.
- Use bundled Generalitat open data and explicit source links. The current snapshot is 2026. Do not guess, repeat, or extrapolate local dates for unavailable years. Show a prominent unavailable-data warning, and keep manual holiday editing available. Handle Aran's published June 17 / December 26 general-holiday exception.
- Highlight the selected city. Label local holidays, public holidays, manually added holidays, and weekends explicitly. Local-holiday badges must remain visible when a date is also yellow for missing coverage; color alone is insufficient.
- Participants cannot work consecutive start dates, including saved adjacent months. In every mode, nobody can work more than one duty on one date.
- Each participant's monthly holiday allowance is 24 hours: one 24-hour duty or two 12-hour duties on separate dates. Use summed holiday hours for validation, including retained legacy assignments; keep the one-duty-per-date and non-consecutive-date rules. The non-holiday limit remains three dates. Respect individual shift permissions, blocked weekdays, and blocked dates.
- Shift permissions are exclusive between 24 hours and the 12-hour options. Show them as two groups separated by a divider, with day/night vertically stacked. Checking 24 hours disables day/night; checking either short shift disables 24 hours. Unchecking all choices in the active group enables the other group. Day and night may both be selected. New participants default to 24 hours. Normalize legacy mixed permissions to 24 hours on load/import, preserve all existing assignments, and expose resulting permission conflicts rather than silently deleting duties.
- Automatic generation must never introduce exceptions. Explicitly confirmed manual exceptions remain visible until edited, removed, or replaced by generation.
- Never duplicate a seat, assign the same person twice on a date, or mix incompatible shift structures. Structural errors cannot be overridden.
- Generate month replaces every assignment in the displayed month, including manual duties and exceptions. Preserve participants, availability, city, holiday dates, and other months. Ignore legacy fixed flags during generation and do not show fixed labels or controls.
- Prefer coverage, then similar monthly hours, then balanced holiday and weekend work. A bounded search must never claim a proof of infeasibility.

- Restart planner requires an explicit confirmation, removes only this planner’s storage key (never clear all local storage), clears all months and in-memory names/drafts, stops any active worker, and restores the initial current-month state. If removing storage fails, preserve the existing planner and show an error.

- Calendar view can show all participants or only one participant’s duties. Individual view highlights their workdays, mutes other dates, and hides other assignments and empty shift rows until valid move destinations are needed. Keep filtering separate from participant editing and persisted scheduling data; reset it on reload/import/restart or deletion of the viewed participant. Preserve full-schedule move validation.

## Delivery and verification

- Use relative URLs, native JavaScript modules, and no build step or backend.
- Read and write all text files explicitly as UTF-8. Do not rely on platform-default encodings or round-trip existing Unicode through a shell code page; verify UI text after edits.
- Keep entry-script and stylesheet URLs in `index.html` versioned with each asset's first 12 lowercase SHA-256 characters (`?v=...`). Refresh the relevant hash whenever that asset changes, so browser caches cannot mix new markup with an old script or theme.
- Do not publish, push, or configure GitHub Pages without a separate request.
- QR codes, Google Calendar integration, and calendar import links are deferred.
- Print / save PDF reflects the selected calendar view in one A4 landscape page, with the same participant names, shift labels, coverage colours, holiday badges, and individual workday highlights. Do not automatically add pages for every participant or replace names with codes. Include explicit warning text and preserve afterprint cleanup of name-bearing DOM.
- Keep Node's built-in test suite passing. Verify mobile layout, keyboard controls, anonymous persistence, cross-month rules, and print pagination.

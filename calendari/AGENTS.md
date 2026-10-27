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
- A selected city is stored only as a recognized official municipal code. Never persist the free-text city input. City display names come from the bundled public dataset, not participant input.

## Scheduling requirements

- Cover two simultaneous people throughout each day: 48 nominal hours per date.
- Non-holidays have two 24-hour shifts. Every holiday, including manually marked weekday holidays, independently allows two 24-hour duties, four 12-hour duties, or one 24-hour duty plus one day and one night duty of 12 hours each. Do not add a monthly coverage selector or mode restriction. The generator chooses combinations automatically, and manual editing can split or merge each coverage place. Preserve legacy assignments but discard old monthly mode preferences when loading backups.
- Mark dates with any missing coverage yellow, including live generation previews and the final proposal. Include a textual missing-coverage indication so color is not the only signal. Complete dates must not remain yellow. Global PDFs also indicate missing coverage.
- Saturdays and Sundays are holidays. Day starts at 09:00, night at 21:00; overnight shifts finish the next day.
- City selection covers Catalonia, Spain. Apply the selected city's published local holidays and Catalonia-wide public holidays to scheduling rules, workload counts, and PDFs. Keep these separate from manually added dates so changing or clearing the city removes only automatic dates.
- Use bundled Generalitat open data and explicit source links. The current snapshot is 2026. Do not guess, repeat, or extrapolate local dates for unavailable years. Show a prominent unavailable-data warning, and keep manual holiday editing available. Handle Aran's published June 17 / December 26 general-holiday exception.
- Highlight the selected city. Label local holidays, public holidays, manually added holidays, and weekends explicitly. Local-holiday badges must remain visible when a date is also yellow for missing coverage; color alone is insufficient.
- Participants cannot work consecutive start dates, including saved adjacent months. In every mode, nobody can work more than one duty on one date.
- Monthly limits are one holiday and three non-holiday dates per participant. Respect individual shift permissions, blocked weekdays, and blocked dates.
- Automatic generation must never introduce exceptions. Explicitly confirmed manual exceptions remain visible and fixed during regeneration.
- Never duplicate a seat, assign the same person twice on a date, or mix incompatible shift structures. Structural errors cannot be overridden.
- Preserve manual edits when regenerating; allow users to release the fixed status.
- Prefer coverage, then similar monthly hours, then balanced holiday and weekend work. A bounded search must never claim a proof of infeasibility.

## Delivery and verification

- Use relative URLs, native JavaScript modules, and no build step or backend.
- Do not publish, push, or configure GitHub Pages without a separate request.
- QR codes, Google Calendar integration, and calendar import links are deferred.
- Keep Node's built-in test suite passing. Verify mobile layout, keyboard controls, anonymous persistence, cross-month rules, and print pagination.

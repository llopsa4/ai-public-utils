# Code-quality audit — calendari/

Audit of bugs, dead code, readability, and test gaps (not an AGENTS.md compliance review), started 2026-11-20.
The real team size is 20 participants, so performance findings are graded at that size.

## How Codex and Claude share this file

- Each row has a **Status**: `open`, `in progress (Claude)` / `in progress (Codex)`, `done`, or `needs decision`.
- Set your row to `in progress (<agent>)` **before** editing code. Skip rows another agent has marked in progress.
- Set a row to `done` only after the Node suite passes:
  `node --test tests/core.test.mjs tests/flexible.test.mjs tests/holidays.test.mjs tests/moves.test.mjs tests/encoding.test.mjs tests/assets.test.mjs`
- `needs decision` rows change behaviour that AGENTS.md does not settle. Ask the user before touching them.
- Changes stay uncommitted for the user to review. Refresh `?v=` hashes in `index.html` when `app.mjs`, `styles.css`, or `theme.css` changes.
- Browser suites (`tests/*.browser.test.mjs`, `tests/browser.test.mjs`) were **not run**: Playwright is not installed. UI fixes are verified by reading and Node tests only.

Baseline before fixes: 45/45 Node tests passing. After fixes: 50/50 (5 new tests), 2026-11-20.

## Findings (most severe first)

| ID | Severity | Where | Finding | Fix | Model | Done when | Status |
|---|---|---|---|---|---|---|---|
| A1 | bug | `core.mjs` `generate`, `audit`, `movedAssignments`; `app.mjs` `otherAssignments` | Every rule check scans **all** saved months, and `generate` rebuilds the full `others` list for every unit at every step. With 20 participants and 12 saved months, a 3 s search covered only 168/1488 hours (36 months: 72/1488). After about a year of use, Generate month leaves most dates empty. | The rules only reach the adjacent day and Fridays in the adjacent months. Add `nearbyAssignments(state, month)` (previous, current, and next month) and use it in place of `allAssignments` for rule checks. Build `others` once per placement in `generate`. | Opus 5.5 | New tests: generation and audit with 20 people + 24 saved months never read distant months (fails on the old code); benchmark now reaches 1488/1488 h in 3 s with 12 or 36 saved months; cross-month tests still pass | done |
| A2 | bug | `app.mjs` `startSearch` error paths | When the worker errors or fails to start, `busy(false)` re-enables every control but nothing calls `render()`. The calendar keeps showing the unsaved preview proposal, and controls that render would disable (such as Clear with no city) stay enabled. | Call `render()` after `busy(false)` in the three error paths. | Opus 5.5 | Each error path re-renders; code read-through confirmed (no browser test available) | done |
| A3 | risk | `app.mjs` `navigate`/`ensureMonth` → `core.mjs` `serialize` | Every visited month is saved as an empty month. The saved data grows without bound, which makes A1 worse, and past 1000 months the saved data fails validation on reload (planner becomes storage-blocked) and backups cannot be imported. | `serialize` omits months with no holidays and no assignments. `anonymousState` (used for the worker) is unchanged. | Sonnet 5.5 | New test: empty months are dropped from serialized output, non-empty months round-trip | done |
| A4 | bug | `app.mjs` participant editor submit | A participant can be confirmed with **no** shift type checked. They are saved with `allowedKinds: []` and can never be assigned, with no warning. AGENTS.md does not say whether this is allowed. | User decided 2026-11-20: block confirmation until at least one shift type is chosen (Confirm disabled plus hint; submit also rejects). | Sonnet 5.5 | User decided; Confirm disabled and submit rejects an empty choice (code read-through; browser suites not run) | done |
| A5 | test gap | `index.html` `?v=` hashes | Nothing checks that the `?v=` hashes match the assets, so a stale hash can ship unnoticed. | Add `tests/assets.test.mjs` comparing each hash with the first 12 SHA-256 characters of the file. Add it to the README test command. | Sonnet 5.5 | Test passes; fails if an asset changes without a hash refresh | done |
| A6 | test gap | `holidays.mjs` `PUBLIC_NAMES` | The public-holiday name map is keyed by MM-DD and holds year-specific Easter dates. A refreshed snapshot for another year would silently fall back to "Public holiday". | Add a comment and a test that every general date in the snapshot has a name. | Sonnet 5.5 | Test passes for the 2026 snapshot | done |
| A7 | dead code | `styles.css`, `theme.css` | 12 classes are never used by `app.mjs` or `index.html`: `calendar-hint`, `city-heading`, `compact`, `coverage-note`, `hours-bar`, `print-notice`, `print-person-metrics`, `print-person-total`, `print-shift-table`, `print-totals`, `settings-row`, `shift-hours`. | Remove their rules and selectors, then refresh the hashes. | Sonnet 5.5 | Classes no longer found in the CSS; hash test passes | done |
| A8 | dead code | `app.mjs` lines 1–3 | Two separate import statements from `core.mjs`, and `KINDS` is imported but never used. | Merge into one import and drop `KINDS`. | Sonnet 5.5 | One `core.mjs` import, nothing unused | done |
| A9 | readability | `core.mjs` `coverageStatus` | The overstaffed check `seats.reduce(...) > 2` can only be true when a seat already counts above 1, so the clause is redundant. | Remove the redundant clause. | Sonnet 5.5 | Coverage tests pass | done |
| A10 | readability | `app.mjs` `renderDay` | `otherAssignments(s)` is computed twice for every participant option of every slot. | Compute it once per slot. | Sonnet 5.5 | Single call per slot | done |
| A11 | readability | `app.mjs` `#day-content` | Two separate `click` listeners on the same element handle unrelated buttons, which makes the dispatch order hard to follow. | Merge them into one listener with an explicit branch for each button type. | Sonnet 5.5 | One click listener on `#day-content` | done |
| A12 | readability | `app.mjs` `navigate`, `startSearch` | `navigate` is a single 300-character line. The 10 s search budget is hard-coded both in `postMessage` and in the status text. | Spread `navigate` over several lines and add a `SEARCH_MS` constant used in both places. | Sonnet 5.5 | No behaviour change; status text built from the constant | done |

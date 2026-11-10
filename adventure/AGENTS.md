# Claude ↔ Codex instructions

- `art/CODEX.md` is the only instruction inbox. Claude writes all new Codex tasks there; do not create separate NEXT or FIXES files.
- Codex removes each instruction after completing it, leaving unfinished instructions in place. An empty file means there are no queued instructions.
- Generated art briefs and `art/briefs/CATALOG.md` are reference material, not a task queue. Generators must never overwrite `art/CODEX.md`.
- `CLAUDE-INBOX.md` is the only queue the other way: Codex writes tasks for Claude there (same rules: Claude removes each when done). Do not create other handoff files at the root; a delivery's own `art/inbox/<folder>/HANDOFF.md` is fine, with an entry in `CLAUDE-INBOX.md` pointing to it.
- Both agents read `WORKLOG.md` at the start of a session and update their own sections before stopping (what is built but unchecked, what each is waiting on, recent decisions).
- Once a delivery from `art/inbox/` is installed, the agent who installed it moves its folder to `art/inbox/done/` (the inbox is git-ignored and local; nothing is deleted).

# Adventure testing

Follow [TESTING.md](TESTING.md) for command definitions and feature selection.

- Run unit tests only: `npm test` and the relevant `test:feature` suites, for every change, including shared runtime changes and before publishing.
- Do not run `npm run test:release`, `test:browser`, `e2e` or other Playwright checks unless the user asks for them. Inspect changed visuals with screenshots instead.
- Keep all existing coverage classified. New Node test files go in the suite catalog; browser tests need a feature tag and exactly one `@focused`/`@journey` tag. Use `test:inventory` to audit discovery.
- Unknown commands and unprovided blocking outcomes must fail in the headless driver. Do not silently simulate a win or remove assertions to save time.
- Browser commands build fresh once per invocation; do not treat results against old published assets as validation of current source.
- Report the tests actually run. Do not commit or push unless asked; the parent repository's explicit-push rule still applies.

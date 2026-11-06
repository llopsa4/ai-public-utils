# Adventure testing

Follow [TESTING.md](TESTING.md) for command definitions and feature selection.

- Ordinary edits: run `npm test` and the relevant `test:feature` suites. Do not run full browser journeys by default.
- New/changed browser wiring, input, artwork placement or persistence: add the relevant `test:browser` feature checks and inspect changed visuals.
- Shared runtime/state/dialogue-effect/scene/command-runner/chapter/build behavior changes, and before publishing: run `npm run test:release`.
- `test:feature -- input` covers Node contracts, not real gesture behavior; input changes also require the browser input suite.
- Keep all existing coverage classified. New Node test files go in the suite catalog; browser tests need a feature tag and exactly one `@focused`/`@journey` tag. Use `test:inventory` to audit discovery.
- Unknown commands and unprovided blocking outcomes must fail in the headless driver. Do not silently simulate a win or remove assertions to save time.
- Browser commands build fresh once per invocation; do not treat results against old published assets as validation of current source.
- Report the tests actually run. Do not commit or push unless asked; the parent repository's explicit-push rule still applies.

# Adventure testing

Follow [TESTING.md](TESTING.md) for command definitions and feature selection.

- Run unit tests only: `npm test` and the relevant `test:feature` suites, for every change, including shared runtime changes and before publishing.
- Do not run `npm run test:release`, `test:browser`, `e2e` or other Playwright checks unless the user asks for them. Inspect changed visuals with screenshots instead.
- Keep all existing coverage classified. New Node test files go in the suite catalog; browser tests need a feature tag and exactly one `@focused`/`@journey` tag. Use `test:inventory` to audit discovery.
- Unknown commands and unprovided blocking outcomes must fail in the headless driver. Do not silently simulate a win or remove assertions to save time.
- Browser commands build fresh once per invocation; do not treat results against old published assets as validation of current source.
- Report the tests actually run. Do not commit or push unless asked; the parent repository's explicit-push rule still applies.

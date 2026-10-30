# Public utilities

Personal static web applications hosted on GitHub Pages.

- [Kiln Courier](https://llopsa4.github.io/ai-public-utils/FFCardGame/) — an original industrial-fantasy card combat prototype. See [local play instructions](FFCardGame/README.md).

- [Duty calendar](https://llopsa4.github.io/ai-public-utils/calendari/) — monthly scheduling with Catalan public and local holidays. See [the planner guide](calendari/README.md).
- [Family tree](https://llopsa4.github.io/ai-public-utils/arbre/) — password-protected, read-only family tree. Unencrypted data and editors stay in the ignored `arbre/local/` folder. See [the tree guide](arbre/README.md).

## Publishing

GitHub Pages serves the root of the `main` branch. The empty `.nojekyll` file disables Jekyll processing; HTML, native JavaScript modules, CSS, and the scheduling worker are served directly.

Kiln Courier uses TypeScript, React, and Vite. Run `npm ci` and `npm run build` inside `FFCardGame` after changing its source; include its generated `index.html` and `build/` assets with the source changes. Its build preserves this branch-based hosting layout and does not build or replace the other applications.

To update the site, commit your changes and push `main` to `origin`. GitHub Pages deploys the updated files automatically. Check the repository's Actions tab for deployment status.

Only publish application files and public data. Participant names belong only in the planner's live session and explicitly exported PDFs.

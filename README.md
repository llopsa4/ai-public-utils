# Public utilities

Personal static web applications hosted on GitHub Pages.

- [Games](games/README.md) — The Rift: Ashlands, Kiln Courier and Kota, each published under `games/`.
- [Duty calendar](https://llopsa4.github.io/ai-public-utils/calendari/) — monthly scheduling with Catalan public and local holidays. See [the planner guide](calendari/README.md).
- [Premiere Tracker](tracker/README.md) — a Windows tray app (not a web page) that measures the time you actively work in Adobe Premiere Pro, per project. Install with `tracker/Setup.bat`.
- [Family tree](https://llopsa4.github.io/ai-public-utils/arbre/) — password-protected, read-only family tree. Unencrypted data and editors stay in the ignored `arbre/local/` folder. See [the tree guide](arbre/README.md).

## Publishing

GitHub Pages serves the root of the `main` branch. The empty `.nojekyll` file disables Jekyll processing; HTML, native JavaScript modules, CSS, and the scheduling worker are served directly.

The games build and publish from their own folders; see [the games publishing notes](games/README.md#publishing).

To update the site, commit your changes and push `main` to `origin`. GitHub Pages deploys the updated files automatically. Check the repository's Actions tab for deployment status.

Only publish application files and public data. Participant names belong only in the planner's live session and explicitly exported PDFs.

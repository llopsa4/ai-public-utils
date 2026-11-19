# Mara's combat poses

These approved transparent v2 drawings were copied from the local reference collection
`art/inbox/reference/mara-athletic-v2/combat/` so rebuilding does not depend on ignored files.
They include the corrected, enlarged gauntlet and straight wrist.

Run `node art/combat-poses.mjs` to rebuild the optimized lower-guard and punch WebPs.
The importer trims transparent margins and normalizes full-figure height to 640 pixels;
combat renders them at a shared floor anchor. The existing `art/src/kc/hero.webp`
remains the upper-guard approach pose.

# Kofi prologue authoring reference

Edit **spec.json** for visual facts, target classification, stage visibility, parent attachments and source-scene links. Edit **../../STORY.md** for narrative/dialogue and puzzle intent. Generated files in **reference/** are not edited directly.

From games/adventure/:

```
npm run art:briefs -- --private-spec private/kofi1/spec.json
npm run art:briefs -- --private-spec private/kofi1/spec.json --check
```

The old inbox index redirects here. The zip is a recovery snapshot only. No gameplay, game art, runtime import or save-format change is part of this authoring workflow. The user approved tracking this prologue-only specification and its generated references, including prologue puzzle and ending spoilers. The `private/` path and `--private-spec` option are retained for compatibility; they do not imply that this pack is git-ignored. The complete `STORY.md` and `before-alignment.zip` recovery snapshot remain ignored. Public tools and tests do not require this folder.

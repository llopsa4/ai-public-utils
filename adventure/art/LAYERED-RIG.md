# Mara's articulated source packs

Mara uses the optional eleven-piece renderer in `art/layered-rig.mjs`. Other characters retain the renderer and six-frame cadence in `art/rig.mjs`.

## Sources and rebuilding

The three complete source packs are in `art/sources/characters/mara-{casual,light,medium}-layered/`. Each contains `master.png`, eleven transparent layers, the approved original standing `idle.png`, `rig.json`, `joints.png`, its colour legend, two drawn walk references and the existing complete kneeling/lying pictures. Layer/master/joint/reference canvases are 1024×1536; lying is 1536×1024. Walking profiles have one visible eye; the separate original idle sources have two.

`RIGS[id].layeredPack` opts a character into this format. Joint/face measurements live in the pack's `rig.json`, which is authoritative; they are not the old flattened-mask estimates. `powered` selects a derived ember-cell state. Rebuild only the intended sheet with:

```powershell
node art/rig.mjs mara-casual
node art/rig.mjs mara
node art/rig.mjs mara-gauntlet
node art/rig.mjs mara-medium
node art/rig.mjs mara-medium-gauntlet
```

The usual final-art guard is still respected. These Mara entries are generated sheets backed by approved source artwork. Originals of the replaced runtime sheets and all production/review prompts remain in the local inbox handoff.

## Silas

Silas, the intro's hero, has a pack in the same format: `art/sources/characters/silas-layered/` (Codex's handoff in `art/inbox/done/silas-layered/`), one outfit, 220 art px tall. Its `rig.json` adds `overlays`: his disguises as layers on the same coordinates, one per pose (`mask-harrow-{stand,kneel,lie}.png`, `mask-clerk-hood-{stand,kneel,lie}.png`, and `mask-clerk-ledger.png` on the near forearm). `RIGS` builds three sheets from it into `art/src/intro/`:

- `silas`, standing still in the three-quarter `idle.png`;
- `silas-harrow` (`overlay: 'harrow'`, no blink: the mask covers his eyes), standing in the walk master's pose because the masks are drawn to it;
- `silas-clerk` (`overlay: 'clerk'`, `forearmRaise`: the near forearm held up so the ledger rests on his chest).

Each has its portrait strip (`portraitId`, `moods`). `hooded-idle.png` (a cape costume) is a standing drawing only, not rigged.

```powershell
node art/rig.mjs silas
node art/rig.mjs silas-harrow
node art/rig.mjs silas-clerk
```

## Pack contract

`rig.json` version 1 supplies the canvas, height, baseline, layer stacking order, near/far shoulders, elbows, hips, knees and ankles. Eyes include centres, regions, skin samples and grid-aware eyelid dimensions; face data includes mouth/brow regions and the portrait crop. Ember regions identify glass only, including its locations in the complete kneeling/lying drawings.

The layer order is far upper arm, far forearm, far thigh, far shin, far boot, near thigh, near shin, near boot, torso, near upper arm, near forearm. Every PNG retains walking-master coordinates. Opaque neutral compositing must reproduce every walking-master RGBA pixel exactly; pack loading rejects a mismatch. Concealed artwork and rounded joint extensions are in the source layers rather than generated during playback. When stopped, the renderer uses the original approved standing bitmap, with its own baseline, eye regions and ember position, pixelated to the same 232px height. `rig.json` records the original idle bitmap's SHA-256.

The renderer uses fixed-length two-bone leg IK and hierarchical arm/ankle transforms. Eight walk samples place contacts at 0/4 and passing poses at 2/6. The drawn references guide the hip swing, arm swing and foot lift; fixed source anatomy constrains the final rig rather than stretching it to copy generative pose variations. Planted ankles move backwards in source space by exactly the actor's forward travel. The floor and hip anchor remain fixed between frames. Mara's output is palette-normalized on a 1-art-pixel grid with a 232-art-pixel standing silhouette and the existing 2-art-pixel outline. Standing, walking, kneeling and lying use the same finer sample density; this is a Mara-only exception to the world's 2-pixel grid. The 256×256 frame contract, anchors, source anatomy scale and world-space stride metadata stay unchanged. The title keeps the light-armour sheet; the casual sheet loads with the opening room to avoid downloading two detailed outfits before play starts.

The existing Aseprite frame-tag contract remains intact. New sheets optionally add `meta.walk = { distancePerFrame, plantFrames }`, in logical world units before depth scaling. Actor movement reads that metadata; sheets without it retain 7 logical pixels per frame and contacts 0/3. PNG animation duration is a preview cadence, while in-game frame selection follows distance travelled.

## Runtime outfit selection

The chapter still chooses casual/dressed and the gauntlet's power state. Equipped `layered-armor` maps an armoured light sheet to the matching medium sheet. Other armour uses light; casual remains casual before gearing up. Equipping refreshes appearance without moving or changing the actor's pose/facing. Oren grants and equips medium armour after his initial gallery repair-advice dialogue; Gear becomes available then. Repeated advice neither duplicates the reward nor overrides a later outfit choice. Ownership and equipment use the existing save fields.

## Verification

Run `npm run art:check`, `npm run typecheck` and `npm test`. `tests/layered-rig.test.ts` checks exact source reconstruction, fixed bone lengths, connected pivots, planted-foot stability, joint coverage, safe edges, palette/grid output, visible blinks, legacy timing, outfit selection and powered pose consistency.

The local inbox handoff has full-size layers, joint overlays, drawn references, animated GIFs, frame strips and browser screenshots. Browser review uses the Vite development server, not a publishing build.

## Drawn mood faces

A character's portrait moods (`moods` in the manifest) are usually made in code, by bending the brows and mouth of the neutral face. With `drawnFaces: '<folder>'`, the rig instead pastes `<folder>/<mood>.png` and `<mood>-talk.png` over the portrait crop for every mood except neutral. Each file is exactly the crop's size and transparent outside the head. Benn (`char-guard`) and Kell (`char-warden`) use this. Rebuild with `node art/rig.mjs guard` and `node art/rig.mjs warden`.

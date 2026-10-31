# Asset provenance

## Fantasy interface and bundled fonts — 2026-10-31

Status plaques, ceramic corners, pressure-gauntlet and furnace-eye crests, ruby HP stones, sapphire MP gems, block shields and corner flourishes were authored as original SVG/CSS in client/src/components/Ornaments.tsx and style.css. All labels and resource values remain rendered text with accessible meters. The approved private concept image is not a shipped asset; no character, environment or card illustration was replaced.

Unmodified variable font binaries downloaded from the official Google Fonts repository at commit `3dd78844021e948ceb633d1dcee3f7885561b5d9`, with their complete license texts preserved in assets/fonts/ and included in generated output through the HTML license links:

- **Cinzel**, Natanael Gama / The Cinzel Project Authors. [Source](https://github.com/google/fonts/tree/3dd78844021e948ceb633d1dcee3f7885561b5d9/ofl/cinzel). Original filename `Cinzel[wght].ttf`; local `Cinzel.ttf`. SHA-256 `f4d83d34d1f6c741193e4acf4b3dff9531e5a67b6aa65228d00a7db72a4e0f34`. License: [Cinzel-OFL.txt](fonts/Cinzel-OFL.txt).
- **Cormorant Garamond**, Christian Thalmann / The Cormorant Project Authors. [Source](https://github.com/google/fonts/tree/3dd78844021e948ceb633d1dcee3f7885561b5d9/ofl/cormorantgaramond). Original filename `CormorantGaramond[wght].ttf`; local `CormorantGaramond.ttf`. SHA-256 `b20b7d9626dd956b2c5e558692ad328b1f19e3275e2782db4fa07670d83f35e0`. License: [CormorantGaramond-OFL.txt](fonts/CormorantGaramond-OFL.txt).

Both families identify SIL Open Font License 1.1 in their supplied license files. Font downloads are development inputs only; runtime URLs are relative/local. The complete fonts are used without subsetting or changes to their internal names.

## Gauntlet strain instrument

Original code-native SVG and CSS authored for this project on 2026-10-30 in client/src/components/Resources.tsx and style.css. Ceramic gauntlet medallion, pressure vents, metal gradients and flame outlines use original geometry; no external image, font, model or generated raster asset was added. Heat and overload presentation follows resolved combat state; reduced-motion preferences disable movement.

## card-atlas.png — cinematic interface

Generated on 2026-10-30 using the built-in OpenAI image-generation tool. References were the project's original hero and the approved internal combat-interface concept. One square 3×3 atlas contains seven card illustrations plus two pile backs. The interface samples its cells with CSS; no generated text is used for card names, costs, or effects. The atlas was visually inspected and copied unchanged into the project. Original output: exec-81206561-6179-417a-bd96-d4fbd0f710d1.png.

Exact prompt:

```text
Use case: stylized-concept. Create ONE production asset: a perfectly aligned 3 by 3 sprite atlas of nine square painterly card illustrations, a square image overall. Exactly three equal-width columns and three equal-height rows, all cells identical size, edge-to-edge illustrations. NO gutters, NO margins, NO frames, NO text, NO symbols representing numbers, NO titles, NO UI, NO labels. The grid positions must be exact because the image will be sampled using CSS background-position.

The first reference is a combat UI concept: match the small painted card vignette style, not the screenshot layout. The second reference is the original hero: preserve the ivory ceramic armor, brass pressure gauntlet, ochre cloth, charcoal industrial fantasy materials. Entire atlas uses textured painterly realism, warm ivory ceramic, dark bronze/brass, charcoal shadows, ember orange sparks, cinematic local lighting. Rich detailed art that reads at tiny card size. Each cell has a centrally composed focal object, with a little breathing room near its edges, no objects crossing between cells. Avoid faces, humans, lettering, franchise imagery.

Top row left: close-up of an ivory and brass pressure gauntlet punching rightward, shower of sparks, ochre cloth at the wrist.
Top row center: a rounded ivory ceramic shield at an angle deflecting a stream of glowing sparks, solid protective silhouette.
Top row right: the pressure gauntlet releasing a brilliant concentrated orange pressure-wave ring, an explosive signature attack; luminous but detailed.

Middle row left: old brass steam vents releasing graceful white steam plumes against dark machinery.
Middle row center: an ornate but functional brass rotary pressure valve wheel with pipes, faint steam around it.
Middle row right: a powerful large brass piston and ivory armored knuckle driving forward, glowing compression chamber and fiery impact.

Bottom row left: a curved layered ivory ceramic heat shield with warm ember light illuminating its edges, darker soot background.
Bottom row center: a decorative CARD BACK illustration without any writing: closed kiln doorway insignia embossed into worn dark bronze and charcoal leather, a small restrained ember slit, symmetrical vertical design.
Bottom row right: a second decorative CARD BACK without writing: a circular pressure-wheel insignia engraved into dark brass and charcoal leather, symmetrical vertical design.

Make all nine tile boundaries exact and straight. No contact-sheet annotations. No surrounding border. One coherent beautiful production texture, not a screenshot.
```

Created on 2026-10-30 using the built-in OpenAI image-generation tool. No uploaded reference images were used. The final files were copied unchanged from the generated outputs into this directory. Hero and guardian are RGBA PNGs requested with transparent backgrounds; the environment is an opaque RGB PNG. The illustrations were visually inspected together in the battle layout.

Creative brief: original industrial fantasy, rounded ceramic armor, ochre cloth, charcoal metal, ivory and ember orange. All character names, world text, card names, interface drawings, and the kiln mark were authored for this project. No existing franchise imagery, sound, fonts, logos, or character designs were supplied as inputs.

## hero.png

1024 × 1536; RGBA. Original output: exec-37ec7db6-71c3-4c2b-bdc3-cbae06f30e88.png.

Exact prompt:

> Full-body isolated character cutout, transparent background. Original game illustration for Kiln Courier, painterly industrial fantasy, charcoal soot, warm ivory ceramic, ochre and ember orange, textured brushwork, sophisticated atmospheric lighting, entirely original designs, no existing franchise references, no text, no lettering, no logos. An adult courier with close cropped dark hair, rounded segmented ivory ceramic armor, asymmetric ochre cloak, satchel and a huge pressure-powered brass and ceramic gauntlet, facing right in a grounded ready stance. Distinct rounded silhouette, worn handmade materials, small ember glow in gauntlet, feet fully visible. Character fills vertical frame.

## guardian.png

1536 × 1024; RGBA. Original output: exec-44983573-b6ad-4435-92e3-ec615544663f.png.

Exact prompt:

> Full-body isolated enemy cutout, transparent background. Original game illustration for Kiln Courier, painterly industrial fantasy, charcoal soot, warm ivory ceramic, ochre and ember orange, textured brushwork, sophisticated atmospheric lighting, entirely original designs, no existing franchise references, no text, no lettering, no logos. A squat many-legged furnace guardian, six articulated cast-iron legs, broad cracked ivory ceramic kiln carapace, central orange furnace opening like a circular eye, vent pipes on its back. Facing left in a threatening grounded stance. Creature machine, no humanoid, all legs fully visible, fills wide frame.

## kiln-hall.png

Landscape RGB. Original output: exec-6542ba3f-741f-44ed-adec-9ef20a16a80d.png.

Exact prompt:

> Original game illustration for Kiln Courier, painterly industrial fantasy, charcoal soot, warm ivory ceramic, ochre and ember orange, textured brushwork, sophisticated atmospheric lighting, entirely original designs, no existing franchise references, no text, no lettering, no logos. Wide landscape 16:9 environment background, abandoned monumental kiln hall, vaulted brick roof, old industrial ceramic furnace openings, rusted rails, dusty stone floor with a wide empty combat stage across the lower third. Distant hot furnace provides muted amber backlight, smoky atmospheric depth, dark edges, no characters, no creatures, no UI. High quality environment concept painting.

## mark.svg and card icons

Hand-authored SVG geometry: a kiln doorway and flame; pressure gauntlet, shield, piston, vents, heat shield, and pressure-cycle motifs. No icon libraries or external assets used.

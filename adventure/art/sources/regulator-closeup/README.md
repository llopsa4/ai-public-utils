# Regulator close-up: existing painted parts

The user selected reuse of the exact gallery artwork on 2026-11-14; implemented and
verified on 2026-11-15. No new image generation or repainting was used.

- Gauge: the unchanged `art/src/props/gauge-face.png`, under a separate animated needle
  and pressure-safe marker. Its measured housing center is (256,43) in a 512×320 board.
- Removable brass center: crop (40,36,80,80) from the installed frame of the socket
  drawing as it was before the C7 gallery redraw (2026-11-17), kept here as
  `socket-pre-c7.png` (the redrawn `art/src/objects/socket.png` is not its source); pivot (80,76) in its left 160px atlas cell. A hard
  radius-36 mask on the existing 2px grid retains the exact source RGBA inside the cap.
  `prepare-center.mjs` reproduces `art/src/props/regulator-closeup-center.png` only.
- Placement: cap at housing (256,186), displayed 128×128 beneath the independent
  retaining ring. It remains visible through unlocking until successful lift-out.

Run from `adventure/`: `node art/sources/regulator-closeup/prepare-center.mjs`.
The focused regulator tests verify source-pixel equality, opacity, transparency and
painted gauge rendering. Manual Vite and scratch-production review at desktop window
sizes verified alignment, all puzzle stages, cancellation and normal release/reward flow.

C7 gallery r2 (2026-11-17) replaced `gauge-face.png` and `socket.png` in the room. The close-up
reuses the new gauge face automatically; its brass centre still comes from the pre-C7 socket.
Refreshing the centre from the new socket is a separate art request.

// Icons drawn in code for things that have no art yet (Codex art replaces them through the art
// manifest; see art/briefs). SVG markup, coloured with currentColor where it should take the theme.

/** A Kiln Tonic: a stoppered flask of ember-orange tonic, glowing (art/manifest.mjs `item-tonic`). */
export const TONIC_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="tonic-glow" cx="50%" cy="62%" r="50%"><stop offset="0" stop-color="#ffb347" stop-opacity="0.55"/><stop offset="1" stop-color="#ff7a1f" stop-opacity="0"/></radialGradient>
    <linearGradient id="tonic-liquid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="0.45" stop-color="#ff8a2a"/><stop offset="1" stop-color="#b8420e"/></linearGradient>
    <linearGradient id="tonic-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#fff" stop-opacity="0.18"/></linearGradient>
  </defs>
  <circle cx="32" cy="40" r="28" fill="url(#tonic-glow)"/>
  <rect x="26" y="5" width="12" height="7" rx="2" fill="#7a4e26" stroke="#2a1606" stroke-width="1.5"/>
  <rect x="24.5" y="11" width="15" height="4" rx="1.5" fill="#a8743a" stroke="#2a1606" stroke-width="1.5"/>
  <path d="M27 15h10v9c8 3 13 9 13 17 0 10-8 17-18 17s-18-7-18-17c0-8 5-14 13-17z" fill="#2a1d16" stroke="#1a0f08" stroke-width="2"/>
  <path d="M17 39c3-2 8-1 15 1s11 2 15-1c1 9-6 16-15 16s-16-6-15-16z" fill="url(#tonic-liquid)"/>
  <circle cx="26" cy="46" r="1.8" fill="#ffe7b0" opacity="0.8"/><circle cx="35" cy="50" r="1.2" fill="#ffe7b0" opacity="0.7"/><circle cx="31" cy="43" r="1" fill="#ffe7b0" opacity="0.6"/>
  <path d="M27 15h10v9c8 3 13 9 13 17 0 10-8 17-18 17s-18-7-18-17c0-8 5-14 13-17z" fill="url(#tonic-glass)" stroke="#c89b5a" stroke-width="1.2" stroke-opacity="0.6"/>
  <path d="M21 33c-2 3-3 6-3 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
</svg>`;

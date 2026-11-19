// Touch input: a floating stick on the movement side, dash and ability buttons on the other.
// Keyboard fallback (WASD or arrows, Space dash, E ability) for desktop testing.

const STICK_RADIUS = 56;
const ACTIONS = ['dash', 'ability'];
const KEYS = { Space: 'dash', KeyE: 'ability' };

export function createInput({ surface, buttons, stickBase, stickKnob }) {
  const move = { x: 0, y: 0 };          // stick vector, length 0..1, y down
  const held = new Set();               // actions currently held
  const pressed = new Set();            // actions pressed since the last consume
  let leftHanded = false, active = false;
  let stickId = null, origin = null;
  const keys = new Set();

  function applyHand() { buttons.classList.toggle('left', leftHanded); }

  function onMoveSide(x) {
    const half = window.innerWidth / 2;
    return leftHanded ? x >= half : x < half;
  }

  function showStick(x, y, kx, ky) {
    stickBase.style.display = stickKnob.style.display = 'block';
    stickBase.style.left = `${x}px`; stickBase.style.top = `${y}px`;
    stickKnob.style.left = `${kx}px`; stickKnob.style.top = `${ky}px`;
  }

  function endStick() {
    stickId = null; move.x = move.y = 0;
    stickBase.style.display = stickKnob.style.display = 'none';
  }

  surface.addEventListener('pointerdown', (e) => {
    if (!active || stickId !== null || !onMoveSide(e.clientX)) return;
    stickId = e.pointerId; origin = { x: e.clientX, y: e.clientY };
    try { surface.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    showStick(origin.x, origin.y, origin.x, origin.y);
  });
  surface.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickId) return;
    let dx = e.clientX - origin.x, dy = e.clientY - origin.y;
    const len = Math.hypot(dx, dy);
    if (len > STICK_RADIUS) { dx *= STICK_RADIUS / len; dy *= STICK_RADIUS / len; }
    move.x = dx / STICK_RADIUS; move.y = dy / STICK_RADIUS;
    showStick(origin.x, origin.y, origin.x + dx, origin.y + dy);
  });
  const stickUp = (e) => { if (e.pointerId === stickId) endStick(); };
  surface.addEventListener('pointerup', stickUp);
  surface.addEventListener('pointercancel', stickUp);

  // Dash and ability fire when pressed.
  for (const el of buttons.querySelectorAll('.btn')) {
    const act = el.dataset.act;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
      held.add(act); pressed.add(act); el.classList.add('down');
    });
    const up = () => { held.delete(act); el.classList.remove('down'); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    const act = KEYS[e.code];
    if (act && !e.repeat) { held.add(act); pressed.add(act); }
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    const act = KEYS[e.code];
    if (act) held.delete(act);
  });
  window.addEventListener('blur', () => { keys.clear(); held.clear(); });

  return {
    actions: ACTIONS,
    /** Buttons and the stick only react while a run is on screen. */
    setActive(on) { active = !!on; if (!active) { endStick(); pressed.clear(); held.clear(); } },
    /** The movement stick and the buttons swap sides (left-handed play). */
    setLeftHanded(value) { leftHanded = !!value; applyHand(); },
    /** Movement vector (screen space, y down), length <= 1. */
    getMove() {
      if (stickId !== null) return { x: move.x, y: move.y };
      let x = 0, y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      const len = Math.hypot(x, y);
      return len ? { x: x / len, y: y / len } : { x: 0, y: 0 };
    },
    isHeld: (act) => held.has(act),
    /** True once per press. */
    consume(act) { const was = pressed.has(act); pressed.delete(act); return was; },
  };
}

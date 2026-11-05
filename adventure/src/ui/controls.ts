import { ITEM_ICONS } from '../game/assets';
import type { Ui } from './ui';

const CLICK_MS = 300, DRAG_PX = 8;
const arrows = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
type Gesture = { pointer: number; item: string; x: number; y: number; dragging: boolean; double: boolean };

/** Transient input only: nothing here is part of a saved game. */
export class RoomControls {
  private held = new Set<string>();
  private pending: { timer: number; item: string; time: number } | null = null;
  private gesture: Gesture | null = null;
  private pointer = { x: 0, y: 0 };
  private readonly ghost = document.createElement('img');

  constructor(private readonly ui: Ui) {
    this.ghost.id = 'carried-item';
    this.ghost.alt = '';
    this.ghost.setAttribute('aria-hidden', 'true');
    this.ghost.hidden = true;
    document.body.append(this.ghost);
    ui.inventory.addEventListener('dragstart', e => e.preventDefault());
    ui.inventory.addEventListener('click', e => {
      if (!this.itemAt(e.target)) return;
      e.preventDefault();
      // Keyboard Space activation has no pointer gesture. Enter is handled separately.
      if (e.detail === 0 && this.available()) this.clickItem(this.itemAt(e.target)!);
    });
    ui.inventory.addEventListener('dblclick', e => e.preventDefault());
    ui.inventory.addEventListener('contextmenu', e => { e.preventDefault(); this.cancel(); });
    ui.stage.addEventListener('contextmenu', e => { e.preventDefault(); this.cancel(); });
    ui.inventory.addEventListener('pointerdown', e => {
      const item = this.itemAt(e.target);
      if (e.button !== 0 || !item || !this.available() || this.gesture) return;
      this.pointer = { x: e.clientX, y: e.clientY };
      const double = this.pending?.item === item && e.timeStamp - this.pending.time <= CLICK_MS;
      // A second press inside the click window reserves the menu, even if its release is slow.
      if (double && this.pending) window.clearTimeout(this.pending.timer);
      this.gesture = { pointer: e.pointerId, item, x: e.clientX, y: e.clientY, dragging: false, double };
      ui.inventory.setPointerCapture(e.pointerId);
    });
    window.addEventListener('pointermove', e => {
      this.pointer = { x: e.clientX, y: e.clientY };
      const g = this.gesture;
      if (g && g.pointer === e.pointerId) {
        if (!this.available()) { this.cancel(); return; }
        if (!g.dragging && Math.hypot(e.clientX - g.x, e.clientY - g.y) >= DRAG_PX) {
          this.cancelPendingClick();
          this.stopMovement();
          g.dragging = true;
          ui.host.selectItem(g.item);
        }
        if (g.dragging) e.preventDefault();
      }
      this.positionGhost();
    }, { passive: false });
    window.addEventListener('pointerup', e => {
      const g = this.gesture;
      if (!g || g.pointer !== e.pointerId) return;
      this.releaseGesture();
      if (!this.available() || !ui.host.getState().inventory.includes(g.item)) { this.cancel(); return; }
      if (g.dragging) {
        e.preventDefault();
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const item = this.itemAt(element);
        if (item === g.item) ui.host.selectItem(null);
        else if (item) ui.host.useItemOnInventory(g.item, item);
        else if (element && ui.stage.contains(element)) ui.host.useItemAt(g.item, { x: e.clientX, y: e.clientY });
        else ui.host.selectItem(null);
      } else {
        const item = this.itemAt(document.elementFromPoint(e.clientX, e.clientY));
        if (item === g.item) {
          if (g.double) { this.cancel(); this.openMenu(item); }
          else this.scheduleClick(item, e.timeStamp);
        } else if (g.double) this.cancelPendingClick();
      }
    });
    ui.inventory.addEventListener('lostpointercapture', () => { if (this.gesture) this.cancel(); });
    window.addEventListener('pointercancel', () => this.cancel());
    window.addEventListener('keyup', e => {
      if (this.held.delete(e.key)) this.sendDirection();
    });
    window.addEventListener('blur', () => this.cancel());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.cancel(); });
    // Dialogs, menus, title/intro, action rings and battles can open without a room pointer event.
    new MutationObserver(() => this.reconcile()).observe(document.body, {
      subtree: true, attributes: true, attributeFilter: ['open', 'hidden'],
    });
  }

  available(): boolean {
    return !!(!this.ui.host.isBusy() && !this.ui.anyDialogOpen() && !this.ui.radialOpen
      && this.ui.choices.hidden && !this.ui.introActive && !this.ui.forcingGear
      && document.getElementById('title')!.hidden && document.getElementById('kc-root')!.hidden
      && document.getElementById('end')!.hidden);
  }

  keyDown(e: KeyboardEvent): boolean {
    if (e.key === 'Escape' && (this.gesture || this.pending || this.ui.host.selectedItem())) {
      e.preventDefault(); this.cancel(); return true;
    }
    const editing = e.target instanceof Element && e.target.closest('input,textarea,select,[contenteditable="true"],#debug-panel');
    if (!this.available() || editing || e.ctrlKey || e.altKey || e.metaKey) return false;
    if (arrows.has(e.key)) {
      e.preventDefault();
      if (e.repeat && !this.held.has(e.key)) return true;
      this.cancelPendingClick();
      this.held.add(e.key); this.sendDirection(); return true;
    }
    if (e.key === 'Enter') {
      const item = this.itemAt(e.target);
      if (item) { e.preventDefault(); this.cancel(); this.openMenu(item); return true; }
    }
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      if (e.repeat) return true;
      const index = e.key === '0' ? 9 : Number(e.key) - 1;
      const item = this.ui.host.getState().inventory[index];
      if (item) {
        this.cancelPendingClick(); this.releaseGesture(); this.stopMovement();
        this.ui.host.selectItem(this.ui.host.selectedItem() === item ? null : item);
      }
      return true;
    }
    return false;
  }

  private scheduleClick(item: string, time: number): void {
    const previous = this.pending;
    if (previous?.item === item && time - previous.time <= CLICK_MS) {
      this.cancel(); this.openMenu(item); return;
    }
    this.cancelPendingClick();
    this.pending = {
      item, time,
      timer: window.setTimeout(() => {
        this.pending = null;
        if (this.available()) this.clickItem(item);
      }, CLICK_MS),
    };
  }

  private clickItem(item: string): void {
    if (!this.ui.host.getState().inventory.includes(item)) return;
    this.stopMovement();
    const selected = this.ui.host.selectedItem();
    if (selected && selected !== item) this.ui.host.useItemOnInventory(selected, item);
    else this.ui.host.selectItem(selected === item ? null : item);
  }

  private openMenu(item: string): void {
    const index = this.ui.host.getState().inventory.indexOf(item);
    if (index !== -1 && this.available()) this.ui.host.itemClicked(item, index);
  }

  private itemAt(target: EventTarget | null): string | null {
    const button = target instanceof Element ? target.closest<HTMLElement>('#inventory [data-item]') : null;
    return button?.dataset.item ?? null;
  }

  private sendDirection(): void {
    this.ui.host.moveDirection({
      x: Number(this.held.has('ArrowRight')) - Number(this.held.has('ArrowLeft')),
      y: Number(this.held.has('ArrowDown')) - Number(this.held.has('ArrowUp')),
    });
  }

  stopMovement(): void { this.held.clear(); this.ui.host.moveDirection({ x: 0, y: 0 }); }
  cancelPendingClick(): void {
    if (this.pending) window.clearTimeout(this.pending.timer);
    this.pending = null;
  }
  private releaseGesture(): void {
    const g = this.gesture; this.gesture = null;
    if (g && this.ui.inventory.hasPointerCapture(g.pointer)) this.ui.inventory.releasePointerCapture(g.pointer);
  }
  cancel(): void {
    this.cancelPendingClick(); this.releaseGesture(); this.stopMovement();
    if (this.ui.host.selectedItem()) this.ui.host.selectItem(null);
    this.refreshItem();
  }
  reconcile(): void { if (!this.available()) this.cancel(); }
  refreshItem(): void {
    const item = this.ui.host.selectedItem();
    if (item && !this.ui.host.getState().inventory.includes(item)) { this.ui.host.selectItem(null); return; }
    const valid = item && this.ui.host.getState().inventory.includes(item);
    if (this.ghost.hidden !== !valid) this.ghost.hidden = !valid;
    if (valid) this.ghost.src = ITEM_ICONS[item];
    this.ui.stage.classList.toggle('carrying-item', !!valid);
    this.positionGhost();
  }
  private positionGhost(): void {
    this.ghost.style.left = `${this.pointer.x + 10}px`;
    this.ghost.style.top = `${this.pointer.y + 10}px`;
  }
}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CURSORS, DOUBLE_MS, DOUBLE_PX, DoubleClick, cursorFor, resolveClick } from '../src/render/click';

// Z45: what a left click does, the cursor it earns, and the double-click that upgrades a walk to a run (no Phaser).

test('a survivor is always selected, even when orders are not accepted', () => {
  assert.equal(resolveClick('survivor', true), 'select');
  assert.equal(resolveClick('survivor', false), 'select');
});

test('with a selection: enemy attacks, object uses, ground walks', () => {
  assert.equal(resolveClick('enemy', true), 'attack');
  assert.equal(resolveClick('object', true), 'use');
  assert.equal(resolveClick('ground', true), 'walk');
});

test('without a selection or while paused, orders do nothing; off the map does nothing', () => {
  for (const t of ['enemy', 'object', 'ground'] as const) assert.equal(resolveClick(t, false), 'nothing');
  assert.equal(resolveClick('none', true), 'nothing');
});

test('each action has its own cursor and a pending order shows the targeting one', () => {
  assert.equal(cursorFor('select', false), CURSORS.select);
  assert.equal(cursorFor('attack', false), CURSORS.attack);
  assert.equal(cursorFor('use', false), CURSORS.use);
  assert.equal(cursorFor('walk', false), CURSORS.walk);
  assert.equal(cursorFor('nothing', false), 'default');
  assert.equal(cursorFor('walk', true), CURSORS.target);
  assert.equal(new Set([CURSORS.select, CURSORS.attack, CURSORS.use, CURSORS.walk]).size, 4);
});

test('a first walk click is single; a second close and quick one is the double', () => {
  const d = new DoubleClick();
  assert.equal(d.walkClick(100, 100, 1000), false);
  assert.equal(d.walkClick(104, 98, 1000 + DOUBLE_MS), true);
});

test('too slow or too far apart is two single clicks', () => {
  const d = new DoubleClick();
  d.walkClick(100, 100, 1000);
  assert.equal(d.walkClick(100, 100, 1000 + DOUBLE_MS + 1), false);
  assert.equal(d.walkClick(100 + DOUBLE_PX + 1, 100, 1000 + DOUBLE_MS + 50), false);
});

test('a third click starts over, and reset (any other click in between) cancels the pending double', () => {
  const d = new DoubleClick();
  d.walkClick(0, 0, 0);
  assert.equal(d.walkClick(0, 0, 100), true);
  assert.equal(d.walkClick(0, 0, 200), false);
  d.reset();
  assert.equal(d.walkClick(0, 0, 250), false);
});

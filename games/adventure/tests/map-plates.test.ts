import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fitNotebookPlates, layoutNotebookPlates } from '../src/ui/mapPlates';

const overlaps = (a: DOMRect, b: DOMRect) => a.x < b.x + b.width && a.x + a.width > b.x
  && a.y < b.y + b.height && a.y + a.height > b.y;

function plate(text: string, x: number, y: number, live = false) {
  const attributes = new Map([['x', String(x)], ['y', String(y)]]);
  const style = { fontSize: '18px' };
  const label = {
    style,
    getAttribute: (name: string) => attributes.get(name),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    removeAttribute: (name: string) => attributes.delete(name),
    getBBox() {
      const size = Number.parseFloat(style.fontSize);
      const width = attributes.has('textLength') ? Number(attributes.get('textLength')) : text.length * size * .6;
      return { x: Number(attributes.get('x')) - width / 2, y: Number(attributes.get('y')) - size * .8, width, height: size };
    },
  };
  const rect = new Map<string, string>();
  return {
    label, rect,
    classList: { contains: (name: string) => name === 'live' && live },
    querySelector: (selector: string) => selector === 'text' ? label : { setAttribute: (key: string, value: string) => rect.set(key, value) },
  };
}

test('notebook map keeps screen-sized text and distinct plates after resizing', () => {
  const here = plate('Silas is here', 300, 87, true);
  const town = plate('Ironhaven', 314, 132);
  let width = 480;
  const svg = { getBoundingClientRect: () => ({ width }), querySelectorAll: () => [town, here] } as unknown as SVGSVGElement;
  for (const next of [480, 280, 720, 280]) {
    width = next;
    fitNotebookPlates(svg);
    assert.ok(Number.parseFloat(town.label.style.fontSize) * width / 1000 >= 12);
    assert.ok(Number.parseFloat(here.label.style.fontSize) * width / 1000 >= 14);
    const boxes = [here, town].map(item => Object.fromEntries([...item.rect].map(([key, value]) => [key, Number(value)])) as unknown as DOMRect);
    assert.equal(overlaps(boxes[0], boxes[1]), false);
    for (const box of boxes) {
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1000 && box.y + box.height <= 700);
    }
    const before = [...town.rect];
    fitNotebookPlates(svg);
    assert.deepEqual([...town.rect], before, 'repeated fits must not drift away from the landmark');
  }
});

test('notebook plate layout keeps long labels and crowded map edges inside the canvas', () => {
  const boxes = layoutNotebookPlates([
    { x: -90, y: -20, width: 250, height: 45 },
    { x: -90, y: -20, width: 350, height: 45 },
    { x: 920, y: 680, width: 300, height: 45 },
    { x: 920, y: 680, width: 260, height: 50 },
    { x: 0, y: 320, width: 1200, height: 45 },
  ], 8, 10);
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    assert.ok(box.x >= 10 && box.y >= 10 && box.x + box.width <= 990 && box.y + box.height <= 690);
    for (const other of boxes.slice(i + 1)) assert.equal(overlaps(box as DOMRect, other as DOMRect), false);
  }
});

test('fitting a hidden notebook map leaves its labels untouched', () => {
  const group = plate('Ironhaven', 314, 132);
  fitNotebookPlates({ getBoundingClientRect: () => ({ width: 0 }), querySelectorAll: () => [group] } as unknown as SVGSVGElement);
  assert.equal(group.rect.size, 0);
  assert.equal(group.label.style.fontSize, '18px');
});

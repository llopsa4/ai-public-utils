import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chatterDuration, placeChatter } from '../src/ui/ambientChatter';
import { opaqueHeadAnchor, ambientAnchorWorld } from '../src/game/ambientAnchor';

test('ambient anchor uses the visible working frame rather than standing-body height', () => {
  const width=256,height=256,pixels=new Uint8ClampedArray(width*height*4);
  // A kneeling worker whose visible head is 78 world pixels above the bottom-centre feet.
  for(let y=100;y<256;y++)for(let x=80;x<110;x++)pixels[(y*width+x)*4+3]=255;
  const point=opaqueHeadAnchor(pixels,width,height)!;
  assert.equal(point.y,100);
  const sprite={x:400,y:300,originX:.5,originY:1,scaleX:.5,scaleY:.5,flipX:false,flipY:false};
  const world=ambientAnchorWorld(point,{width,height,trimX:0,trimY:0},sprite);
  assert.deepEqual(world,{x:383.5,y:222});
  assert.ok(world.y>300-110.2-8,'kneeling head no longer uses standing speech geometry');
  assert.deepEqual(ambientAnchorWorld(point,{width,height,trimX:0,trimY:0},{...sprite,flipX:true}),{x:416.5,y:222});
});

test('ambient anchors retain atlas trim offsets and follow actor movement and scale',()=>{
  const sprite={x:100,y:200,originX:.5,originY:1,scaleX:1,scaleY:1,flipX:false,flipY:false};
  const frame={width:256,height:256,trimX:80,trimY:100};
  assert.deepEqual(ambientAnchorWorld({x:15,y:0},frame,sprite),{x:67,y:44});
  assert.deepEqual(ambientAnchorWorld({x:15,y:0},frame,{...sprite,x:150,y:220,scaleX:.5,scaleY:.5}),{x:133.5,y:142});
  assert.equal(opaqueHeadAnchor(new Uint8ClampedArray(16),2,2),null);
});

test('ambient phrases keep the existing minimum reading time and give long remarks more time', () => {
  assert.equal(chatterDuration('Enough.'), 2600);
  assert.ok(chatterDuration('The pressure is dropping. We should stop working before the whole kiln goes cold.') > 4000);
});

test('ambient phrases remain inside the stage and stay close to their head anchor without drifting', () => {
  for (const stage of [{ width: 1280, height: 720 }, { width: 800, height: 450 }]) {
    for (const anchor of [{ x: 0, y: 0 }, { x: stage.width, y: 0 }, { x: 0, y: stage.height }, { x: stage.width, y: stage.height }]) {
      for (const progress of [0, 0.1, 0.5, 0.9, 1]) {
        const box = placeChatter(anchor, { width: 280, height: 48 }, stage, progress, false);
        assert.ok(box.x >= 4 && box.y >= 4);
        assert.ok(box.x + 280 <= stage.width - 4 && box.y + 48 <= stage.height - 4);
        assert.ok(box.opacity >= 0 && box.opacity <= 1);
      }
    }
  }
  const start = placeChatter({ x: 400, y: 240 }, { width: 160, height: 24 }, { width: 800, height: 450 }, 0.1, false);
  const end = placeChatter({ x: 400, y: 240 }, { width: 160, height: 24 }, { width: 800, height: 450 }, 0.9, false);
  assert.deepEqual([start.x,start.y],[end.x,end.y]);
  assert.equal(start.y+24,236,'only four screen pixels separate the phrase from the visible head');
});

test('reduced motion keeps complete ambient phrases stationary while fading', () => {
  const frame = (progress: number) => placeChatter({ x: 400, y: 240 }, { width: 160, height: 24 }, { width: 800, height: 450 }, progress, true);
  assert.deepEqual([frame(0.1).x, frame(0.1).y], [frame(0.9).x, frame(0.9).y]);
  assert.equal(frame(0).opacity, 0);
  assert.equal(frame(0.5).opacity, 1);
  assert.equal(frame(1).opacity, 0);
});

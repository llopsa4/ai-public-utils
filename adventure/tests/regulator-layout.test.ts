import test from 'node:test';
import assert from 'node:assert/strict';
import { fitRegulatorBoard, compactRegulatorControls } from '../src/ui/regulatorLayout';

test('regulator illustration fits its available region in portrait and short landscape without distortion',()=>{
 for(const [width,height] of [[700,410],[280,220],[380,160],[180,95],[120,50]]){
  const board=fitRegulatorBoard(width,height);
  assert.ok(board.width<=width&&board.height<=height,'illustration never causes overflow');
  assert.ok(Math.abs(board.width/board.height-1.6)<0.001,'mechanisms retain their alignment');
 }
});
test('small regulator viewports use separate controls rather than shrinking or overlapping click targets',()=>{
 assert.equal(compactRegulatorControls(390,844),true);
 assert.equal(compactRegulatorControls(800,390),true);
 assert.equal(compactRegulatorControls(800,720),false);
});

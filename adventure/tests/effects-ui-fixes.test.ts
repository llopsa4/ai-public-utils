import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CH1 } from '../src/chapters/ch1';
import { newGame, applyCommand } from '../src/engine/state';
import { parseSave, serializeSave } from '../src/engine/saveFile';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GameDialog } from '../src/kc/GameDialog';
import { overloadVisible } from '../src/kc/useBattle';
import { createBattle } from '../../FFCardGame/client/src/game/combat';
import { maraProfile } from '../src/content/kit';

test('the painted firing-house bell offers Look and ring while retaining its legacy secret identity',()=>{
 const room=CH1.rooms.firingHouse, bell=room.hotspots.find(h=>h.id==='sign')!;
 assert.match(CH1.strings[bell.name],/bell/i);
 assert.deepEqual(bell.verbs,['look','use']);
 assert.equal(room.interactionSounds?.[bell.id],'bell');
 const s=newGame();s.room='firingHouse';s.flags.dressed=true;
 const before=structuredClone(s),first=CH1.interact(s,'look',bell.id);
 assert.deepEqual(s,before);
 for(const c of first)applyCommand(s,c);
 assert.ok(s.flags.secretSign,'existing credit is retained');
 const repeated=CH1.interact(s,'look',bell.id);assert.ok(!repeated.some(c=>c.type==='setFlag'));
 assert.match(CH1.strings['line.secretSign'],/bell/i);assert.doesNotMatch(CH1.strings['line.secretSign'],/shop sign/i);
 for(let n=0;n<2;n++){
  const commands=CH1.interact(s,'use',bell.id);
  assert.ok(commands.some(c=>c.type==='walk'),'the ordinary handle cue follows a real approach');
  assert.ok(commands.some(c=>c.type==='say'&&c.actor==='nell'),'Nell reacts to the bell');
  assert.ok(!commands.some(c=>c.type==='setFlag'),'ringing never resets errands or grants another secret');
 }
 s.flags.kilnCold=true;
 assert.ok(CH1.interact(s,'use',bell.id).some(c=>c.type==='say'&&c.text==='line.nellBellCold'));
 const imported=parseSave(serializeSave(s));assert.ok(imported.ok);if(imported.ok)assert.ok(imported.state.flags.secretSign);
});

test('intent-dialog actions have protected viewport space rather than overflowing below a clipped panel',()=>{
 const css=readFileSync(new URL('../src/kc/kc-local.css',import.meta.url),'utf8');
 assert.match(css,/\.kc #modal\[open\][^{]*\{[^}]*display:\s*grid/s);
 assert.match(css,/\.kc #modal-actions[^{]*\{[^}]*flex-shrink:\s*0/s);
 assert.match(css,/\.kc #modal-body[^{]*\{[^}]*min-height:\s*0/s);
});

test('overload release is derived from the active animation rather than persisting until another card',()=>{
 const source=readFileSync(new URL('../src/kc/useBattle.ts',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\[overloadFeedback,\s*setOverloadFeedback\]/,'release cannot be an independent sticky state');
 assert.equal(overloadVisible(null),false);
 assert.equal(overloadVisible({overload:true,phase:'approach'}),false);
 for(const phase of ['contact','return','idle'] as const)assert.equal(overloadVisible({overload:true,phase}),true);
 assert.equal(overloadVisible({overload:false,phase:'contact'}),false);
 assert.equal(overloadVisible(null),false,'the end-of-action null animation clears feedback without another card');
});

test('free and guided enemy-intent popups both render a usable Keep playing footer',()=>{
 const state=createBattle(maraProfile(newGame().kit),CH1.encounters.hatchScavenger);
 for(const lessonPrompt of [undefined,'Inspect the next enemy action, then close this panel.']){
  const markup=renderToStaticMarkup(createElement(GameDialog,{kind:'intent',state,onClose:()=>{},onRestart:()=>{},lessonPrompt}));
  const actions=markup.split('id="modal-actions"')[1];assert.ok(actions);
  assert.match(actions,/>Keep playing<\/button>/);
  assert.doesNotMatch(actions,/disabled[^>]*>Keep playing/);
  assert.match(markup,/Gain block before ending your turn/);
  if(lessonPrompt)assert.match(actions,/lesson-target/);
 }
});

test('Adventure uses its dialog override and warning image while standalone battle files remain untouched',()=>{
 const config=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');
 assert.match(config,/'components\/GameDialog\.tsx':.*src\/kc\/GameDialog\.tsx/);
 const css=readFileSync(new URL('../src/kc/kc-local.css',import.meta.url),'utf8');
 assert.match(css,/\.strain-panel \.strain-fire\s*\{\s*display:\s*none/);
 assert.match(css,/background:\s*var\(--strain-warning-image\)/);
 assert.match(css,/prefers-reduced-motion/);
});

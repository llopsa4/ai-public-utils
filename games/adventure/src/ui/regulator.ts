import type { RoomScene } from '../game/scenes';
import { t } from '../engine/i18n';
import { settings } from '../engine/settings';
import { operateRegulator, regulatorStage, type RegulatorAction } from '../chapters/ch1/progression';
import housing from '../../art/src/props/regulator-closeup-housing.png';
import ring from '../../art/src/props/regulator-closeup-ring.png';
import bolt from '../../art/src/props/regulator-closeup-bolt.png';
import valve from '../../art/src/props/regulator-closeup-valve.png';
import cartridge from '../../art/src/props/regulator-closeup-center.png';
import gaugeFace from '../../art/src/props/gauge-face.png';
import { fitRegulatorBoard } from './regulatorLayout';
import './regulator.css';

export function openRegulator(scene: RoomScene): Promise<boolean> {
  const state = scene.session.state;
  if (regulatorStage(state.flags) === 'done') return Promise.resolve(true);
  const dialog = document.createElement('dialog');
  dialog.id = 'regulator-puzzle'; dialog.className = 'panel';
  dialog.setAttribute('aria-labelledby', 'regulator-title');
  dialog.innerHTML = `<header><h2 id="regulator-title">${t('puzzle.title')}</h2><button type="button" id="regulator-close">${t('puzzle.close')}</button></header>
    <div class="regulator-workspace"><div class="regulator-artbox"><div class="regulator-board"><img class="housing" alt="" src="${housing}">
    <img class="regulator-cartridge" alt="" src="${cartridge}">
    <div class="pressure-dial" role="img"><img class="pressure-face" alt="" src="${gaugeFace}"><span class="safe-band"></span><i class="pressure-needle"></i></div>
    ${(['left','right','vent','ring'] as const).map(action => `<button type="button" class="mechanism ${action}" data-action="${action}" aria-label="${t('puzzle.'+action)}"><img alt="" src="${action==='ring'?ring:action==='vent'?valve:bolt}"></button>`).join('')}<span class="regulator-steam" aria-hidden="true"></span></div></div>
    </div>
    <p id="regulator-feedback" role="status" aria-live="polite"></p>
    <footer><button type="button" id="regulator-procedure">${t('puzzle.procedure')}</button><button type="button" id="regulator-hint">${t('puzzle.hint')}</button><button type="button" id="regulator-release" hidden>${t('puzzle.remove')}</button></footer>`;
  document.body.append(dialog);
  scene.session.ui.controls.cancel();
  let hint = 0, previousStage = regulatorStage(state.flags);
  const feedback = dialog.querySelector<HTMLElement>('#regulator-feedback')!;
  const board=dialog.querySelector<HTMLElement>('.regulator-board')!;
  const artbox=dialog.querySelector<HTMLElement>('.regulator-artbox')!;
  const layout=()=>{
    if(!dialog.isConnected)return;
    const fitted=fitRegulatorBoard(artbox.clientWidth,artbox.clientHeight);board.style.width=`${fitted.width}px`;board.style.height=`${fitted.height}px`;
  };
  const refresh = () => {
    dialog.dataset.stage = regulatorStage(state.flags);
    dialog.classList.toggle('vented',!!state.flags.pressureBled);
    for (const [action, flag] of [['left','boltLeft'],['right','boltRight'],['vent','pressureBled'],['ring','ringReleased']]) {
      for(const button of dialog.querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`)){
        button.classList.toggle('turned', !!state.flags[flag]);button.setAttribute('aria-pressed', String(!!state.flags[flag]));
      }
    }
    const dial=dialog.querySelector<HTMLElement>('.pressure-dial')!;
    dial.setAttribute('aria-label', t(state.flags.pressureBled ? 'puzzle.safePressure' : 'puzzle.highPressure'));
    dialog.querySelector<HTMLButtonElement>('#regulator-release')!.hidden = !state.flags.ringReleased;
  };
  feedback.textContent=t('puzzle.inspect'); refresh();
  for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-action]')) button.onclick=()=>{
    const key=operateRegulator(state.flags, button.dataset.action as RegulatorAction);
    feedback.textContent=t(key); refresh(); scene.session.saveNow();
    if (previousStage!==regulatorStage(state.flags)) { hint=0;previousStage=regulatorStage(state.flags); }
    if(state.flags.ringReleased) dialog.querySelector<HTMLButtonElement>('#regulator-release')!.focus();
  };
  dialog.querySelector<HTMLButtonElement>('#regulator-procedure')!.onclick=()=>{
    feedback.textContent=t('line.notebookProcedure1');
  };
  dialog.querySelector<HTMLButtonElement>('#regulator-hint')!.onclick=()=>{
    const stage=regulatorStage(state.flags);if(stage==='done'){feedback.textContent=t('puzzle.done');return;}
    hint=Math.min(2,hint+1);feedback.textContent=t(`puzzle.hint.${stage}.${hint}`);
  };
  if(settings().reducedMotion) dialog.classList.add('calm');
  dialog.classList.add('initial');
  const resize=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(layout);
  resize?.observe(artbox);resize?.observe(dialog);window.addEventListener('resize',layout);
  return new Promise(resolve=>{
    let finished=false;
    const close=(complete:boolean)=>{if(finished)return;finished=true;resize?.disconnect();window.removeEventListener('resize',layout);dialog.close();dialog.remove();scene.session.saveNow();resolve(complete);};
    dialog.querySelector<HTMLButtonElement>('#regulator-close')!.onclick=()=>close(false);
    dialog.querySelector<HTMLButtonElement>('#regulator-release')!.onclick=()=>close(true);
    dialog.addEventListener('cancel', e=>{e.preventDefault();close(false);});
    const shutdown=()=>close(false);
    scene.events.once('shutdown',shutdown);
    dialog.addEventListener('close',()=>scene.events.off('shutdown',shutdown),{once:true});
    dialog.showModal();layout();requestAnimationFrame(()=>{layout();requestAnimationFrame(()=>dialog.classList.remove('initial'));});
    board.querySelector<HTMLButtonElement>('[data-action="left"]')!.focus();
  });
}

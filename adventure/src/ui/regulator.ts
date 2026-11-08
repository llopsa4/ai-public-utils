import type { RoomScene } from '../game/scenes';
import { t } from '../engine/i18n';
import { settings } from '../engine/settings';
import { operateRegulator, regulatorStage, type RegulatorAction } from '../chapters/ch1/progression';
import housing from '../../art/src/props/regulator-closeup-housing.png';
import ring from '../../art/src/props/regulator-closeup-ring.png';
import bolt from '../../art/src/props/regulator-closeup-bolt.png';
import valve from '../../art/src/props/regulator-closeup-valve.png';
import './regulator.css';

export function openRegulator(scene: RoomScene): Promise<boolean> {
  const state = scene.session.state;
  if (regulatorStage(state.flags) === 'done') return Promise.resolve(true);
  const dialog = document.createElement('dialog');
  dialog.id = 'regulator-puzzle'; dialog.className = 'panel';
  dialog.setAttribute('aria-labelledby', 'regulator-title');
  dialog.innerHTML = `<header><h2 id="regulator-title">${t('puzzle.title')}</h2><button type="button" id="regulator-close">${t('puzzle.close')}</button></header>
    <div class="regulator-board"><img class="housing" alt="" src="${housing}">
    <div class="pressure-dial" role="img"><span class="safe-band"></span><i class="pressure-needle"></i></div>
    ${(['left','right','vent','ring'] as const).map(action => `<button type="button" class="mechanism ${action}" data-action="${action}" aria-label="${t('puzzle.'+action)}"><img alt="" src="${action==='ring'?ring:action==='vent'?valve:bolt}"></button>`).join('')}</div>
    <p id="regulator-feedback" role="status" aria-live="polite"></p>
    <footer><button type="button" id="regulator-procedure">${t('puzzle.procedure')}</button><button type="button" id="regulator-hint">${t('puzzle.hint')}</button><button type="button" id="regulator-release" hidden>${t('puzzle.remove')}</button></footer>
    <p id="regulator-reference" hidden></p>`;
  document.body.append(dialog);
  scene.session.ui.controls.cancel();
  let hint = 0, previousStage = regulatorStage(state.flags);
  const feedback = dialog.querySelector<HTMLElement>('#regulator-feedback')!;
  const ref = dialog.querySelector<HTMLElement>('#regulator-reference')!;
  const refresh = () => {
    dialog.dataset.stage = regulatorStage(state.flags);
    for (const [action, flag] of [['left','boltLeft'],['right','boltRight'],['vent','pressureBled'],['ring','ringReleased']]) {
      const button = dialog.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!;
      button.classList.toggle('turned', !!state.flags[flag]);
      button.setAttribute('aria-pressed', String(!!state.flags[flag]));
    }
    const dial=dialog.querySelector<HTMLElement>('.pressure-dial')!;
    dial.setAttribute('aria-label', t(state.flags.pressureBled ? 'puzzle.safePressure' : 'puzzle.highPressure'));
    dialog.querySelector<HTMLButtonElement>('#regulator-release')!.hidden = !state.flags.ringReleased;
  };
  feedback.textContent=t('puzzle.inspect'); refresh();
  for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-action]')) button.onclick=()=>{
    const key=operateRegulator(state.flags, button.dataset.action as RegulatorAction);
    feedback.textContent=t(key); refresh(); scene.session.saveNow();
    if (previousStage!==regulatorStage(state.flags)) { hint=0;previousStage=regulatorStage(state.flags);ref.hidden=true; }
    if(state.flags.ringReleased) dialog.querySelector<HTMLButtonElement>('#regulator-release')!.focus();
  };
  dialog.querySelector<HTMLButtonElement>('#regulator-procedure')!.onclick=()=>{
    ref.hidden=false;ref.textContent=t('line.notebookProcedure1');
  };
  dialog.querySelector<HTMLButtonElement>('#regulator-hint')!.onclick=()=>{
    hint=Math.min(2,hint+1);ref.hidden=false;ref.textContent=t(`puzzle.hint.${regulatorStage(state.flags)}.${hint}`);
  };
  if(settings().reducedMotion) dialog.classList.add('calm');
  return new Promise(resolve=>{
    let finished=false;
    const close=(complete:boolean)=>{if(finished)return;finished=true;dialog.close();dialog.remove();scene.session.saveNow();resolve(complete);};
    dialog.querySelector<HTMLButtonElement>('#regulator-close')!.onclick=()=>close(false);
    dialog.querySelector<HTMLButtonElement>('#regulator-release')!.onclick=()=>close(true);
    dialog.addEventListener('cancel', e=>{e.preventDefault();close(false);});
    const shutdown=()=>close(false);
    scene.events.once('shutdown',shutdown);
    dialog.addEventListener('close',()=>scene.events.off('shutdown',shutdown),{once:true});
    dialog.showModal();dialog.querySelector<HTMLButtonElement>('[data-action="left"]')!.focus();
  });
}

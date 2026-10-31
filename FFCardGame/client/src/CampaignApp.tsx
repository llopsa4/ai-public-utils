import { Workshop, EquipmentCollection } from './components/Workshop';

import { ScenePlayer } from './components/ScenePlayer';

import { SCENES } from './content/scenes';

import { betweenEncounters } from './game/systems';

import { useEffect, useRef, useState } from 'react';

import { App } from './App';

import { assets } from './assets';

import { ConfirmDialog } from './components/ConfirmDialog';

import { FrameCorners } from './components/Ornaments';

import { GameDialog } from './components/GameDialog';

import { DungeonMap, DungeonDestination } from './components/DungeonMap';

import { DeckCollection, ProgressionDestination, RewardChoice } from './components/ProgressionScreens';

import { ROUTE_PREVIEW } from './content/dungeon';

import { dungeonPath, nodeById } from './game/dungeon';

import { LESSON_STEPS, type LessonAction } from './content/tutorial';

import { CAMPAIGN_ENCOUNTER, CHECKPOINT_NODE } from './content/campaign';

import { EQUIPMENT, STARTING_EQUIPMENT } from './content/equipment';

import { campaignTransition, activateSystems, newCampaign, type CampaignCommand, type CampaignState } from './game/campaign';

import { newBattle, randomSeed } from './game/combat';

import { deriveStats, EQUIPMENT_SLOTS, openingHandSize } from './game/equipment';

import { decodeSave, encodeSave, MAX_SAVE_BYTES, readSave, writeSave, type StorageAccess } from './persistence/campaign';



function download(name: string, text: string) {

  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));

  const anchor = document.createElement('a');

  anchor.href = url; anchor.download = name; anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

}

type Pending = { kind: 'new' } | { kind: 'reset' } | { kind: 'import'; state: CampaignState };



export function CampaignApp({ storage }: { storage?: StorageAccess }) {

  const [loaded] = useState(() => readSave(storage));

  const [session, setSession] = useState<CampaignState | null>(() => loaded.kind === 'valid' ? loaded.save.state : null);

  const current = useRef(session);

  const [view, setView] = useState<'menu' | 'session' | 'standalone'>('menu');

  const [generation, setGeneration] = useState(0);

  const [pending, setPending] = useState<Pending | null>(null);

  const [original, setOriginal] = useState(() => loaded.kind === 'invalid' ? loaded.raw : null);

  const [notice, setNotice] = useState('');

  const [sessionOnly, setSessionOnly] = useState(loaded.kind === 'unavailable');

  const [savedAt, setSavedAt] = useState<string | null>(() => loaded.kind === 'valid' ? loaded.save.savedAt : null);

  const focusHeading = useRef<HTMLHeadingElement>(null);

  const upload = useRef(0);

  const [menuHelp, setMenuHelp] = useState(false);

  const [helpBattle] = useState(() => newBattle(1));

  useEffect(() => { focusHeading.current?.focus(); }, [view, session?.phase, session?.currentNode, !!session?.replay, generation]);



  function install(next: CampaignState, replace = false) {

    current.current = next;

    setSession(next);

    const saved = writeSave(next, storage);

    setSessionOnly(!saved.ok);

    setSavedAt(saved.ok ? saved.savedAt : null);

    if (replace) { setGeneration(number => number + 1); setOriginal(null); setNotice(''); }

  }

  function dispatch(command: CampaignCommand): CampaignState | null {

    if (!current.current) return null;

    const next = campaignTransition(current.current, command);

    if (next === current.current) return null;

    install(next);

    return next;

  }

  function startNew() {

    if (current.current || original !== null) setPending({ kind: 'new' });

    else { install(newCampaign(randomSeed(),true,true), true); setView('session'); }

  }

  function continueSession() {

    if(current.current&&!current.current.systems)install(activateSystems(current.current));

    setView('session');

  }

  function confirm() {

    if (!pending) return;

    if (pending.kind === 'reset') { if (current.current) dispatch({ type: 'reset-lesson', revision: current.current.revision }); }

    else install(pending.kind === 'new' ? newCampaign(randomSeed(),true,true) : activateSystems(pending.state), true);

    setPending(null); setView('session');

  }

  async function importFile(file: File | undefined) {

    if (!file) return;

    const request = ++upload.current;

    try {

      if (file.size > MAX_SAVE_BYTES) throw new Error('Save file is too large (maximum 512 KB).');

      const imported = decodeSave(await file.text());

      if (request !== upload.current) return;

      setPending({ kind: 'import', state: imported.state });

      setNotice('');

    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not read this file. Your progress is unchanged.'); }

  }



  const saveMessage = sessionOnly ? 'Session only — saving is unavailable. Export a backup before leaving.' : session && savedAt ? `Saved locally · ${new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Progress saves on this browser. Export to keep a backup.';

  const lesson = session?.replay ?? session?.tutorial;

  function act(action: LessonAction) {

    return lesson && session ? dispatch({ type: 'lesson', revision: session.revision, command: { step: lesson.step, revision: lesson.revision, action } }) : null;

  }

  function replay() {

    if (!session) return;

    if (dispatch({ type: 'start-replay', revision: session.revision })) { setMenuHelp(false); setView('session'); }

  }

  const activeScene = view === 'session' && session?.systems?.scene;

  const activeBattle = lesson?.battle ?? session?.battle;

  const controller = session && activeBattle ? {

    state: activeBattle,

    play: (cardId: string, battleRevision: number) => {

      const next = lesson ? act({ type: 'play', id: cardId }) : dispatch({ type: 'play', cardId, battleRevision, revision: session.revision });

      return next ? (next.replay ?? next.tutorial)?.battle ?? next.battle : null;

    },

    endTurn: (battleRevision: number) => {

      const next = lesson ? act({ type: 'end-turn' }) : dispatch({ type: 'end-turn', battleRevision, revision: session.revision });

      return next ? (next.replay ?? next.tutorial)?.battle ?? next.battle : null;

    },

    support: (ally: import('./game/types').AllyId, battleRevision: number) => dispatch({type:'support',ally,battleRevision,revision:session.revision})?.battle ?? null,

    retry: () => !lesson ? dispatch({ type: 'retry', revision: session.revision })?.battle ?? null : null,

  } : undefined;

  const menu = () => { setView('menu'); setNotice(''); };



  if (view === 'standalone') return <><App key={`standalone-${generation}`} onMenu={menu} onReplay={session?.guidedComplete ? replay : undefined} /><div className="save-ribbon">Standalone battle · campaign progress is unchanged.</div></>;

  if (view === 'session' && !activeScene && (session?.phase === 'battle' || lesson) && controller && session) return <>

    <App key={`${generation}-${session.replay ? 'replay' : session.phase}`} controller={controller} onMenu={menu}

      lesson={lesson ? { state: lesson, replay: !!session.replay, act: action => !!act(action), reset: () => setView('menu') } : undefined}

      onReplay={!lesson && session.guidedComplete ? replay : undefined}

      onVictory={() => lesson ? act({ type: 'finish' }) : dispatch({ type: 'resolve', revision: session.revision })} />

    <div className={`save-ribbon${sessionOnly ? ' warning' : ''}`} role="status">{saveMessage}{sessionOnly && <button className="quiet" onClick={() => download('kiln-courier-backup.json', encodeSave(current.current!))}>Export backup</button>}</div>

  </>;



  const profile = session?.profile;

  const stats = profile ? deriveStats(profile) : null;

  const onRoute=view==='session'&&!!session?.dungeon&&['map','destination','route-complete'].includes(session.phase);

  const richReward=view==='session'&&session?.phase==='reward'&&session.pendingReward?.kind!=='checkpoint';

  return <div className="session-screen" onKeyDownCapture={event => { if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault(); }}>

    <link rel="icon" href={assets.mark} type="image/svg+xml" />

    <header className="session-header"><span className="wordmark">KILN COURIER</span>{view !== 'menu' ? <button className="quiet" onClick={menu}>Menu &amp; backups</button> : <button className="quiet" onClick={() => setMenuHelp(true)}>Help</button>}</header>

    <main className={`session-panel${onRoute&&session?.phase!=='destination'?' route-panel':''}${richReward?' reward-panel':''}`}>

      <FrameCorners />

      <span className="eyebrow">{view === 'menu' ? 'AN INDUSTRIAL FANTASY' : 'CAMPAIGN PREVIEW'}</span>

      <h1 ref={focusHeading} tabIndex={-1}>{activeScene ? 'A courier’s road.' : view === 'menu' ? 'Carry the fire onward.' : onRoute ? session.phase==='route-complete'?'A route through the kiln.':session.phase==='destination'?'Along the chosen path.':ROUTE_PREVIEW.name : session?.phase === 'ready' ? 'The kiln checkpoint' : session?.phase === 'reward' ? 'A passage secured.' : 'Checkpoint recorded.'}</h1>

      {activeScene && session ? <ScenePlayer state={session} dispatch={dispatch}/> : view === 'menu' ? <>

        <p>One courier. A restless kiln. Keep your heat.</p>

        <div className="session-actions primary-actions">

          {session && <button className="modal-primary" onClick={continueSession}>Continue</button>}

          <button className={session ? 'session-secondary' : 'modal-primary'} onClick={startNew}>New Story</button>

          <button className="session-secondary" onClick={() => setView('standalone')}>Standalone battle</button>

          {lesson && <button className="session-secondary" onClick={() => setPending({ kind: 'reset' })}>Restart lesson</button>}

        </div>

        <p className="session-caption">Guided combat, branching routes, card rewards and training. Workshops, brief scenes and Iven’s support are playable. Full chapter integration is still ahead.</p>

        {session && <p className="session-caption">Mara · {lesson ? `${session.replay ? 'Practice' : 'Combat lesson'} ${lesson.step + 1}/${LESSON_STEPS.length}` : ['map','destination','route-complete'].includes(session.phase) ? session.phase==='route-complete'?'Route preview complete':'Exploring the kiln routes' : session.phase === 'battle' ? `Turn ${session.battle!.turn}${session.battle!.outcome ? ` · ${session.battle!.outcome}` : ''}` : session.phase === 'ready' ? 'Before the checkpoint' : session.phase === 'reward' ? 'Checkpoint ready to record' : 'Checkpoint complete'}</p>}

        {session?.systems && betweenEncounters(session) && session.systems.reached.length>0 && <details className="scene-replays"><summary>Replay reached scenes</summary><div className="session-actions">{session.systems.reached.map(sceneId=><button className="quiet" key={sceneId} onClick={()=>{dispatch({type:'replay-scene',sceneId,revision:session.revision});setView('session');}}>{SCENES[sceneId].title}</button>)}</div></details>}

        <section className="backup-section" aria-label="Save backups">

          <h2>Save &amp; backups</h2>

          <p className={sessionOnly ? 'warning' : 'session-caption'} role="status">{saveMessage}</p>

          {original !== null && <div className="save-problem" role="alert"><p>The stored save could not be opened. It has been preserved. {loaded.kind === 'invalid' ? loaded.reason : ''}</p><button className="session-secondary" onClick={() => download('kiln-courier-original-save.json', original)}>Download original save</button></div>}

          <div className="session-actions">

            <button className="session-secondary" disabled={!session} onClick={() => session && download('kiln-courier-backup.json', encodeSave(session))}>Export save</button>

            <label className="file-button">Import save<input type="file" accept=".json,application/json" aria-label="Import save" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void importFile(file); }} /></label>

          </div>

          {notice && <p className="warning" role="alert">{notice} Existing progress is unchanged.</p>}

        </section>

      </> : richReward&&session ? <RewardChoice state={session} dispatch={dispatch}/> : onRoute ? <>

        <div className="session-stats route-resources"><span>HP <strong>{profile!.hp}/{profile!.maxHp}</strong></span><span>MP <strong>{profile!.mp}/{stats!.maxMp}</strong></span><span>Salvage <strong>{session!.salvage}</strong></span></div>

        {session!.phase==='destination'?(session!.systems&&session!.currentNode==='route-workshop'?<Workshop state={session!} dispatch={dispatch}/>:session!.systems&&session!.currentNode==='route-story'?<section><h2>Hanging Crossing</h2><p>A Cable Warden blocks the stranded carriers. Iven will cover you.</p><p className="session-caption">68 HP · Victory: 20 salvage and up to 2 MP. No card offer.</p><button className="modal-primary" onClick={()=>dispatch({type:'start-bridge',revision:session!.revision})}>Secure the crossing</button></section>:session!.progression&&['battle','teacher','rest','discovery'].includes(nodeById(ROUTE_PREVIEW,session!.currentNode!)!.kind)?<ProgressionDestination state={session!} dispatch={dispatch}/>:<DungeonDestination nodeId={session!.currentNode!} onContinue={()=>dispatch({type:'continue-route',nodeId:session!.currentNode!,revision:session!.revision})}/>):<>

          {session!.phase==='route-complete'&&<p className="session-caption">Your path is recorded. Continue to the checkpoint.</p>}

          <DungeonMap path={dungeonPath(ROUTE_PREVIEW,session!.routeDecisions)} complete={session!.phase==='route-complete'} functional={!!session!.progression} expanded={!!session!.systems} onTravel={nodeId=>dispatch({type:'choose-node',nodeId,revision:session!.revision})}/>

          <DeckCollection state={session!}/>

          {session!.phase==='route-complete'&&<button className="modal-primary" onClick={()=>dispatch({type:'leave-map',revision:session!.revision})}>Return to checkpoint</button>}

        </>}

      </> : session?.phase === 'ready' ? <>

        <p>{session.guidedComplete ? 'Your progress is saved. Reach the next checkpoint.' : 'Reach the far door. Read the guardian’s intentions.'}</p>

        <div className="session-stats"><span>HP <strong>{profile!.hp}/{profile!.maxHp}</strong></span><span>MP <strong>{profile!.mp}/{stats!.maxMp}</strong></span><span>Opening hand <strong>{openingHandSize(CAMPAIGN_ENCOUNTER.handSize, stats!.speed)}</strong></span></div>

        <ul className="loadout-list" aria-label="Equipped items">{EQUIPMENT_SLOTS.map(slot => <li key={slot}><span>{slot}</span><strong>{EQUIPMENT[(profile!.equipment ?? STARTING_EQUIPMENT)[slot].id].name}</strong></li>)}</ul>

        <p className="session-caption">Equipment changes attacks, block and opening draws. Free swaps never restore resources.</p>

        <button className="modal-primary" onClick={() => dispatch({ type: 'enter', nodeId: CHECKPOINT_NODE, revision: session.revision })}>Enter the kiln</button>

        <button className="session-secondary" onClick={()=>dispatch({type:'open-map',revision:session.revision})}>{session.dungeon?'Review route':'Explore route preview'}</button>

      </> : <>

        <p>{session?.phase === 'reward' ? 'Your remaining health and MP carry forward. Record this cleared checkpoint.' : 'Your passage is saved. The story continues in a future delivery.'}</p>

        <div className="session-stats"><span>HP <strong>{profile!.hp}/{profile!.maxHp}</strong></span><span>MP <strong>{profile!.mp}/{stats!.maxMp}</strong></span></div>

        {session?.phase === 'reward' ? <button className="modal-primary" onClick={() => dispatch({ type: 'claim', claimId: session.pendingReward!.id, revision: session.revision })}>Record checkpoint</button> : <button className="modal-primary" onClick={menu}>Return to menu</button>}

        {session?.phase==='complete'&&<button className="session-secondary" onClick={()=>dispatch({type:'open-map',revision:session.revision})}>{session.dungeon?'Review route':'Explore route preview'}</button>}

        <p className="session-caption">Your progress is recorded. Full chapter integration continues in the next delivery.</p>

      </>}

      {view==='session' && session?.systems && !activeScene && <p className="current-objective" role="status">Objective: {session.systems.objective}</p>}

      {view==='session' && session && betweenEncounters(session) && session.currentNode!=='route-workshop' && <EquipmentCollection state={session} dispatch={dispatch}/>}

    </main>

    {view !== 'menu' && <p className={`session-save-status${sessionOnly ? ' warning' : ''}`} role="status">{saveMessage}{sessionOnly && <button className="quiet" onClick={() => download('kiln-courier-backup.json', encodeSave(current.current!))}>Export backup</button>}</p>}

    <GameDialog kind={menuHelp ? 'help' : null} state={session?.battle ?? helpBattle} campaign={!!session} onClose={() => setMenuHelp(false)} onRestart={() => setMenuHelp(false)} onReplay={session?.guidedComplete ? replay : undefined} />

    {pending && <ConfirmDialog title={pending.kind === 'reset' ? 'Restart this lesson?' : pending.kind === 'new' ? 'Start a new story?' : 'Import this save?'} confirmLabel={pending.kind === 'reset' ? 'Restart lesson' : pending.kind === 'new' ? 'Start new story' : 'Replace progress'} onConfirm={confirm} onCancel={() => setPending(null)}>

      <p>{pending.kind === 'reset' ? 'Return to the first lesson step. Your campaign progress and rewards stay unchanged.' : session || original !== null ? 'This replaces the saved campaign on this browser. Export a backup first if you want to keep it.' : 'Load this validated campaign backup on this browser.'}</p>

    </ConfirmDialog>}

  </div>;

}

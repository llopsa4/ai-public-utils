// Separate Vite development entry; not reachable from the shipped game.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { CampaignApp } from './CampaignApp';
import { PROTOTYPE_SETUP } from './content/encounter';
import { COOLING_RIG_SETUP, SIGNATURE_SETUP } from '../../tests/fixtures/encounters';
import { CARDS, TEMPERED_FLOW } from './content/cards';
import { learnTemperedFlow } from './game/profile';
import { STARTING_EQUIPMENT } from './content/equipment';
import { withEquipment } from './game/equipment';
import '../../style.css';
const deniedStorage = () => { throw new Error('Simulated storage denial'); };
const quotaStorage = () => ({ getItem: () => null, setItem: () => { throw new Error('Simulated quota exhaustion'); } });
let damagedSave = '{broken';
const damagedStorage = () => ({ getItem: () => damagedSave, setItem: (_key: string, value: string) => { damagedSave = value; } });

if (!import.meta.env.DEV) throw new Error('Development fixtures require the Vite development server.');

function Fixtures() {
  const [fixture, setFixture] = useState('prototype');
  const [trained, setTrained] = useState(false);
  const [build, setBuild] = useState('neutral');
  const signatureId = SIGNATURE_SETUP.profile.deck.find(card => card.type === 'pulse')!.id;
  const base = fixture === 'signature' ? { ...SIGNATURE_SETUP, profile: trained ? learnTemperedFlow(SIGNATURE_SETUP.profile, signatureId) : SIGNATURE_SETUP.profile }
    : fixture === 'rig' ? COOLING_RIG_SETUP : { ...PROTOTYPE_SETUP, seed: 101 };
  const gear = build === 'power' ? { ...STARTING_EQUIPMENT, gauntlet: { id: 'heavy-gauntlet' } } : build === 'defense' ? { ...STARTING_EQUIPMENT, armor: { id: 'layered-armor' } } : build === 'speed' ? { ...STARTING_EQUIPMENT, utility: { id: 'quick-harness', upgraded: true } } : STARTING_EQUIPMENT;
  const setup = { ...base, profile: withEquipment(base.profile, gear) };
  return <>
    <aside aria-label="Development fixture controls" style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100% - 24px)', zIndex: 50, background: '#17130e', padding: 8 }}>
      <label htmlFor="fixture">Development fixture: </label>
      <select id="fixture" value={fixture} onChange={event => { setFixture(event.target.value); setTrained(false); }}>
        <option value="prototype">Original prototype</option>
        <option value="rig">Cooling rig (synthetic)</option>
        <option value="signature">Signature technique</option>
        <option value="session-only">Campaign · blocked storage</option>
        <option value="quota">Campaign · storage full</option>
        <option value="damaged">Campaign · damaged save</option>
      </select>
      <label> Build <select value={build} onChange={event => setBuild(event.target.value)}><option value="neutral">Neutral</option><option value="power">Power</option><option value="defense">Defense</option><option value="speed">Speed</option></select></label>
      {fixture === 'signature' && <>
        <p aria-label="Tempered Flow comparison" style={{ margin: '6px 0' }}>Tempered Flow: MP {CARDS.pulse.mpCost} → {TEMPERED_FLOW.mpCost}; strain +{CARDS.pulse.strain} → +{TEMPERED_FLOW.strain}.<br />Same card: {TEMPERED_FLOW.cost} energy, {TEMPERED_FLOW.damage} damage, {TEMPERED_FLOW.block} block.</p>
        <button onClick={() => setTrained(true)} disabled={trained}>Start trained test battle</button>
      </>}
    </aside>
    {['session-only', 'quota', 'damaged'].includes(fixture) ? <CampaignApp key={fixture} storage={fixture === 'damaged' ? damagedStorage : fixture === 'quota' ? quotaStorage : deniedStorage} /> : <App key={`${fixture}-${trained}-${build}`} setup={setup} />}
  </>;
}

const container = document.getElementById('root');
if (!container) throw new Error('The fixture root is missing.');
createRoot(container).render(<StrictMode><Fixtures /></StrictMode>);

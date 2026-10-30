// Separate Vite development entry; not reachable from the shipped game.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PROTOTYPE_SETUP } from './content/encounter';
import { COOLING_RIG_SETUP, SIGNATURE_SETUP } from '../../tests/fixtures/encounters';
import { CARDS, TEMPERED_FLOW } from './content/cards';
import { learnTemperedFlow } from './game/profile';
import '../../style.css';

if (!import.meta.env.DEV) throw new Error('Development fixtures require the Vite development server.');

function Fixtures() {
  const [fixture, setFixture] = useState('prototype');
  const [trained, setTrained] = useState(false);
  const signatureId = SIGNATURE_SETUP.profile.deck.find(card => card.type === 'pulse')!.id;
  const setup = fixture === 'signature' ? { ...SIGNATURE_SETUP, profile: trained ? learnTemperedFlow(SIGNATURE_SETUP.profile, signatureId) : SIGNATURE_SETUP.profile }
    : fixture === 'rig' ? COOLING_RIG_SETUP : { ...PROTOTYPE_SETUP, seed: 101 };
  return <>
    <aside aria-label="Development fixture controls" style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100% - 24px)', zIndex: 50, background: '#17130e', padding: 8 }}>
      <label htmlFor="fixture">Development fixture: </label>
      <select id="fixture" value={fixture} onChange={event => { setFixture(event.target.value); setTrained(false); }}>
        <option value="prototype">Original prototype</option>
        <option value="rig">Cooling rig (synthetic)</option>
        <option value="signature">Signature technique</option>
      </select>
      {fixture === 'signature' && <>
        <p aria-label="Tempered Flow comparison" style={{ margin: '6px 0' }}>Tempered Flow: MP {CARDS.pulse.mpCost} → {TEMPERED_FLOW.mpCost}; strain +{CARDS.pulse.strain} → +{TEMPERED_FLOW.strain}.<br />Same card: {TEMPERED_FLOW.cost} energy, {TEMPERED_FLOW.damage} damage, {TEMPERED_FLOW.block} block.</p>
        <button onClick={() => setTrained(true)} disabled={trained}>Start trained test battle</button>
      </>}
    </aside>
    <App key={`${fixture}-${trained}`} setup={setup} />
  </>;
}

const container = document.getElementById('root');
if (!container) throw new Error('The fixture root is missing.');
createRoot(container).render(<StrictMode><Fixtures /></StrictMode>);

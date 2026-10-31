import { useId } from 'react';

export function ResourceSymbol({ kind }: { kind: 'hp' | 'mp' | 'block' }) {
  return <svg className={`resource-symbol ${kind}`} viewBox="0 0 32 36" aria-hidden="true" focusable="false">
    <path d="m16 2 13 6-3 17-10 9L6 25 3 8Z" fill="#24180f" stroke="#d4b071" strokeWidth="1.8" />
    {kind === 'block' ? <><path d="m16 7 8 4-2 12-6 6-6-6-2-12Z" fill="#bba77b" stroke="#f0d8a6" /><path d="M16 8v19" stroke="#665033" /></> : kind === 'mp' ? <>
      <path d="M16 6c-3 6-9 10-9 16 0 10 18 10 18 0 0-6-6-10-9-16Z" fill="#387dbe" stroke="#b7e4ff" />
      <path d="M16 8v21L9 22Z" fill="#79c7f1" /><path d="m16 8 7 14-7 7Z" fill="#23568f" /><path d="m11 18 5-8" stroke="#dbf3ff" />
    </> : <>
      <path d="m16 7 9 5-3 11-6 6-6-6-3-11Z" fill="#bd432f" stroke="#ffc18d" />
      <path d="m7 12 9 3 9-3-9-5Z" fill="#f38c65" /><path d="m16 15 6 8-6 6Z" fill="#7c211b" /><path d="m16 15-6 8 6 6Z" fill="#e56547" /><path d="m10 11 6-3 5 3" fill="none" stroke="#ffdfb7" />
    </>}
  </svg>;
}

export function ArtifactFrame() {
  const id = useId();
  const outline = 'M25 7h89l9-5h74l9 5h89l6 9 12 5v105l-12 6-6 13H182l-22 10-22-10H25l-6-13-12-6V21l12-5Z';
  return <svg className="artifact-frame" viewBox="0 0 320 160" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-brass`} x2=".4" y2="1"><stop stopColor="#ffe0a2" /><stop offset=".25" stopColor="#92602f" /><stop offset=".5" stopColor="#d8ad65" /><stop offset=".75" stopColor="#6b4527" /><stop offset="1" stopColor="#d4aa64" /></linearGradient>
      <linearGradient id={`${id}-ceramic`} x2=".6" y2="1"><stop stopColor="#f4dfb8" /><stop offset="1" stopColor="#84735b" /></linearGradient>
    </defs>
    <path d={outline} fill="#0e0b08" fillOpacity=".94" stroke="#302016" strokeWidth="6" vectorEffect="non-scaling-stroke" />
    <path d={outline} fill="none" stroke={`url(#${id}-brass)`} strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
    <path d="M31 13h80l13-5h72l13 5h80l8 10 9 4v94l-10 7-6 10H179l-19 10-19-10H30l-6-10-10-7V27l9-4Z" fill="none" stroke="#d0aa646f" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    <g fill={`url(#${id}-ceramic)`} stroke="#563e28" strokeWidth="1.4">
      <path d="M8 42V15Q9 8 23 9l8 12-9 4-3 14Z" /><path d="M312 42V15q-1-7-15-6l-8 12 9 4 3 14Z" />
    </g>
    <g fill="none" stroke={`url(#${id}-brass)`} strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke">
      <path d="M10 55q13-6 9-18-2-7 4-11m-9 18q-9-7 1-13m9-16q6-3 10 3l10 2m-28 96q11-5 7-14m-1 21q-11 2-8-8m9 15 14 3 8 5h28m-49-15q11-7 14 4" />
      <path d="M310 55q-13-6-9-18 2-7-4-11m9 18q9-7-1-13m-9-16q-6-3-10 3l-10 2m28 96q-11-5-7-14m1 21q11 2 8-8m-9 15-14 3-8 5h-28m49-15q-11-7-14 4" />
      <path d="m151 146 9-8 9 8-9 8Zm-13-2h-28m72 0h28M43 14h25m184 0h25" />
    </g>
    <g fill="#e5bf7d" stroke="#302117"><circle cx="17" cy="19" r="2" /><circle cx="303" cy="19" r="2" /><circle cx="24" cy="127" r="2" /><circle cx="296" cy="127" r="2" /><circle cx="160" cy="146" r="2" /></g>
  </svg>;
}

export function StatusCrest({ enemy = false }: { enemy?: boolean }) {
  return <svg className={`status-crest${enemy ? ' furnace' : ''}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <path d="M3 71h23m48 0h23M13 77h17m40 0h17m-65 4h13m30 0h13" stroke="#bb914c" strokeWidth="1.5" />
    {Array.from({ length: 20 }, (_, i) => <path key={i} d="M50 6v8" transform={`rotate(${i * 18} 50 50)`} stroke={i % 2 ? '#99703d' : '#eac480'} strokeWidth="1.3" />)}
    <circle cx="50" cy="50" r="34" fill="#171009" stroke="#d0a15b" strokeWidth="2.5" /><circle cx="50" cy="50" r="29" fill="none" stroke="#6f4d2a" strokeWidth="2" />
    {enemy ? <>
      <path d="m50 24 22 26-22 26-22-26Z" fill="#652b15" stroke="#dfb66e" />
      <path d="M32 50q18-21 36 0-18 21-36 0Z" fill="#e28531" stroke="#f8ca7b" /><path d="M50 34q-9 12 0 31 9-19 0-31Z" fill="#fbd58c" /><path d="M50 43v13" stroke="#803a18" strokeWidth="3" />
    </> : <g fill="#dfc69c" stroke="#67482a" strokeWidth="2" strokeLinejoin="round">
      <path d="m35 42 4-14 9-3 15 4 5 14-5 19-25-1Z" /><path d="m38 61 25 1-2 13H38Z" /><path d="m35 44-8 6 3 15 9-7Z" /><path d="m44 29-1 14m9-15v15m9-11-1 11M40 49l21 1m-20 6 17 1" fill="none" />
    </g>}
    <path d="m50 81 6 6-6 9-6-9Z" fill="#c5a061" stroke="#6c4d2a" />
  </svg>;
}

export function FrameCorners() {
  return <span className="frame-corners" aria-hidden="true">{['nw', 'ne', 'sw', 'se'].map(corner => <svg key={corner} className={`frame-corner ${corner}`} viewBox="0 0 24 24" focusable="false"><path d="M2 22V9q0-7 7-7h13M5 17V9q0-4 4-4h8M2 9q8 2 8-5M9 2q2 8-5 8m2-4 4 4" fill="none" stroke="currentColor" strokeWidth="1" /></svg>)}</span>;
}

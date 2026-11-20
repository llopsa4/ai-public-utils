// Browser file helpers for Export and Import (DESIGN-saves.md *Menu*, *HUD menu*). DOM only; no sim here.

/** Downloads `text` as a file named `name`. */
export function downloadText(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens a file picker for a `.json` file and passes its text on; does nothing if the picker is dismissed. */
export function pickTextFile(onText: (text: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.remove();
    if (file) void file.text().then(onText);
  });
  document.body.appendChild(input);
  input.click();
}

/** `camp-fire-slot2-day3.json`, or `camp-fire-day3.json` with no slot, or `camp-fire-slot2.json` with no day. */
export function exportName(slot: number | null, day: number | null): string {
  return `camp-fire${slot === null ? '' : `-slot${slot}`}${day === null ? '' : `-day${day}`}.json`;
}

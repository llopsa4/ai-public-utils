// The mood of each survivor's last spoken line (DESIGN §6): the squad card shows that portrait until the
// survivor is hurt. Kept here, outside the scenes, so the dialogue box writes it and the squad panel reads it.

const last = new Map<string, string>();

/** Remembers the mood of a line spoken by `speaker`. */
export function noteMood(speaker: string, mood: string | undefined): void {
  last.set(speaker.trim().toLowerCase(), mood ?? 'neutral');
}

/** The mood of the speaker's last line, or `neutral` when they have not spoken yet. */
export function lastMood(speaker: string): string {
  return last.get(speaker.trim().toLowerCase()) ?? 'neutral';
}

/** Forgets every mood (a new game starts neutral). */
export function resetMoods(): void {
  last.clear();
}

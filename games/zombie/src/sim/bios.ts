// Bios (DESIGN §24): which survivors have a tab and which story entries each shows, from how far the
// story has got. Pure TypeScript: the title screen reads the save (`progressOfSave`), the pause menu
// reads the live scene (`progressOfIntro` / `progressOfMission` / `progressOfBase`); both then call
// `bioTabs`. The text is fixed and authored (`data/bios.json`, copied from DESIGN-characters.md).
import bios from '../data/bios.json';
import type { BaseState } from './base';
import type { Campaign } from './campaign';
import type { MissionState, SurvivorKind } from './mission';
import type { IntroState } from './tutorial';

/** The story beats a survivor can have an entry for, in story order. */
export const BEATS = ['intro', 'mission1', 'rescue', 'base1', 'herd', 'done', 'bunker', 'base2', 'hut'] as const;
export type Beat = (typeof BEATS)[number];

/** Tabs appear in the order the survivors join the squad. */
export const BIO_ORDER: readonly SurvivorKind[] = ['fighter', 'scout', 'hunter', 'archer', 'tinkerer'];

/** How far the story has got: the beats reached, and whether Eli has arrived (he is the only one who joins inside a beat). */
export interface Progress {
  beats: readonly Beat[];
  eli: boolean;
}

export interface BioEntry {
  beat: Beat;
  text: string;
}

export interface BioTab {
  kind: SurvivorKind;
  name: string;
  fullName: string;
  age: number;
  role: string;
  /** Ray's and June's Dakota name and its English meaning (shown under the name and age); null for the others. */
  dakota: { name: string; meaning: string } | null;
  background: string;
  entries: BioEntry[];
}

interface RawBio {
  name: string;
  fullName: string;
  age: number;
  role: string;
  dakota: { name: string; meaning: string } | null;
  background: string;
  entries: Partial<Record<Beat, string>>;
}

const RAW = bios as unknown as Record<SurvivorKind, RawBio>;

/** Every beat up to and including `last`. */
const upTo = (last: Beat): Beat[] => BEATS.slice(0, BEATS.indexOf(last) + 1);

/** The title screen: the save names the scene about to start, plus the herd checkpoint once the warning has come. */
export function progressOfSave(c: Pick<Campaign, 'stage' | 'checkpoint'>): Progress {
  switch (c.stage) {
    case 'intro':
      return { beats: ['intro'], eli: false };
    case 'mission1':
      return { beats: upTo('mission1'), eli: true };
    case 'base1':
      return { beats: c.checkpoint ? upTo('herd') : upTo('base1'), eli: true };
    case 'done':
      return { beats: upTo('done'), eli: true };
  }
}

/** The pause menu in the Intro: Eli's tab appears once he has walked into the camp. */
export function progressOfIntro(s: Pick<IntroState, 'survivors'>): Progress {
  return { beats: ['intro'], eli: s.survivors.some((u) => u.kind === 'scout') };
}

/** The pause menu in Mission 1 (the rescue plays after the win, where nothing pauses). */
export function progressOfMission(s?: Pick<MissionState, 'mission' | 'survivors'>): Progress {
  if (s?.mission !== 'm02') return { beats: upTo('mission1'), eli: true };
  // Mission 2 comes after Base 1 is won; Theo's tab appears when the bunker door opens and he steps out
  return { beats: s.survivors.some((u) => u.kind === 'tinkerer') ? upTo('bunker') : upTo('done'), eli: true };
}

/** The pause menu in Base 1: the herd entry from the warning on, the last one once the herd is beaten. */
export function progressOfBase(s: Pick<BaseState, 'herd' | 'status'>): Progress {
  return { beats: s.status === 'success' ? upTo('done') : s.herd.warned ? upTo('herd') : upTo('base1'), eli: true };
}

/** Whether a survivor has joined the squad at this point (Ray and June when Base 1 starts, Theo when the bunker door opens). */
function joined(kind: SurvivorKind, p: Progress): boolean {
  if (kind === 'fighter') return true;
  if (kind === 'scout') return p.eli;
  return p.beats.includes(kind === 'tinkerer' ? 'bunker' : 'base1');
}

/** The tabs to show, in join order, each with the entries for the beats reached that the survivor lived through. */
export function bioTabs(p: Progress): BioTab[] {
  return BIO_ORDER.filter((kind) => joined(kind, p)).map((kind) => {
    const raw = RAW[kind];
    const entries: BioEntry[] = [];
    for (const beat of BEATS) {
      const text = raw.entries[beat];
      if (p.beats.includes(beat) && text !== undefined) entries.push({ beat, text });
    }
    return { kind, name: raw.name, fullName: raw.fullName, age: raw.age, role: raw.role, dakota: raw.dakota, background: raw.background, entries };
  });
}

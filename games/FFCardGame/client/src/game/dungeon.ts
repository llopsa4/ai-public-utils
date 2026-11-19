export type NodeKind = 'entry' | 'battle' | 'rest' | 'discovery' | 'workshop' | 'teacher' | 'story' | 'exit';
export interface DungeonNode {
  readonly id: string;
  readonly name: string;
  readonly kind: NodeKind;
  readonly row: number;
  readonly lane: 0 | 1 | 2;
  readonly next: readonly string[];
  readonly risk: 'Safe' | 'Steady' | 'Higher';
  readonly reward: string;
  readonly event: `${NodeKind}-preview`;
}
export interface DungeonDefinition { readonly id: string; readonly name: string; readonly start: string; readonly exit: string; readonly gates: readonly string[]; readonly nodes: readonly DungeonNode[] }
export interface DungeonProgress { id: string; origin: 'ready' | 'complete' }
export type NodeStatus = 'current' | 'visited' | 'reachable' | 'missed' | 'locked';

export function nodeById(map: DungeonDefinition, id: string) { return map.nodes.find(node => node.id === id); }
function reachable(map: DungeonDefinition, from: string, to: string, excluded?: string): boolean {
  const pending = [from], seen = new Set<string>();
  while (pending.length) {
    const id = pending.pop()!;
    if (seen.has(id) || id === excluded) continue;
    if (id === to) return true;
    seen.add(id);
    pending.push(...(nodeById(map, id)?.next ?? []));
  }
  return false;
}
export function validateDungeon(map: DungeonDefinition): void {
  const ids = map.nodes.map(node => node.id);
  if (!map.id || !map.name || new Set(ids).size !== ids.length || !ids.includes(map.start) || !ids.includes(map.exit)) throw new Error('Invalid dungeon identity');
  const kinds: readonly NodeKind[] = ['entry','battle','rest','discovery','workshop','teacher','story','exit'];
  const positions = new Set<string>();
  for (const node of map.nodes) {
    const position = `${node.row}:${node.lane}`;
    if (!node.id || !node.name || !node.reward || !kinds.includes(node.kind) || node.event !== `${node.kind}-preview`
      || !['Safe','Steady','Higher'].includes(node.risk) || !Number.isInteger(node.row) || node.row < 0 || ![0,1,2].includes(node.lane) || positions.has(position)) throw new Error('Invalid dungeon node');
    positions.add(position);
    if (new Set(node.next).size !== node.next.length || node.next.some(id => !ids.includes(id))) throw new Error('Missing or repeated dungeon edge');
    if (node.id === map.exit ? node.next.length !== 0 || node.kind !== 'exit' : node.next.length === 0 || node.kind === 'exit') throw new Error('Dungeon has an invalid exit');
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) throw new Error('Dungeon contains a cycle');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of nodeById(map,id)!.next) visit(next);
    visiting.delete(id); visited.add(id);
  }
  for (const id of ids) visit(id);
  if (nodeById(map,map.start)!.kind !== 'entry' || map.nodes.some(node => !reachable(map,map.start,node.id) || !reachable(map,node.id,map.exit))) throw new Error('Dungeon contains unreachable nodes');
  if (map.nodes.some(node => node.next.some(id => nodeById(map,id)!.row <= node.row))) throw new Error('Dungeon edges must point forward');
  if (new Set(map.gates).size !== map.gates.length || map.gates.some(id => !ids.includes(id))) throw new Error('Invalid mandatory gate');
  for (const gate of map.gates) if (reachable(map,map.start,map.exit,gate)) throw new Error('A mandatory gate can be bypassed');
  if (map.gates.some((id,index) => index > 0 && !reachable(map,map.gates[index-1],id))) throw new Error('Mandatory gates are out of order');
}
export function dungeonPath(map: DungeonDefinition, decisions: readonly string[]) { return decisions.filter(id => !!nodeById(map,id)); }
export function validDungeonPath(map: DungeonDefinition, path: readonly string[]): boolean {
  return path.length > 0 && path[0] === map.start && new Set(path).size === path.length
    && path.every((id,index) => !!nodeById(map,id) && (!index || nodeById(map,path[index-1])!.next.includes(id)));
}
export function nodeStatus(map: DungeonDefinition, path: readonly string[], id: string): NodeStatus {
  const current = path.at(-1) ?? map.start;
  if (id === current) return 'current';
  if (path.includes(id)) return 'visited';
  if (nodeById(map,current)?.next.includes(id)) return 'reachable';
  return reachable(map,current,id) ? 'locked' : 'missed';
}
export function destinationEvent(map: DungeonDefinition, nodeId: string) {
  const node = nodeById(map,nodeId);
  if (!node) throw new Error('Unknown destination');
  return { type: node.event, nodeId: node.id, kind: node.kind };
}

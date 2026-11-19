import { validateDungeon, type DungeonDefinition } from '../game/dungeon';

// Systems route: encounters, recovery and rewards work here. Workshops and
// story stops remain previews; no private storyboard is bundled here.
export const ROUTE_PREVIEW: DungeonDefinition = {
  id: 'kiln-route-preview', name: 'Paths through the kiln', start: 'route-entry', exit: 'route-exit', gates: ['route-teacher','route-story'],
  nodes: [
    { id:'route-entry', name:'Ash passage', kind:'entry', row:0, lane:1, next:['route-ash-way','route-pressure-way'], risk:'Safe', reward:'Route choice', event:'entry-preview' },
    { id:'route-ash-way', name:'Ashway', kind:'battle', row:1, lane:0, next:['route-rest','route-discovery'], risk:'Steady', reward:'Card choice', event:'battle-preview' },
    { id:'route-pressure-way', name:'Pressure walk', kind:'battle', row:1, lane:2, next:['route-rest','route-discovery'], risk:'Higher', reward:'Salvage', event:'battle-preview' },
    { id:'route-rest', name:'Quiet hearth', kind:'rest', row:2, lane:0, next:['route-teacher'], risk:'Safe', reward:'Recovery', event:'rest-preview' },
    { id:'route-discovery', name:'Forgotten alcove', kind:'discovery', row:2, lane:2, next:['route-teacher'], risk:'Steady', reward:'Discovery choice', event:'discovery-preview' },
    { id:'route-teacher', name:'Teacher’s station', kind:'teacher', row:3, lane:1, next:['route-workshop','route-overlook'], risk:'Safe', reward:'Technique training', event:'teacher-preview' },
    { id:'route-workshop', name:'Old workbench', kind:'workshop', row:4, lane:0, next:['route-story'], risk:'Safe', reward:'Equipment options', event:'workshop-preview' },
    { id:'route-overlook', name:'Ember overlook', kind:'discovery', row:4, lane:2, next:['route-story'], risk:'Steady', reward:'Discovery choice', event:'discovery-preview' },
    { id:'route-story', name:'Bridge watch', kind:'story', row:5, lane:1, next:['route-exit'], risk:'Safe', reward:'Story encounter', event:'story-preview' },
    { id:'route-exit', name:'The far door', kind:'exit', row:6, lane:1, next:[], risk:'Safe', reward:'Preview complete', event:'exit-preview' },
  ],
};
validateDungeon(ROUTE_PREVIEW);

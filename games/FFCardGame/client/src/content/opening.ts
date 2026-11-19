import { validateDungeon, type DungeonDefinition } from '../game/dungeon';
import type { CampaignState } from '../game/campaign';
import { ROUTE_PREVIEW } from './dungeon';
import { ROUTE_ENCOUNTERS } from './rewards';
import { PROTOTYPE_ENCOUNTER } from './encounter';
import { BRIDGE_ENCOUNTER } from './bridge';

export const OPENING_MAP: DungeonDefinition = {
  id:'first-delivery',name:'The First Delivery',start:'route-entry',exit:'route-exit',gates:['route-junction','route-workshop','route-teacher','route-story'],
  nodes:[
    {id:'route-entry',name:'Ashways · departure',kind:'entry',row:0,lane:1,next:['route-ash-way','route-pressure-way'],risk:'Safe',reward:'Choose a passage',event:'entry-preview'},
    {id:'route-ash-way',name:'Open ashway',kind:'battle',row:1,lane:0,next:['route-rest','route-discovery'],risk:'Steady',reward:'12 salvage · card choice',event:'battle-preview'},
    {id:'route-pressure-way',name:'Return-pipe lane',kind:'battle',row:1,lane:2,next:['route-rest','route-discovery'],risk:'Higher',reward:'12 salvage · card choice',event:'battle-preview'},
    {id:'route-rest',name:'Quiet hearth',kind:'rest',row:2,lane:0,next:['route-junction'],risk:'Safe',reward:'HP recovery · full MP',event:'rest-preview'},
    {id:'route-discovery',name:'Forgotten alcove',kind:'discovery',row:2,lane:2,next:['route-junction'],risk:'Safe',reward:'10 salvage or technique',event:'discovery-preview'},
    {id:'route-junction',name:'Return-pipe junction',kind:'battle',row:3,lane:1,next:['route-workshop'],risk:'Steady',reward:'12 salvage · recover MP',event:'battle-preview'},
    {id:'route-workshop',name:'Tempering workbench',kind:'workshop',row:4,lane:1,next:['route-teacher'],risk:'Safe',reward:'Gear · deck refinement',event:'workshop-preview'},
    {id:'route-teacher',name:'Oren’s tempering house',kind:'teacher',row:5,lane:1,next:['route-kiln-bay','route-cable-shelf'],risk:'Safe',reward:'Training · HP/MP growth',event:'teacher-preview'},
    {id:'route-kiln-bay',name:'Approach · kiln bay',kind:'battle',row:6,lane:0,next:['route-second-rest','route-second-discovery'],risk:'Higher',reward:'20 salvage · card choice',event:'battle-preview'},
    {id:'route-cable-shelf',name:'Approach · cable shelf',kind:'battle',row:6,lane:2,next:['route-second-rest','route-second-discovery'],risk:'Higher',reward:'20 salvage · card choice',event:'battle-preview'},
    {id:'route-second-rest',name:'Service hearth',kind:'rest',row:7,lane:0,next:['route-story'],risk:'Safe',reward:'HP recovery · full MP',event:'rest-preview'},
    {id:'route-second-discovery',name:'Abandoned supply ledge',kind:'discovery',row:7,lane:2,next:['route-story'],risk:'Safe',reward:'10 salvage or insulated kit',event:'discovery-preview'},
    {id:'route-story',name:'Hanging Crossing',kind:'story',row:8,lane:1,next:['route-exit'],risk:'Higher',reward:'Iven · 20 salvage',event:'story-preview'},
    {id:'route-exit',name:'The other side',kind:'exit',row:9,lane:1,next:[],risk:'Safe',reward:'Opening chapter complete',event:'exit-preview'},
  ],
};
validateDungeon(OPENING_MAP);
export function campaignMap(state: CampaignState) {return state.systems?.opening?OPENING_MAP:ROUTE_PREVIEW;}
export const OPENING_ENCOUNTERS = {
  'route-ash-way':{encounter:ROUTE_ENCOUNTERS['route-ash-way'],salvage:12,cards:true},
  'route-pressure-way':{encounter:ROUTE_ENCOUNTERS['route-pressure-way'],salvage:12,cards:true},
  'route-junction':{encounter:{...ROUTE_ENCOUNTERS['route-pressure-way'],id:'junction-scavenger',title:'RETURN-PIPE JUNCTION',introduction:'The scavenger braces a loose pipe before turning. Mara: “You held the pipe first. Why?”'},salvage:12,cards:false},
  'route-teacher':{encounter:ROUTE_ENCOUNTERS['route-teacher'],salvage:0,cards:false},
  'route-kiln-bay':{encounter:{...PROTOTYPE_ENCOUNTER,id:'opening-furnace-guardian',introduction:'The guardian turns a return valve, then moves across the passage.'},salvage:20,cards:true},
  'route-cable-shelf':{encounter:{...ROUTE_ENCOUNTERS['route-pressure-way'],id:'armored-scavenger',title:'CABLE SHELF',enemy:{name:'Reinforced Scavenger',label:'Scavenger',maxHp:60,intents:[{name:'Collect',damage:6,block:0},{name:'Brace',damage:4,block:6},{name:'Discharge',damage:12,block:0}]}},salvage:20,cards:true},
  'route-story':{encounter:BRIDGE_ENCOUNTER,salvage:20,cards:false},
} as const;
export function openingEncounter(nodeId:string){return Object.hasOwn(OPENING_ENCOUNTERS,nodeId)?OPENING_ENCOUNTERS[nodeId as keyof typeof OPENING_ENCOUNTERS]:undefined;}

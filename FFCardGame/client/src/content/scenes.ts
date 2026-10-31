export const SCENES = {
  home: { title: 'The last warm room', objective: 'Check the kiln regulator.', action: 'Check the regulator', lines: [
    ['Neighbor', 'You fixed the latch.'], ['Mara', 'It sticks when the room cools. I’ll return tomorrow.'],
    ['Neighbor', 'Soup first?'], ['Mara', 'Save some for the night shift.'],
  ] },
  regulator: { title: 'An unwanted shutdown', objective: 'Take the regulator to the First Hearth.', action: 'Release regulator', lines: [
    ['Mara', 'The patch should hold. It held last winter.'], ['Tender', 'The crack has reached the locking ring.'],
    ['Mara', 'If I disconnect it, these rooms go cold.'], ['Tender', 'If it bursts, we lose the rooms too.'],
    ['Mara', 'I don’t want to leave everyone here.'], ['Tender', 'We’ll arrange shelter. Can you take the regulator for assessment?'],
  ] },
  ashways: { title: 'Something follows the pulse', objective: 'Make a passage through the ashways.', action: 'Make a passage', lines: [
    ['Mara', 'You’re meant to clear ash.'], ['Mara', 'I only need a way through.'],
  ] },
  oren: { title: 'Notice the load', objective: 'Practice a controlled release with Oren.', action: 'Send supply request', lines: [
    ['Oren', 'Your hand hasn’t stopped shaking.'], ['Mara', 'Everyone needs something. I should be back there.'],
    ['Oren', 'What do you need before you can go?'], ['Mara', 'Rest. And someone else handling supplies.'],
    ['Oren', 'There’s a courier leaving at dawn.'], ['Mara', 'Then I’ll send a request. I can’t do both.'],
  ] },
  hope: { title: 'A reason to continue', objective: 'Reach the crossing with the regulator.', action: 'Carry onward', lines: [
    ['Mara', 'I thought leaving meant giving up on them.'], ['Oren', 'What could this journey make possible?'],
    ['Mara', 'A repair we couldn’t make at home.'], ['Mara', 'I want to bring that chance back.'],
  ] },
  crossing: { title: 'Share the load', objective: 'Help secure the crossing.', action: 'Help secure the crossing', lines: [
    ['Iven', 'People first. The crates can wait.'], ['Mara', 'I need the crossing too. Where can I help?'],
    ['Iven', 'Keep that clamp off the rail. I’ll cover you.'], ['Mara', 'Then let’s give them a way across.'],
  ] },
  partnership: { title: 'The other side', objective: 'Beyond the crossing: the Weave Station.', action: 'Travel together', lines: [
    ['Mara', 'That strap was straight this morning.'], ['Iven', 'It holds better crooked.'],
    ['Iven', 'My district’s heat keeps failing. I need answers, not assurances.'], ['Mara', 'I’m carrying a question like that.'],
    ['Mara', 'Travel together?'], ['Iven', 'Until we’ve heard an answer worth carrying home.'],
  ] },
} as const;
export type SceneId = keyof typeof SCENES;

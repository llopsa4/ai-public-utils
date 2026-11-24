# Dead Woods changelog

- 2026-11-24: The title screen now shows a misty forest, distant zombies and a worn Dead Woods wordmark. The forest also appears behind the pause menu.

- 2026-11-24: Cass and Eli now have four dialogue expressions and illustrated squad cards. Both show hurt portraits below 35% health.

- 2026-11-24: The action bar and HUD now use painted icons, and the game uses custom Select, Attack, Use and Move cursors. The Takedown icon shows both of the zombie's arms reaching forward.

- 2026-11-24: The dialogue, action bar, squad cards and pause menu now use the worn canvas and metal UI kit. Active actions have an amber rim, and Options has painted slider handles and checkboxes.

- 2026-11-24: The interface now uses the painted-kit slots (grey stand-ins until the art arrives). The action bar shows an icon per action with its key in one corner, the ammo count in the other and the name on a tooltip; the number row at the top-left has an icon beside each number; squad cards, the dialogue box, the pause menu and the Options page (sliders, checkboxes, buttons) are built from the kit. Painted mouse cursors replace the plain ones as soon as their art is installed.

- 2026-11-24: Zombie crowds now include rotting work-jacket, cardigan and hoodie zombies, each with six animations and its own limp.

- 2026-11-24: Zombie crowds now include decayed versions of the work-jacket, cardigan and hoodie bodies, each with its own limp and full animation set.

- 2026-11-24: Fresh zombies have three distinct bodies and limps, with full shamble, reach, chase, bite and fall animations.

- 2026-11-24: Base 1 is fairer. The herd is 12 zombies instead of 15, a meal heals 60 HP instead of 30, and cooking
  takes 6 seconds instead of 5. Tested with a scripted careful defence (it now holds the house about three times in four)
  and a passive one (it never does).

- 2026-11-24: The game runs lighter. Zombies that cannot reach anyone (the house is sealed) no longer search the
  whole map every half second, so a herd of twenty plans its walk about fifty times faster, and the ground of every
  map is now drawn once instead of tile by tile (about 1000 fewer objects on screen to manage in Base 1).

- 2026-11-24: Adaptive ambience (DESIGN §6). Music is a layered soundscape made in code. A calm woods bed (wind
  and a low drone) plays under the title menu and every scene. While a zombie chases you or a guard's alarm is up,
  a heartbeat pulse fades in (faster and louder with more chasers) and the bed sinks a little; it fades out slowly
  once the chase is over. From the herd's warning until Base 1 is won or lost a heavy low layer sits under
  everything. The Ambience slider in Options works now.

- 2026-11-24: Cass has 76 redrawn animation frames with twice the sprite resolution at the same in-game size.

- 2026-11-24: Sound effects (DESIGN §6). Everything is made in code, so there are no sound files. You now hear
  pistol shots, knife stabs, club hits, a thrown lure, zombie bites, zombies chewing a barricade or window,
  footsteps (softer crouching, fainter crawling, harder running, a heavy drag for zombies), the noise can, the
  spike pit, a crate opening, zombie groans (more often while one chases you), menu clicks and a typewriter clack
  while the dialogue types. Each sound comes from where it happens: panned left or right of the view and fading
  out about one screen beyond the screen's edge, so a faint groan off screen is a warning. Options: Master and
  Effects volume and Mute work now (a tick plays at the new level); the Ambience slider waits for the ambience (Z40).
  Sound starts on your first click or key press, a browser rule.

- 2026-11-24: Hit feedback (DESIGN §19). A figure that loses hit points flashes white for a moment; the view gives a
  small shake on every shot and when a survivor is hurt (Options, Screen shake turns it off); short text pops
  appear for a crate's loot ("+3 ammo  +2 food"), a silent takedown and the last bullet ("Out of ammo"). When a
  survivor, a fixed window or door, or a barricade is attacked out of sight, a red arrow with its name appears
  on the screen edge for six seconds, and **U** (rebindable, "Jump to attack") glides the camera to it, then to the
  next older attack on each press. When the herd comes in, the screen flashes red and the camera glides north to
  where they enter.

- 2026-11-24: Keys can be rebound (DESIGN §19). Esc, Options, Keys: click an action's key and press the new one;
  a key that already does something else is refused and the page says what ("Already used by Hold"), Esc cancels,
  and "Reset to defaults" puts every key back. Pan, survivor selection, pause time, weapons and every order key can
  change; Esc, Enter, R and the arrow keys stay fixed (the arrows always pan too). The action bar, the corner
  key help, the Controls page and the start hints all show the keys you chose, and they are saved with the options.

- 2026-11-23: Decided (not built yet): every survivor can shoot the same pistol. Cass keeps only her knife
  through the Intro and Mission 1 and takes her pistol back when the pair reach Base 1. Every survivor
  shoots with both hands and wears a holster on the chest; Eli gets one on his vest.

- 2026-11-23: The story is wired together (DESIGN §15, §18). New Game plays the Intro, then Mission 1, then Base 1
  ("To be continued..." when the herd is dead). Winning Mission 1 plays a short dialogue and takes you straight to
  Base 1 with the food, scrap and unspent ammo you found; the Intro's leftover ammo carries into Mission 1. The game
  saves at the start of each of the three scenes and Continue (which names the scene under it) resumes there; the
  old slice save is thrown away. The menu's three test buttons, the old camp and the debrief screen are gone.

- 2026-11-23: Base 1, first part (DESIGN §12, §17): the Mission 1 house as a home, reached from the menu's "Base 1
  (test)" button until Z18. Three gaps are marked "Broken door" / "Broken window"; X then click one and a survivor
  works 3 s and spends 1 scrap to fix it: zombies must chew it down (100 HP, about 7 s), after which it can be fixed
  again. The back door is walled up. Barricades (B) stay for the yard. Right-click the stove (or K) to cook: 5 s and
  1 food make 1 meal, held by the cook (E eats it: hunger back to 8 min, +30 HP for the eater; Q gives it to an
  adjacent survivor without one). Each survivor has an 8-minute hunger meter under the portrait in the action bar
  (and a timer in the top-left): yellow with the line "I need to eat something." at 2 min, flashing red at 30 s;
  at 0 the survivor loses 1 HP every 3 s and walks at 70% speed. A survivor's death restarts the base. There are no
  zombies, traps or herd yet (Z16, Z17); the old Camp scene is untouched until Z18.
- 2026-11-23: Intro (DESIGN §15): a new scene in the woods camp with four gated steps: walk to the fire, the
  Fighter's knife kills a zombie, the Scout shoots one (using ammo), a survivor on Hold stops a last one. A gold
  ring marks the goal, the dialogue plays between steps, and the last one starts Mission 1. A kill that skips the
  lesson (the Scout with the club in step 2, no shot in step 3, no Hold in step 4) does not count: another zombie
  comes. The menu has an "Intro (test)" button until Z18 wires New Game to it.
- 2026-11-23: Dialogue box (DESIGN §6): a box above the action bar with the speaker name, a grey portrait and the
  line typed letter by letter in the Special Elite font (bundled in `src/fonts/`, Apache 2.0). Click, Enter or Space
  completes the line, then advances; every other scene is paused while it is open. Not yet used by the story
  (Intro, Z14); `dw.say(lines)` opens it in a `?debug` mission.
- 2026-11-23: Weapons, ammo and action bar (DESIGN §5, §17): the Fighter has the knife only; the Scout has a Gun
  (pistol, 25 damage, loud, 1 ammo per shot) and a Club (15, silent, adjacent). The bow is gone. Ammo (3 at the
  start of a mission, crates can hold more) is shared and shown in the HUD. A bar along the bottom of the mission
  shows the selected survivor and buttons for weapons (keys 1, 2), Takedown, Carry, Lure, Hold and Crouch;
  unavailable ones are greyed (Gun at 0 ammo, Lure while recharging). At 0 ammo attacks fall back to the club.
  Not yet in the Camp scene (replaced by Base 1, Z15) and ammo is not yet saved between scenes (Z18).
- 2026-11-23: Zombie senses (DESIGN §7): zombies have no vision cone any more; they see all round within 3 tiles
  (2 if the survivor is crouched or crawling) with clear line of sight, and a crouched survivor in a bush is
  hidden unless adjacent. A faint grey circle shows the sight radius.
- 2026-11-22: Campaign and save: New Game → Camp → M starts mission 1 → extraction → Debrief (loot) → Camp, which then
  shows "To be continued...". Continue on the menu resumes from `localStorage` key `deadwoods.save` (food, scrap,
  barricades, missions done); the menu's "Mission 1 (test)" still runs the mission alone.
- 2026-11-22: Mission 1 playable (grey placeholders): vision cones, noise rings, crouch / crawl, watch,
- 2026-11-22: Camp threat and building: four zombies roam the woods (the same AI as on missions), V watch and
  right-click attack kill them, B places barricade segments for scrap (zombies chew them), both
  survivors dead restarts the camp.
  takedown, carry, lure, crates, extract, restart on death, pause. Reached from the menu's
  "Mission 1 (test)" button until the campaign (Z6) wires it in.
- 2026-11-22: Stealth core sim (vision cones, line of sight, bushes, noise, zombie and guard AI,
  watch order, combat, mission fail / extract), tested headless; no mission scene yet.
- 2026-11-22: First scaffold: title menu and an empty grey isometric camp grid with pan and zoom.

- 2026-11-23: Cass has pixel art for her idle pose in all four facings. Movement and action frames still use stand-ins.
- 2026-11-23: Cass now has pixel art for movement, work, combat and death in all four facings.
- 2026-11-24: Installed the approved full Eli (Scout) pixel-art animation set: 66 frames at 2× source resolution, rendered at the same game size, covering movement, stealth, work, Hold, pistol, club, lure and death.

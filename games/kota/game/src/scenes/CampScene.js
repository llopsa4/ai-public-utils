// Camp: the hub between runs (DESIGN-m1.md section 11). The screens live in camp/camp.js; the save in camp/save.js.
// "Begin a run" asks for the place when more than one is unlocked.

import { showCamp } from '../camp/camp.js';
import { CampBackdrop } from '../camp/backdrop.js';

export class CampScene extends Phaser.Scene {
  constructor() { super('Camp'); }

  create() {
    const app = this.app = this.registry.get('app');
    app.mode = 'camp';
    app.input.setActive(false);
    app.ui.showHud(false);
    app.audio.setAmbience('camp');
    this.cameras.main.setBackgroundColor('#0b1022');
    this.backdrop = new CampBackdrop(this, app.settings.values.quality);
    document.body.classList.add('camp');                       // lets the menu sit in the sky above the camp
    this.events.once('shutdown', () => document.body.classList.remove('camp'));
    const data = this.cache.json.get('camp');
    const places = this.cache.json.get('arenas').filter((a) => !a.requires || app.camp.built.includes(a.requires));
    const start = (arena) => {
      if (app.mode !== 'camp') return;
      app.ui.hide();
      this.scene.start('Run', { hero: 'ash_wolf', arena });
    };
    const home = () => showCamp(app, data, begin);
    const begin = () => {
      if (places.length < 2) { start(places[0].id); return; }
      const options = places.map((a) => ({ label: a.name, detail: a.twist.kind === 'wind' ? 'Wind gusts push everyone' : 'Shallow water slows walkers', onClick: () => start(a.id) }));
      options.push({ label: 'Back', onClick: home });
      app.ui.show('Choose a place', 'Where will you meet the threats?', options);
    };
    home();
    if (app.fell) { app.fell = false; app.hints.trigger('carried'); }
  }

  update(time, delta) {
    const dt = Math.min(delta, 100) / 1000;
    this.backdrop.update(dt);
    if (!this.app.paused) this.app.hints.update(dt);
  }
}

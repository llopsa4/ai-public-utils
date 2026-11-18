// Camp: the hub between runs (DESIGN-m1.md section 11). Only "Begin a run" exists so far; permanent
// upgrades, elder stories and the saved totals arrive in plan task C6.

export class CampScene extends Phaser.Scene {
  constructor() { super('Camp'); }

  create() {
    const app = this.registry.get('app');
    app.mode = 'camp';
    app.input.setActive(false);
    app.ui.showHud(false);
    app.audio.setAmbience('camp');
    this.cameras.main.setBackgroundColor('#6b6258');

    app.ui.show("Camp in Cansa'yapi",
      "Cansa'yapi: where they marked the trees red (the Minnesota River Valley).\n"
      + 'Iya, the Camp-Eater, has swallowed a camp. Follow him through the homeland and bring the people out.',
      [{
        label: 'Begin a run',
        detail: 'Play as Ash Wolf',
        onClick: () => {
          if (app.mode !== 'camp') return;
          app.ui.hide();
          this.scene.start('Run', { hero: 'ash_wolf' });
        },
      }]);
  }
}

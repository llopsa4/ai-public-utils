import Phaser from 'phaser';

const FONT = 'Georgia, "Times New Roman", serif';

/** Screen overlay over the Camp: resources, the selection, hints and the controls. Reads the registry. */
export class HudScene extends Phaser.Scene {
  private res!: Phaser.GameObjects.Text;
  private sel!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;

  constructor() {
    super('Hud');
  }

  create(): void {
    const { width, height } = this.scale;
    const box = { backgroundColor: '#1d201cb0', padding: { x: 10, y: 6 } };
    this.res = this.add.text(16, 12, '', { fontFamily: FONT, fontSize: '22px', color: '#e8e6de', ...box });
    this.sel = this.add.text(16, height - 16, '', { fontFamily: FONT, fontSize: '18px', color: '#e8e6de', ...box }).setOrigin(0, 1);
    this.hint = this.add.text(width / 2, height - 16, '', { fontFamily: FONT, fontSize: '18px', color: '#e8c46a', ...box }).setOrigin(0.5, 1);
    this.banner = this.add.text(width / 2, height * 0.35, '', { fontFamily: FONT, fontSize: '34px', color: '#e8e6de', backgroundColor: '#3a1410d0', padding: { x: 22, y: 12 } }).setOrigin(0.5);
    this.add.text(width - 16, 14, 'Click / drag: select    Right-click: move / attack    V: watch    B: barricade    M: mission    WASD / edge: pan    Wheel: zoom    Esc: menu', {
      fontFamily: FONT, fontSize: '14px', color: '#a8a69e',
    }).setOrigin(1, 0);
  }

  update(): void {
    const food = this.registry.get('food') as number | undefined;
    const scrap = this.registry.get('scrap') as number | undefined;
    const zombies = this.registry.get('zombies') as number | undefined;
    const names = this.registry.get('selected') as string | undefined;
    const hint = this.registry.get('hint') as string | undefined;
    const banner = this.registry.get('banner') as string | undefined;
    this.res.setText(`Food ${food ?? 0}    Scrap ${scrap ?? 0}    Zombies ${zombies ?? 0}`);
    this.sel.setText(names ? names : 'Nobody selected');
    this.hint.setText(hint ?? '').setVisible(!!hint);
    this.banner.setText(banner ?? '').setVisible(!!banner);
  }
}

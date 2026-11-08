import Phaser from 'phaser';
import type { RoomScene } from './scenes';
import { settings } from '../engine/settings';
import { sound } from '../audio/sound';
import { wait } from './room/runner';
import cellArt from '../../art/src/props/ashways-pressure-cell.png';
import brokenArt from '../../art/src/props/ashways-pressure-cell-ruptured.png';
import disabledArt from '../../art/src/props/ashways-sweeper-disabled.png';

export function queueAshways(scene: Phaser.Scene): void {
  for (const [key,url] of Object.entries({ 'ashways-cell':cellArt,'ashways-cell-broken':brokenArt,'ashways-disabled':disabledArt }))
    if(!scene.textures.exists(key)) scene.load.image(key,url);
}

/** Persistent set dressing plus the four resumable cinematic beats. */
export class AshwaysSet {
  private readonly cell: Phaser.GameObjects.Sprite;
  private readonly disabled: Phaser.GameObjects.Sprite;
  constructor(private readonly scene: RoomScene) {
    this.cell=scene.add.sprite(190,237,'ashways-cell').setOrigin(.5,1).setScale(.5).setDepth(236);
    this.disabled=scene.add.sprite(360,305,'ashways-disabled').setOrigin(.5,1).setScale(.5).setDepth(305).setVisible(false);
    scene.objects.set('pressureCell',this.cell);scene.objects.set('sweeperDisabled',this.disabled);
    scene.events.once('shutdown',()=>{
      const inventory=document.querySelector<HTMLElement>('#inventory [data-item="regulator"]');
      if(inventory)inventory.style.opacity='';
    });
    this.update(0);
  }
  private merchant() { return this.scene.crowd?.visible().find(m=>m.def.id==='extra-merchant'); }
  update(time: number): void {
    const {scene}=this,f=scene.session.state.flags;
    this.cell.setTexture(f.ashwaysExploded?'ashways-cell-broken':'ashways-cell');
    const pulse=f.ashwaysExploded||settings().reducedMotion?1:.78+Math.sin(time*.004)*.22;
    this.cell.setAlpha(pulse);
    const inventory=document.querySelector<HTMLElement>('#inventory [data-item="regulator"]');
    if(inventory)inventory.style.opacity=String(pulse);
    this.disabled.setVisible(!!f.ashwaysWon);
    if(f.ashwaysWon) {scene.objects.get('sweeper')?.setVisible(false);scene.objectShadows.get('sweeper')?.setVisible(false);}
    else if(f.ashwaysConfronted)scene.objects.get('sweeper')?.setPosition(360,300).setDepth(300);
    if(f.ashwaysStarted) {
      const m=this.merchant();
      if(m) {
        if(!m.held)scene.crowd!.hold(m);
        if(f.ashwaysExploded) { m.actor.sprite.setPosition(142,320);if(m.actor.pose!=='crouch')m.actor.setPose('crouch'); }
      }
    }
  }
  async beat(phase: 'depart'|'rupture'|'return'|'settle'): Promise<void> {
    const s=this.scene,calm=settings().reducedMotion,m=this.merchant();
    if(m)s.crowd!.hold(m);
    if(phase==='depart') {
      await s.hero.walk([{x:672,y:292}]);s.hero.sprite.setVisible(false);
      if(m)await m.actor.walk(s.area.findPath(m.actor.position,{x:210,y:300}));
      await wait(s,calm?200:600);
    } else if(phase==='rupture') {
      if(m){m.actor.setFacing('left');m.actor.perform('reach');}
      await wait(s,400);sound.shatter();sound.hiss(500);
      if(!calm) {s.cameras.main.shake(350,.006);s.props.burst([{x:190,y:215}]);}
      this.cell.setTexture('ashways-cell-broken').setAlpha(1);
      if(m){
        m.actor.stop();m.actor.perform(null);m.actor.setPose('crouch');
        if(calm)m.actor.sprite.setPosition(142,320);
        else await new Promise<void>(resolve=>s.tweens.add({targets:m.actor.sprite,x:142,y:320,duration:250,ease:'Quad.easeOut',onComplete:()=>resolve()}));
      }
      await wait(s,calm?250:650);
    } else if(phase==='return') {
      s.hero.sprite.setPosition(650,302).setVisible(true);s.hero.setFacing('left');
      await s.hero.walk([{x:488,y:302}]);s.syncHero();
      const sweeper=s.objects.get('sweeper');
      if(sweeper){
        if(s.anims.exists('sweeper:scurry'))sweeper.play('sweeper:scurry');
        await new Promise<void>(resolve=>s.tweens.add({targets:sweeper,x:360,y:300,duration:calm?100:800,onComplete:()=>resolve()}));
      }
      sound.brushes(600);
    } else {
      s.objects.get('sweeper')?.setVisible(false);this.disabled.setVisible(true);
      sound.hush(false);sound.music('cold');
      if(m){m.actor.setPose('crouch');m.actor.setFacing('right');}
    }
  }
}

import Phaser from 'phaser';

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'fireball');
  }
  fire(x: number, y: number) {
    this.body.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setGravityY(0);
    this.setVelocityY(-200);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.y <= -32) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}

export default class Bullets extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene) {
    super(scene.physics.world, scene);

    this.createMultiple({
      frameQuantity: 5,
      key: 'bullet',
      active: false,
      visible: false,
      classType: Bullet,
    });

  }

  fireBullet(x: number, y: number) {
    let bullet = this.getFirstDead(false);
    bullet?.fire(x, y);
  }
}

import Phaser from 'phaser'

export default class Melee extends Phaser.GameObjects.Image {
  constructor (scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bomb')
    scene.add.existing(this)
  }
  fire (x: number, y: number, angle: number) {
    console.log('Bullet -> fire -> angle', angle)
    // this.body.reset(x, y)
    this.setActive(true)
    this.setVisible(true)
    // this.scene.physics.velocityFromRotation(angle, 600, this.body.velocity)
  }
}

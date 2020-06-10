import Phaser from 'phaser'
import { FacingState } from '~/characters/playerStates'

export default class Melee extends Phaser.GameObjects.Sprite {
  private existanceCounter = 0
  private xModifier = -30
  private yModifier = 0
  private facingState;
  constructor(
    scene: Phaser.Scene,
    facingState: FacingState,
    x: number,
    y: number
  ) {
    super(scene, x, y, 'bomb')
    this.x += this.xModifier
    this.y += this.yModifier
    this.facingState = facingState
    scene.add.existing(this)
  }
  fire(x: number, y: number, angle: number) {
    console.log('Bullet -> fire -> angle', angle)
    // this.body.reset(x, y)
    this.setActive(true)
    this.setVisible(true)
    // this.scene.physics.velocityFromRotation(angle, 600, this.body.velocity)
  }
  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt)
    this.existanceCounter += dt
    if (this.existanceCounter > 150) {
      this.existanceCounter = 0
      this.destroy(true)
    }
  }
  updatePosition(x: number, y: number) {
    this.x = x + this.xModifier
    this.y = y
  }
}

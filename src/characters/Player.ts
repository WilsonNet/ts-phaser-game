import Phaser from 'phaser'
import Bullets from '../skills/Bullets'
export default class Player extends Phaser.Physics.Arcade.Sprite {
  private doublePressEligibility = {}
  constructor (
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame)
    scene.physics.add.existing(this)
    scene.sys.displayList.add(this)
    scene.sys.updateList.add(this)
    this.setBounce(0.4)
    this.setCollideWorldBounds(true)

    let angle = 0
    scene.input.on('pointermove', pointer => {
      if (!this) return
      const playerVector = new Phaser.Math.Vector2(this.x, this.y)
      angle = Phaser.Math.Angle.BetweenPoints(playerVector, pointer)
    })
    const bullets = new Bullets(scene)

    scene.input.on('pointerdown', pointer => {
      if (!this) return
      console.log('Game -> create -> angle', angle)
      bullets.fireBullet(this.body.x, this.body.y, angle)
    })
  }

  checkDoubleEligibility (
    key: Phaser.Input.Keyboard.Key,
    eligibilityState: Object,
    time: number
  ) {
    //Variable declarations
    const { keyCode } = key
    const lastTime = eligibilityState[keyCode]?.lastTime ?? 0
    const currentTime = time
    const isJustPressed = Phaser.Input.Keyboard.JustDown(key)
    const deltaTime = currentTime - lastTime
    let canDouble = eligibilityState[keyCode]?.canDouble ?? false
    //Logic
    isJustPressed && canDouble && deltaTime < 200
      ? (canDouble = true)
      : (canDouble = false)
    if (canDouble)
      console.table({ hayai: '早い', deltaTime, currentTime, lastTime })
    //State update
    eligibilityState[keyCode] = {
      canDouble: !canDouble, // Can't double if doubled
      lastTime: currentTime
    }
    // Return
    return canDouble
  }

  update (t: number, dt: number, cursors) {
    console.log('oiiii')
    // Esquerda
    const sideDash = 8600
    const sideRun = 160
    if (!cursors?.right?.isDown && cursors?.left?.isDown) {
      if (
        this.checkDoubleEligibility(
          cursors.left as Phaser.Input.Keyboard.Key,
          this.doublePressEligibility,
          t
        )
      ) {
        this.setVelocityX(-sideDash)
      } else {
        this.setVelocityX(-sideRun)
      }
      this.anims.play('left', true)
    } else if (cursors?.right?.isDown && !cursors?.left?.isDown) {
      if (
        this.checkDoubleEligibility(
          cursors.right as Phaser.Input.Keyboard.Key,
          this.doublePressEligibility,
          t
        )
      ) {
        this.setVelocityX(sideDash)
      } else {
        this.setVelocityX(sideRun)
      }
      this.anims.play('right', true)
    } else {
      this.setVelocityX(0)
      this.anims.play('turn')
    }
    if (cursors?.up?.isDown && this.body.touching.down) {
      this.setVelocityY(-330)
    }
  }
}

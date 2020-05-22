import Phaser from 'phaser'
import Bullets from '../skills/Bullets'
import Melee from '~/weapons/Melee'

enum StanceState {
  MELEE,
  RANGED
}

enum ActionState {
  NATURAL,
  DASHING_RIGHT,
  DASHING_LEFT,
  WALL_JUMPING_LEFT,
  WALL_JUMPING_RIGHT
}
export default class Player extends Phaser.Physics.Arcade.Sprite {
  private doublePressEligibility = {}
  private actionState = ActionState.NATURAL
  private stateTimer = 0
  private velocityCount = 0
  private stanceState = StanceState.RANGED
  private bullets!: Bullets
  private mouseAngle = 0

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

    scene.input.on('pointermove', pointer => {
      if (!this) return
      const playerVector = new Phaser.Math.Vector2(this.x, this.y)
      this.mouseAngle = Phaser.Math.Angle.BetweenPoints(playerVector, pointer)
    })
    this.bullets = new Bullets(scene)

    scene.input.on('pointerdown', pointer => this.machineAttack(pointer, scene))
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

  machineAttack (pointer, scene: Phaser.Scene) {
    switch (this.stanceState) {
      case StanceState.MELEE:
        this.setVelocityX(0)
        const melee = new Melee(scene, this.x + 30, this.y)
        break
      case StanceState.RANGED:
        this.bullets.fireBullet(this.body.x, this.body.y, this.mouseAngle)

        break
    }
  }

  preUpdate (t, dt) {
    super.preUpdate(t, dt)
    // console.log('Player -> preUpdate -> stateTimer', this.stateTimer)

    if (this.actionState !== ActionState.NATURAL) this.stateTimer += dt
    const dashSpeed = 1000
    const wallJumpHorizontal = 100
    const wallJumpHeight = -100
    switch (this.actionState) {
      case ActionState.DASHING_LEFT:
        this.setVelocityX(-dashSpeed)
        if (this.stateTimer >= 250) this.cleanActionState()
        break
      case ActionState.DASHING_RIGHT:
        this.setVelocityX(dashSpeed)
        if (this.stateTimer >= 250) this.cleanActionState()
        break
      case ActionState.WALL_JUMPING_LEFT:
        this.setVelocity(-wallJumpHorizontal, wallJumpHeight)
        this.stateTimer += dt
        if (this.stateTimer >= 700) this.cleanActionState()
        break
      case ActionState.WALL_JUMPING_RIGHT:
        this.setVelocity(wallJumpHorizontal, wallJumpHeight)
        this.stateTimer += dt
        if (this.stateTimer >= 700) this.cleanActionState()
        break
      default:
        this.cleanActionState()
        break
    }
  }

  private cleanActionState () {
    this.actionState = ActionState.NATURAL
    this.stateTimer = 0
  }

  update (t: number, dt: number, cursors) {
    if (this.actionState !== ActionState.NATURAL) return
    // Esquerda
    const sideRun = 160
    if (!cursors?.right?.isDown && cursors?.left?.isDown) {
      if (
        this.checkDoubleEligibility(
          cursors.left as Phaser.Input.Keyboard.Key,
          this.doublePressEligibility,
          t
        )
      ) {
        this.actionState = ActionState.DASHING_LEFT
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
        this.actionState = ActionState.DASHING_RIGHT
      } else {
        this.setVelocityX(sideRun)
      }
      this.anims.play('right', true)
    } else {
      this.setVelocityX(0)
      this.anims.play('turn')
    }
    if (cursors?.up?.isDown) {
      this.handleJump()
    }
    if (Phaser.Input.Keyboard.JustDown(cursors.switchMelee)) {
      this.stanceState = StanceState.MELEE
      console.log(this.stanceState)
    } else if (Phaser.Input.Keyboard.JustDown(cursors.switchRanged)) {
      this.stanceState = StanceState.RANGED
      console.log(this.stanceState)
    }
  }
  handleJump () {
    if (this.body.touching.down) {
      this.setVelocityY(-330)
    } else if (this.body.touching.right) {
      this.actionState = ActionState.WALL_JUMPING_LEFT
    } else if (this.body.touching.left) {
      this.actionState = ActionState.WALL_JUMPING_RIGHT
    }
  }
}

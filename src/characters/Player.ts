import Phaser from 'phaser'
import Bullets from '../skills/Bullets'
import Melee from '~/weapons/Melee'

import {
  FacingState,
  ActionState,
  MovementState,
  StanceState,
} from './playerStates'

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private doublePressEligibility = {}
  private movementState = MovementState.NATURAL
  private stateTimer = 0
  private stanceState = StanceState.RANGED
  private bullets!: Bullets
  private mouseAngle = 0
  private actionState = ActionState.NATURAL
  private melee?: Melee

  constructor(
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
    scene.input.mouse.disableContextMenu()
    this.setBounce(0.4)
    this.setCollideWorldBounds(true)

    scene.input.on('pointermove', (pointer) => {
      if (!this) return
      const playerVector = new Phaser.Math.Vector2(this.x, this.y)
      this.mouseAngle = Phaser.Math.Angle.BetweenPoints(playerVector, pointer)
    })
    this.bullets = new Bullets(scene)

    scene.input.on('pointerdown', (pointer) =>
      this.machineAttack(pointer, scene)
    )
    scene.input.on('pointerup', (pointer) => this.machineAttack(pointer, scene))
  }

  checkDoubleEligibility(
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
      lastTime: currentTime,
    }
    // Return
    return canDouble
  }
  meleeAttack(scene: Phaser.Scene) {
    this.melee = new Melee(scene, this.x, this.y)
  }

  machineAttack(pointer: Phaser.Input.Pointer, scene: Phaser.Scene) {
    switch (this.stanceState) {
      case StanceState.MELEE:
        if (pointer.leftButtonDown()) {
          this.meleeAttack(scene)
        } else if (pointer.rightButtonDown()) {
          this.actionState = ActionState.BLOCKING
          console.count('Blocking')
        } else if (
          pointer.rightButtonReleased() //q &&
          // this.actionState === ActionState.BLOCKING
        ) {
          console.count('Unblocking')
          this.actionState = ActionState.NATURAL
        }
        break
      case StanceState.RANGED:
        this.bullets.fireBullet(this.body.x, this.body.y, this.mouseAngle)

        break
    }
  }

  preUpdate(t, dt) {
    super.preUpdate(t, dt)

    if (this.movementState !== MovementState.NATURAL) this.stateTimer += dt

    const dashSpeed = 1000
    const wallJumpHorizontal = 100
    const wallJumpHeight = -100

    switch (this.movementState) {
      case MovementState.DASHING_LEFT:
        this.setVelocityX(-dashSpeed)
        if (this.stateTimer >= 250) this.cleanMovementState()
        break

      case MovementState.DASHING_RIGHT:
        this.setVelocityX(dashSpeed)
        if (this.stateTimer >= 250) this.cleanMovementState()
        break

      case MovementState.WALL_JUMPING_LEFT:
        this.setVelocity(-wallJumpHorizontal, wallJumpHeight)
        this.stateTimer += dt
        if (this.stateTimer >= 700) this.cleanMovementState()
        break

      case MovementState.WALL_JUMPING_RIGHT:
        this.setVelocity(wallJumpHorizontal, wallJumpHeight)
        this.stateTimer += dt
        if (this.stateTimer >= 700) this.cleanMovementState()
        break

      default:
        this.cleanMovementState()
        break
    }

    switch (this.actionState) {
      case ActionState.BLOCKING:
        if (
          this.body.touching.down ||
          this.movementState === MovementState.NATURAL
        ) {
          this.setVelocityX(0)
        }
        this.anims.play('idle')
        break
      default:
        break
    }
  }

  private cleanMovementState() {
    this.movementState = MovementState.NATURAL
    this.stateTimer = 0
  }

  decideFacing = () => {
    const currentKey = this.anims.getCurrentKey()?.split('-')
    const direction = currentKey?.[0]
    if (direction === 'left') {
      this.anims.play('left')
    } else {
      this.anims.play('right')
    }
    this.setVelocityX(0)
  }

  decideIdle() {
    const currentKey = this.anims.getCurrentKey()?.split('-')
    const direction = currentKey?.[0]
    if (direction === 'left') {
      this.anims.play('left')
    } else {
      this.anims.play('right')
    }
    this.setVelocityX(0)
  }

  update(t: number, dt: number, cursors) {
    this.melee?.updatePosition(this.x, this.y)
    if (this.movementState !== MovementState.NATURAL) return
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
        this.movementState = MovementState.DASHING_LEFT
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
        this.movementState = MovementState.DASHING_RIGHT
      } else {
        this.setVelocityX(sideRun)
      }
      this.anims.play('right', true)
    } else {
      this.decideIdle()
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
  handleJump() {
    if (this.body.touching.down) {
      this.setVelocityY(-330)
    } else if (this.body.touching.right) {
      this.movementState = MovementState.WALL_JUMPING_LEFT
    } else if (this.body.touching.left) {
      this.movementState = MovementState.WALL_JUMPING_RIGHT
    }
  }
}

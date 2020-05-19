import Phaser, { Physics, Time } from 'phaser'
import Bullets from '../skills/Bullets'
import Preloader from './Preloader'
import { createDudeAnims } from '~/anims/dude/dudeAnims'
import Player from '~/characters/Player'
export default class Game extends Phaser.Scene {
  private platforms?: Phaser.Physics.Arcade.StaticGroup
  private player!: Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private stars?: Phaser.Physics.Arcade.Group
  private gameOver = false
  private score = 0
  private scoreText?: Phaser.GameObjects.Text
  private bombs?: Phaser.Physics.Arcade.Group
  private doublePressCounter = 0
  private doublePressEligibility = {}

  constructor () {
    super('game')
  }

  preload () {}

  create () {
    const camera = this.cameras.main
    createDudeAnims(this.anims)

    camera.setBounds(0, 0, 800, 600, true)

    this.add.image(400, 300, 'sky')
    this.platforms = this.physics.add.staticGroup()
    const ground = this.platforms.create(
      400,
      568,
      'ground'
    ) as Phaser.Physics.Arcade.Sprite
    ground.setScale(2).refreshBody()

    
     
    
    this.player = this.physics.add.existing(new Player(this, 20, 20, 'dude')) as Player
    // this.player = this.physics.add.sprite(20, 20, 'dude')
    
    this.platforms.create(50, 250, 'ground')
    this.platforms.create(750, 220, 'ground')
    this.platforms.create(600, 400, 'ground')
    // this.player = this.physics.add.sprite(20, 20, 'dude')
    console.log('Game -> create -> this.player', this.player)
    this.player.setBounce(0.2)
    this.player.setCollideWorldBounds(true)

    camera.startFollow(this.player, true)

    this.physics.add.collider(this.player, this.platforms)
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      switchMelee: Phaser.Input.Keyboard.KeyCodes.ONE,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    })

    let angle = 0
    this.input.on('pointermove', pointer => {
      if (!this.player) return
      const playerVector = new Phaser.Math.Vector2(
        this.player?.x,
        this.player?.y
      )
      angle = Phaser.Math.Angle.BetweenPoints(playerVector, pointer)
    })
    const bullets = new Bullets(this)

    this.input.on('pointerdown', pointer => {
      if (!this.player) return
      console.log('Game -> create -> angle', angle)
      bullets.fireBullet(this.player?.body.x, this.player?.body.y, angle)
    })
  }

  checkDoubleEligibility (
    key: Phaser.Input.Keyboard.Key,
    eligibilityState: Object
  ) {
    //Variable declarations
    const { keyCode } = key
    const lastTime = eligibilityState[keyCode]?.lastTime ?? 0
    const currentTime = this.time.now
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

  update (t: number, dt: number) {
    if (!this.player) return
    // Esquerda
    const sideDash = 8600
    const sideRun = 160
    if (!this.cursors?.right?.isDown && this.cursors?.left?.isDown) {
      if (
        this.checkDoubleEligibility(
          this.cursors.left as Phaser.Input.Keyboard.Key,
          this.doublePressEligibility
        )
      ) {
        this.player?.setVelocityX(-sideDash)
      } else {
        this.player?.setVelocityX(-sideRun)
      }
      this.player?.anims.play('left', true)
    } else if (this.cursors?.right?.isDown && !this.cursors?.left?.isDown) {
      if (
        this.checkDoubleEligibility(
          this.cursors.right as Phaser.Input.Keyboard.Key,
          this.doublePressEligibility
        )
      ) {
        this.player?.setVelocityX(sideDash)
      } else {
        this.player?.setVelocityX(sideRun)
      }
      this.player?.anims.play('right', true)
    } else {
      this.player?.setVelocityX(0)
      this.player?.anims.play('turn')
    }

    if (this.cursors?.up?.isDown && this.player?.body.touching.down) {
      this.player.setVelocityY(-330)
    }
  }
}

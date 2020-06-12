import Phaser, { Physics, Time } from 'phaser'
import Preloader from './Preloader'
import { createDudeAnims } from '~/anims/dude/dudeAnims'
import Player from '~/characters/Player'
import { playableControls, debuggableControls } from '~/characters/Controls'
export default class Game extends Phaser.Scene {
  private platforms?: Phaser.Physics.Arcade.StaticGroup
  private player?: Physics.Arcade.Sprite
  private debbugablePlayer?: Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private debbugableCursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super('game')
  }

  preload() {}

  create() {
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

    this.player = new Player(this, 25, 20, 'dude')
    this.debbugablePlayer = new Player(this, 400, 20, 'dude')

    this.platforms.create(50, 250, 'ground')
    this.platforms.create(750, 220, 'ground')
    this.platforms.create(600, 400, 'ground')

    camera.startFollow(this.player, true)

    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.debbugablePlayer, this.platforms)
    this.physics.add.collider(this.debbugablePlayer, this.player)
    this.cursors = this.input.keyboard.addKeys(playableControls)
    this.debbugableCursors = this.input.keyboard.addKeys(debuggableControls)
    this.add.graphics({})
  }
  update(t: number, dt: number) {
    this.player?.update(t, dt, this.cursors)
    this.debbugablePlayer?.update(t, dt, this.debbugableCursors)
  }
}

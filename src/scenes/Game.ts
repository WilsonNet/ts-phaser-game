import Phaser, { Physics } from 'phaser'
import Bullets from '../skills/Bullets'
import Preloader from './Preloader'
import { createDudeAnims } from '~/characters/dude/dudeAnims'
export default class Game extends Phaser.Scene {
  private platforms?: Phaser.Physics.Arcade.StaticGroup
  private player?: Phaser.Physics.Arcade.Sprite
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private stars?: Phaser.Physics.Arcade.Group
  private gameOver = false
  private score = 0
  private scoreText?: Phaser.GameObjects.Text
  private bombs?: Phaser.Physics.Arcade.Group

  constructor () {
    super('game')
  }

  preload () {}

  create () {
    const camera = this.cameras.main
    const bullets = new Bullets(this)
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

    this.platforms.create(50, 250, 'ground')
    this.platforms.create(750, 220, 'ground')
    this.platforms.create(600, 400, 'ground')

    this.player = this.physics.add.sprite(100, 450, 'dude')
    this.player.setBounce(0.2)
    this.player.setCollideWorldBounds(true)

    camera.startFollow(this.player, true)

    this.physics.add.collider(this.player, this.platforms)
    this.cursors = this.input.keyboard.createCursorKeys()
    this.stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
    })
    this.stars.children.iterate(c => {
      const child = c as Phaser.Physics.Arcade.Image
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
    })
    this.physics.add.collider(this.stars, this.platforms)
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.handleCollectStar,
      undefined,
      this
    )

    this.scoreText = this.add.text(16, 16, 'score: 0', {
      fontSize: '32px',
      fill: '#000'
    })

    this.bombs = this.physics.add.group()
    this.physics.add.collider(this.bombs, this.platforms)
    this.physics.add.collider(this.player, this.bombs, this.handleHitBomb)
    const line = new Phaser.Geom.Line()
    const gfx = this.add.graphics().setDefaultStyles({ lineStyle: { width: 10, color: 0xffdd00, alpha: 0.5 } });

    this.input.on('pointermove', pointer => {
      const playerVector = new Phaser.Math.Vector2(
        this.player?.x,
        this.player?.y
      )
      const angle = Phaser.Math.Angle.BetweenPoints(playerVector, pointer)
      Phaser.Geom.Line.SetToAngle(
        line,
        this.player?.x as number,
        this.player?.y as number,
        angle,
        128
      )
      gfx.clear().strokeLineShape(line)

      // bullets.fireBullet(pointer.x, pointer.y)
    })
  }

  private handleHitBomb (
    player: Phaser.GameObjects.GameObject,
    b: Phaser.GameObjects.GameObject
  ) {
    // this.physics.pause();
    this.platforms?.setTint(0xff0000)
    this.player?.anims.play('turns')
    this.gameOver = true
  }

  private handleCollectStar (
    player: Phaser.GameObjects.GameObject,
    s: Phaser.GameObjects.GameObject
  ) {
    const star = s as Phaser.Physics.Arcade.Image
    star.disableBody(true, true)
    this.score += 10
    this.scoreText?.setText(`Score: ${this.score}`)
    if (this.stars?.countActive(true) === 0) {
      this.stars.children.iterate(c => {
        const child = c as Phaser.Physics.Arcade.Image
        child.enableBody(true, child.x, 0, true, true)
      })

      if (this.player) {
        const x =
          this.player.x < 400
            ? Phaser.Math.Between(400, 800)
            : Phaser.Math.Between(0, 400)
        const bomb: Phaser.Physics.Arcade.Image = this.bombs?.create(
          x,
          16,
          'bomb'
        )
        bomb.setBounce(1)
        bomb.setCollideWorldBounds(true)
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20)
      }
    }
  }

  update () {
    if (this.cursors?.left?.isDown) {
      this.player?.setVelocityX(-160)
      this.player?.anims.play('left', true)
    } else if (this.cursors?.right?.isDown) {
      this.player?.setVelocityX(160)
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

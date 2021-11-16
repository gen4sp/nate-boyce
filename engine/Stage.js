import * as PIXI from 'pixi.js'

export default class Stage {
  constructor(width, height, drawLoop) {
    this.app = new PIXI.Application({
      antialias: true,
      width, // window.innerWidth,
      height,
      backgroundColor: 0x000000,
      resolution: 1
    })

    this.app.stage.interactive = true
    this.app.stage.hitArea = this.app.renderer.screen
    this.app.ticker.add(drawLoop)
  }

  getNewCtx() {
    const graphics = new PIXI.Graphics()
    this.app.stage.addChild(graphics)
    return graphics
  }

  getGraphicsCanvas() {
    const extract = this.app.renderer.plugins.extract
    return extract.canvas()
  }
}

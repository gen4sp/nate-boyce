import * as PIXI from 'pixi.js'
export default class Stage {
  constructor(width, height, drawLoop) {
    // this.app = new PIXI.Application({
    //   antialias: false,
    //   width, // window.innerWidth,
    //   height,
    //   backgroundColor: 0x000000,
    //   resolution: 3
    // })

    // eslint-disable-next-line new-cap
    const renderer = new PIXI.autoDetectRenderer(width, height)
    document.body.appendChild(renderer.view)
    this.app.stage.interactive = true
    this.app.stage.hitArea = this.app.renderer.screen
    this.app.ticker.add(drawLoop)
  }

  getNewCtx() {
    const graphics = new PIXI.Graphics()
    this.app.stage.addChild(graphics)
    return graphics
  }
}

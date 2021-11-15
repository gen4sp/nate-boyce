import Stats from 'stats.js'
// import * as PIXI from 'pixi.js'
// import randomcolor from 'randomcolor'
// import _ from 'lodash'
import Stage from './Stage'
import Fluid from './Fluid'

const width = 600
const height = 400
const stats = new Stats()
let fluid = null
let stage = null
let ctx = null
function init() {
  stage = new Stage(width, height, draw)
  ctx = stage.getNewCtx()
  fluid = new Fluid(width, height, ctx)
  // fluid.init()
  //   stage.renderer.plugins.interaction.on('pointerdown', onPointerDown);
  //   stage.app.stage.addEventListener('click', (e) => onPointerDown(e))
  // pointermove
  stage.app.renderer.plugins.interaction.on('pointerdown', (e) =>
    onPointerDown(e)
  )
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stage.app.view)
  document.body.appendChild(stats.dom)
}
function draw(delta) {
  stats.begin()
  ctx.clear()
  fluid.draw(ctx)
  stats.end()
}

function onPointerDown(e) {
  console.log(e.data.global)
  // const { x, y } = e.data.global
  // fluid.highlight(Math.round(x), Math.round(y))
  // fluid.tick()
}

init()

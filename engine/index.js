import Stats from 'stats.js'
// import * as PIXI from 'pixi.js'
// import randomcolor from 'randomcolor'
// import _ from 'lodash'
import Stage from './Stage'
import Field from './Field'

const width = 300
const height = 200
const stats = new Stats()
let field = null
let stage = null
let ctx = null
function init() {
  stage = new Stage(width, height, draw)
  ctx = stage.getNewCtx()
  field = new Field(width, height, ctx)
  field.init()
  //   stage.renderer.plugins.interaction.on('pointerdown', onPointerDown);
  //   stage.app.stage.addEventListener('click', (e) => onPointerDown(e))
  // pointermove
  stage.app.renderer.plugins.interaction.on('pointerdown', (e) =>
    onPointerDown(e)
  )
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)
}
function draw(delta) {
  stats.begin()
  ctx.clear()
  field.draw(ctx)
  stats.end()
}

function onPointerDown(e) {
  console.log(e.data.global)
  // const { x, y } = e.data.global
  // field.highlight(Math.round(x), Math.round(y))
  field.tick()
}

init()

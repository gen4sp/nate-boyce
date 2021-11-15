// import _ from 'lodash'
import * as PIXI from 'pixi.js'
// import { BlurFilter } from '@pixi/filter-blur'
import shaderCodeFrag from './shaders/texture.glsl'
import shaderCodeVert from './shaders/vert.glsl'

class Fluid {
  constructor(width, height, ctx) {
    this.width = width
    this.height = height
    this.ctx = ctx
  }

  init(texture) {
    console.log('init...', texture)
    this.shader = new PIXI.Filter(shaderCodeVert, shaderCodeFrag, {
      uTime: 0.0,
      uResolution: new PIXI.Point(this.width, this.height),
      uSampler2: texture
    })
    this.ctx.filters = [this.shader]
  }

  draw(ctx) {
    ctx.beginFill(0x3fa93e, 1)
    ctx.lineStyle(0)
    ctx.drawRect(0, 0, this.width, this.height)
    ctx.endFill()
    this.shader.uniforms.uTime += 0.03
  }
}
export default Fluid

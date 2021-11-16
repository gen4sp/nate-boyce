// import _ from 'lodash'
import * as PIXI from 'pixi.js'
// import { BlurFilter } from '@pixi/filter-blur'
import shaderCodeFrag from './shaders/texture.glsl'
import shaderCodeVert from './shaders/vert.glsl'
// import fluidVert from './shaders/fluid/fluid.vert'
// import SHADERS from './shaders/fluid'

// console.log('fv', fluidVert)
const config = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  CAPTURE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 1,
  VELOCITY_DISSIPATION: 0.2,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 30,
  SPLAT_RADIUS: 0.25,
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLORFUL: true,
  COLOR_UPDATE_SPEED: 10,
  PAUSED: false,
  BACK_COLOR: { r: 0, g: 0, b: 0 },
  TRANSPARENT: false,
  BLOOM: true,
  BLOOM_ITERATIONS: 8,
  BLOOM_RESOLUTION: 256,
  BLOOM_INTENSITY: 0.8,
  BLOOM_THRESHOLD: 0.6,
  BLOOM_SOFT_KNEE: 0.7,
  SUNRAYS: true,
  SUNRAYS_RESOLUTION: 196,
  SUNRAYS_WEIGHT: 1.0
}
function PointerPrototype() {
  this.id = -1
  this.texcoordX = 0
  this.texcoordY = 0
  this.prevTexcoordX = 0
  this.prevTexcoordY = 0
  this.deltaX = 0
  this.deltaY = 0
  this.down = false
  this.moved = false
  this.color = [30, 0, 300]
}
const pointers = []
// const splatStack = []
pointers.push(new PointerPrototype())

class Fluid {
  constructor(width, height, ctx, ext) {
    this.width = width
    this.height = height
    this.ctx = ctx
    console.log('ext', ext)
    if (!ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 512
      config.SHADING = false
      config.BLOOM = false
      config.SUNRAYS = false
    }
  }

  createShaders() {
    // const ditheringTexture = createTextureAsync('LDR_LLL1_0.png')
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

// import _ from 'lodash'
import * as PIXI from 'pixi.js'
// import { BlurFilter } from '@pixi/filter-blur'
import shaderCode from './shaders/test.glsl'

const uniforms = {}
uniforms.time = {
  type: 'f',
  value: 10
}

class Fluid {
  constructor(width, height, ctx) {
    // this.objects = []
    // this.objectsById = {}
    this.width = width
    this.height = height
    this.ctx = ctx
    // const resources = PIXI.Loader.shared.resources
    const simpleShader = new PIXI.Filter(undefined, shaderCode, uniforms)
    // const simpleShader = new PIXI.Shader(shaderCode, uniforms)
    this.ctx.filters = [simpleShader]
    console.log(simpleShader)
    // this.ctx.filters = [new BlurFilter()]
    // this._selectedObject = null
  }

  init() {
    console.log('init...')
  }

  tick() {
    console.log('tick')
    console.log('tack')
  }

  draw(ctx) {
    // _.each(this.objects, (object) => {
    //   object.draw(ctx)
    // })
    // console.log('draw')
    ctx.beginFill(0x3fa93e, 1)
    ctx.lineStyle(0)
    ctx.drawRect(0, 0, this.width, this.height)
    ctx.endFill()
  }

  // serialize() {
  //   return {
  //     objects: _.map(this.objects, (n) => n.serialize())
  //   }
  // }

  // deserialize(field) {
  //   _.each(field.objects, (o) => {
  //     const n = new Neuron(o.x, o.y)
  //     this.add(n, this.ctx)
  //   })
  //   _.each(field.objects, (o) => {
  //     const target = this.objectsById[o.id]
  //     target.connected = _.map(o.connected, (id) => this.objectsById[id])
  //   })
  // }
}
export default Fluid

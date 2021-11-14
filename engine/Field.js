import _ from 'lodash'
import storage from '../helpers/storage'

import { getObjectId } from '../helpers/object'
import Neuron from './Neuron'
// import Flower from './flowers/Flower'
// import { RENDERS } from './flowers/FlowerPart'
const forceNewField = false
const CONNECTED_POWER_TRESHOLD = 0.7
const FIREDCHANCE = 1
class ObjectManager {
  constructor(width, height, ctx) {
    this.objects = []
    this.objectsById = {}
    this.width = width
    this.height = height
    this.ctx = ctx

    this._selectedObject = null
  }

  init() {
    console.log('init...')
    this.loadField().then(() => {
      console.log('field loaded...')
      console.log('all connected...')
      // this.objects[11111].setMode('on')
      console.log('field initialization done...')
      _.each(this.objectsById['151x100'].connected, (n) => {
        n.on()
      })
    })
    // this.tick()
  }

  tick() {
    console.log('tick')

    _.each(this.objects, (o) => {
      if (o.connected.length) {
        const sum = _.reduce(
          o.connected,
          (t, n) => {
            return t + n.power
          },
          0
        )
        const p = sum / o.connected.length
        if (p > CONNECTED_POWER_TRESHOLD) {
          if (o.stable) {
            o.on()
          } else if (Math.random() < FIREDCHANCE) {
            o.on()
            o.stable = true
          }
        }
      }
    })
    _.each(this.objects, (o) => {
      o.tick()
    })
    console.log('tack')
    // setTimeout(() => this.tick(), 1000)
  }

  async loadField() {
    const field = await storage.loadField()
    if (field && !forceNewField) {
      this.deserialize(field)
    } else {
      console.log('Field Generation...')
      this.generateObjects()
      _.each(this.objects, (n) => {
        this.objectsById[n.id] = n
        console.log('connecting neurons')
        this.setConnected(n, 4, 0.3)
      })
      console.log('Field has been generated...')
      await storage.saveField(this.serialize())
    }
  }

  highlight(x, y) {
    if (this._selectedObject) this._selectedObject.highlight(false)
    this._selectedObject = this.objectsById[getObjectId(x, y)]
    this._selectedObject.highlight(true)
    console.log(this._selectedObject)
  }

  generateObjects() {
    console.log('creating neurons...', this.width, this.height)
    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        this.add(new Neuron(i, j), this.ctx)
      }
    }
    console.log('neurons have been created')
  }

  setConnected(neuron, size, density) {
    const allneighbours = _.filter(this.objects, (n) => {
      return (
        n.x >= neuron.x - size &&
        n.x <= neuron.x + size &&
        n.y >= neuron.y - size &&
        n.y <= neuron.y + size &&
        n !== neuron
      )
    })
    const selectedNeighbours = _.sampleSize(
      allneighbours,
      Math.round(allneighbours.length * density)
    )
    neuron.setConnected(selectedNeighbours)
  }

  add(object) {
    this.objects.push(object)
    this.objectsById[object.id] = object
  }

  draw(ctx) {
    _.each(this.objects, (object) => {
      object.draw(ctx)
    })
  }

  serialize() {
    return {
      objects: _.map(this.objects, (n) => n.serialize())
    }
  }

  deserialize(field) {
    _.each(field.objects, (o) => {
      const n = new Neuron(o.x, o.y)
      this.add(n, this.ctx)
    })
    _.each(field.objects, (o) => {
      const target = this.objectsById[o.id]
      target.connected = _.map(o.connected, (id) => this.objectsById[id])
    })
  }
}
export default ObjectManager

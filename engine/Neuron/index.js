import _ from 'lodash'
import { getObjectId } from '../../helpers/object'
const modes = {
  off: 0x000000,
  on: 0xf72585,
  connected: 0x4361ee,
  cool: 0x0000ff
}
class Neuron {
  constructor(x, y) {
    this.id = getObjectId(x, y)
    this.x = x
    this.y = y
    this.mode = 'off'
    this.power = 0
    this.connected = []
    this.cooldown = 0
  }

  on() {
    if (this.cooldown > 0) return
    this.mode = 'on'
    this.power = 1
    this.cooldown = 5
  }

  setMode(mode) {
    this.mode = mode
  }

  setConnected(neurons) {
    this.connected = neurons
  }

  tick() {
    if (this.mode === 'on') {
      this.setMode('cool')
      this.cooldown--
    } else if (this.mode === 'cool') {
      this.cooldown--
      if (this.cooldown <= 0) {
        this.setMode('off')
      }
    }
  }

  draw(ctx) {
    ctx.beginFill(modes[this.mode], this.power)
    ctx.lineStyle(0)
    ctx.drawRect(this.x, this.y, 1, 1)
    ctx.endFill()
  }

  highlight(isOn) {
    if (isOn) {
      _.each(this.connected, (n) => {
        n.setMode('connected')
      })
      this.setMode('on')
    } else {
      _.each(this.connected, (n) => {
        n.setMode('off')
      })
      this.setMode('off')
    }
  }

  serialize() {
    const obj = { ...this, connected: _.map(this.connected, (n) => n.id) }
    return obj
  }
}

export default Neuron

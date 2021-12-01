import { GUI } from 'three/examples/jsm/libs/dat.gui.module'

const fluidParams = {
  whiterBright: 1
}
const gui = new GUI()
const fluidFolder = gui.addFolder('Fluid Distortion')

fluidFolder.open()
function add({ label, min, max, defaultValue, onChange, step }) {
  fluidParams[label] = defaultValue
  fluidFolder.add(fluidParams, label, min, max, step || 0.05).onChange(() => {
    onChange(fluidParams[label])
  })
  onChange(fluidParams[label])
}
export default {
  add
}

import { GUI } from 'three/examples/jsm/libs/dat.gui.module'

const fluidParams = {
  whiterBright: 1
}
const gui = new GUI()
const fluidFolder = gui.addFolder('Fluid Distortion')
// fluidFolder.add(fluidParams, 'whiterBright', 0, 1)
// .step(1)
// fluidFolder.add(fluidParams, 'densityDissipation', 0, 0.1)
// fluidFolder.add(fluidParams, 'velocityDissipation', 0, 2)
// fluidFolder.add(fluidParams, 'pressureDissipation', 0, 2)
// fluidFolder.add(fluidParams, 'radius', 0, 2)
fluidFolder.open()
function add({ label, min, max, defaultValue, onChange }) {
  // const id = 'pr_'+Math.random()*999999
  fluidParams[label] = defaultValue
  fluidFolder.add(fluidParams, label, min, max).onChange(() => {
    onChange(fluidParams[label])
  })
}
export default {
  add
}

// fluidFolder.add(fluidParams, 'curlStrength', 0, 100).step(1)

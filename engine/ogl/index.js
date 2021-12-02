import { Renderer, Camera, TextureLoader, Post, Vec2 } from 'ogl-nuxt'
import _ from 'lodash'
import ProgramManager from './programs'
import GUI from './gui'
const iterations = 3
const densityDissipation = 0.97
const velocityDissipation = 0.98
const pressureDissipation = 0.8
const splatsQty = 12
let splatPower = 1
const debug = false
// const radius = 1.8
const simRes = 128
const dyeRes = 512
const flashLength = 3000
let nextAddMapTrigger = 0.7

const texelSize = { value: new Vec2(1 / simRes) }
function init(drawStartCallback, drawStopCallback) {
  const renderer = new Renderer({ dpr: 2 })
  const gl = renderer.gl
  const post = new Post(gl)
  const baseTexture = TextureLoader.load(gl, { src: 'images/cryo.png' })
  const additionalTextures = [
    TextureLoader.load(gl, { src: 'images/princess.png' }),
    TextureLoader.load(gl, { src: 'images/room.png' })
  ]
  const programManager = new ProgramManager({
    gl,
    renderer,
    simRes,
    dyeRes,
    texelSize,
    pressureDissipation,
    post,
    baseTexture
  })

  document.body.appendChild(gl.canvas)
  gl.clearColor(1, 1, 1, 1)

  const camera = new Camera(gl, { fov: 35 })
  camera.position.set(0, 1, 5)
  camera.lookAt([0, 0, 0])

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height })
    post.resize()
  }
  window.addEventListener('resize', resize, false)
  resize()

  let splats = []
  function getSplats() {
    splats = []
    const strengh = 3
    for (let i = 0; i < splatsQty; i++) {
      splats.push({
        // Get mouse value in 0 to 1 range, with y flipped
        x: Math.random(),
        y: Math.random(),
        dx: Math.random() * strengh * 2 - strengh,
        dy: Math.random() * strengh * 2 - strengh
      })
    }
  }

  function initGUI() {
    // GUI.add({
    //   label: 'whiterBright',
    //   min: 0,
    //   max: 1,
    //   defaultValue: 1,
    //   onChange: (v) => {
    //     programManager.pass.uniforms.uBright.value = v
    //   }
    // })
    GUI.add({
      label: 'showFluid',
      defaultValue: debug,
      onChange: (v) => {
        programManager.displacementProgram.program.uniforms.tDebug.value = v
      }
    })
    GUI.add({
      label: 'densityDissipation',
      min: 0,
      max: 2,
      defaultValue: densityDissipation,
      onChange: (v) => {
        programManager.advectionProgram.program.uniforms.dissipation.value = v
      }
    })
    GUI.add({
      label: 'velocityDissipation',
      min: 0,
      max: 2,
      defaultValue: velocityDissipation,
      onChange: (v) => {
        programManager.advectionProgram.program.uniforms.dissipation.value = v
      }
    })
    GUI.add({
      label: 'pressureDissipation',
      min: 0,
      max: 2,
      defaultValue: pressureDissipation,
      onChange: (v) => {
        programManager.clearProgram.program.uniforms.value.value = v
      }
    })
    GUI.add({
      label: 'radius',
      min: 0,
      max: 4,
      defaultValue: 1.8,
      onChange: (v) => {
        programManager.splatProgram.program.uniforms.radius.value = v / 100.0
      }
    })
    GUI.add({
      label: 'mix',
      min: 0.8,
      max: 1,
      defaultValue: 1,
      step: 0.001,
      onChange: (v) => {
        programManager.displacementProgram.program.uniforms.tMix.value = v
      }
    })
  }

  // Function to draw number of interactions onto input render target
  function splat({ x, y, dx, dy }) {
    programManager.splatProgram.program.uniforms.uTarget.value =
      programManager.velocity.read.texture
    programManager.splatProgram.program.uniforms.aspectRatio.value =
      gl.renderer.width / gl.renderer.height
    programManager.splatProgram.program.uniforms.point.value.set(x, y)
    programManager.splatProgram.program.uniforms.color.value.set(
      dx * splatPower,
      dy * splatPower,
      0.0
    )
    // programManager.splatProgram.program.uniforms.radius.value = 1.5 / 100.0

    gl.renderer.render({
      scene: programManager.splatProgram,
      target: programManager.velocity.write,
      sort: false,
      update: false
    })
    programManager.velocity.swap()

    programManager.splatProgram.program.uniforms.uTarget.value =
      programManager.density.read.texture

    gl.renderer.render({
      scene: programManager.splatProgram,
      target: programManager.density.write,
      sort: false,
      update: false
    })
    programManager.density.swap()
  }

  initGUI()
  getSplats()
  requestAnimationFrame(update)

  function update(t) {
    drawStartCallback()
    requestAnimationFrame(update)

    // Perform all of the fluid simulation renders
    // No need to clear during sim, saving a number of GL calls.
    gl.renderer.autoClear = false

    // Render all of the inputs since last frame
    for (let i = splats.length - 1; i >= 0; i--) {
      // splat(splats.splice(i, 1)[0])
      splat(splats[i])
    }

    programManager.curlProgram.program.uniforms.uVelocity.value =
      programManager.velocity.read.texture

    gl.renderer.render({
      scene: programManager.curlProgram,
      target: programManager.curl,
      sort: false,
      update: false
    })

    programManager.vorticityProgram.program.uniforms.uVelocity.value =
      programManager.velocity.read.texture
    programManager.vorticityProgram.program.uniforms.uCurl.value =
      programManager.curl.texture

    gl.renderer.render({
      scene: programManager.vorticityProgram,
      target: programManager.velocity.write,
      sort: false,
      update: false
    })
    programManager.velocity.swap()

    programManager.divergenceProgram.program.uniforms.uVelocity.value =
      programManager.velocity.read.texture

    gl.renderer.render({
      scene: programManager.divergenceProgram,
      target: programManager.divergence,
      sort: false,
      update: false
    })

    programManager.clearProgram.program.uniforms.uTexture.value =
      programManager.pressure.read.texture
    programManager.clearProgram.program.uniforms.value.value =
      pressureDissipation

    gl.renderer.render({
      scene: programManager.clearProgram,
      target: programManager.pressure.write,
      sort: false,
      update: false
    })
    programManager.pressure.swap()

    programManager.pressureProgram.program.uniforms.uDivergence.value =
      programManager.divergence.texture

    for (let i = 0; i < iterations; i++) {
      programManager.pressureProgram.program.uniforms.uPressure.value =
        programManager.pressure.read.texture

      gl.renderer.render({
        scene: programManager.pressureProgram,
        target: programManager.pressure.write,
        sort: false,
        update: false
      })
      programManager.pressure.swap()
    }

    programManager.gradienSubtractProgram.program.uniforms.uPressure.value =
      programManager.pressure.read.texture
    programManager.gradienSubtractProgram.program.uniforms.uVelocity.value =
      programManager.velocity.read.texture

    gl.renderer.render({
      scene: programManager.gradienSubtractProgram,
      target: programManager.velocity.write,
      sort: false,
      update: false
    })
    programManager.velocity.swap()

    programManager.advectionProgram.program.uniforms.dyeTexelSize.value.set(
      1 / simRes
    )
    programManager.advectionProgram.program.uniforms.uVelocity.value =
      programManager.velocity.read.texture
    programManager.advectionProgram.program.uniforms.uSource.value =
      programManager.velocity.read.texture
    programManager.advectionProgram.program.uniforms.dissipation.value =
      velocityDissipation

    gl.renderer.render({
      scene: programManager.advectionProgram,
      target: programManager.velocity.write,
      sort: false,
      update: false
    })
    programManager.velocity.swap()

    programManager.advectionProgram.program.uniforms.dyeTexelSize.value.set(
      1 / dyeRes
    )
    programManager.advectionProgram.program.uniforms.uVelocity.value =
      programManager.velocity.read.texture
    programManager.advectionProgram.program.uniforms.uSource.value =
      programManager.density.read.texture
    programManager.advectionProgram.program.uniforms.dissipation.value =
      densityDissipation

    gl.renderer.render({
      scene: programManager.advectionProgram,
      target: programManager.density.write,
      sort: false,
      update: false
    })
    programManager.density.swap()

    //  - - - - - - - - - Final render
    programManager.displacementProgram.program.uniforms.tFluid.value =
      programManager.density.read.texture

    // -- add
    const flashTriger = (t % flashLength) / flashLength
    programManager.finalRenderProgram.uniforms.uAddMap.value =
      programManager.targetFinalBuffer.read.texture
    if (!nextAddMapTrigger || nextAddMapTrigger > flashTriger) {
      nextAddMapTrigger = Math.random() * 0.9
      const chanceToShow = Math.random() > 0.3
      console.log('>chanceToShow', chanceToShow)
      if (chanceToShow) {
        const texture = _.sample(additionalTextures)
        programManager.finalRenderProgram.uniforms.uAddMap.value = texture
        console.log('T ', texture)
      }
    }
    // ----
    gl.renderer.render({
      scene: programManager.displacementProgram,
      target: programManager.targetFinalBuffer.write,
      sort: false,
      update: false
    })
    programManager.targetFinalBuffer.swap()
    programManager.displacementProgram.program.uniforms.tMap.value =
      programManager.targetFinalBuffer.read.texture

    programManager.finalRenderProgram.uniforms.uSampler.value =
      programManager.targetFinalBuffer.read.texture
    programManager.pass.uniforms.tMap =
      programManager.targetFinalBuffer.read.texture
    // - - -- -
    // Set clear back to default

    // Update post pass uniform with the simulation output

    splatPower = Math.sin(flashTriger * Math.PI)

    if (flashTriger < 0.01) {
      programManager.displacementProgram.program.uniforms.tMap.value =
        baseTexture
      getSplats()
    }

    programManager.pass.uniforms.uWhiter.value = 1 - flashTriger
    gl.renderer.autoClear = true
    // Replace Renderer.render with post.render. Use the same arguments.
    post.render({ scene: programManager.scene, camera })

    drawStopCallback()
  }
}
export default {
  init
}

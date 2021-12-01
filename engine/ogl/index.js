import { Renderer, Camera, TextureLoader, Post, Vec2 } from 'ogl-nuxt'
import ProgramManager from './programs'
const iterations = 4
const densityDissipation = 0.99
const velocityDissipation = 0.9
const pressureDissipation = 0.99

const radius = 1.8
const simRes = 128
const dyeRes = 512

const texelSize = { value: new Vec2(1 / simRes) }
function init(drawStartCallback, drawStopCallback) {
  const renderer = new Renderer({ dpr: 2 })
  const gl = renderer.gl
  const post = new Post(gl)
  const baseTexture = TextureLoader.load(gl, { src: 'images/cryo.png' })
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

  const splats = []
  function getSplats() {
    // splats = []
    const strengh = 1000
    for (let i = 0; i < 5; i++) {
      splats.push({
        // Get mouse value in 0 to 1 range, with y flipped
        x: Math.random(),
        y: Math.random(),
        dx: Math.random() * strengh * 2 - strengh,
        dy: Math.random() * strengh * 2 - strengh
      })
    }
  }

  // Function to draw number of interactions onto input render target
  function splat({ x, y, dx, dy }) {
    programManager.splatProgram.program.uniforms.uTarget.value =
      programManager.velocity.read.texture
    programManager.splatProgram.program.uniforms.aspectRatio.value =
      gl.renderer.width / gl.renderer.height
    programManager.splatProgram.program.uniforms.point.value.set(x, y)
    programManager.splatProgram.program.uniforms.color.value.set(dx, dy, 1.0)
    programManager.splatProgram.program.uniforms.radius.value = radius / 100.0

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

  requestAnimationFrame(update)
  function update(t) {
    drawStartCallback()
    requestAnimationFrame(update)

    // Perform all of the fluid simulation renders
    // No need to clear during sim, saving a number of GL calls.
    gl.renderer.autoClear = false

    // Render all of the inputs since last frame
    for (let i = splats.length - 1; i >= 0; i--) {
      splat(splats.splice(i, 1)[0])
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

    //  - - - - - - - - - My attept
    gl.renderer.render({
      scene: programManager.displacementProgram,
      target: programManager.targetFinalBuffer.write,
      sort: false,
      update: false
    })
    programManager.targetFinalBuffer.swap()
    programManager.finalRenderProgram.uniforms.uSampler.value =
      programManager.targetFinalBuffer.read.texture
    // - - -- -
    // Set clear back to default

    gl.renderer.autoClear = true

    // Update post pass uniform with the simulation output

    programManager.pass.uniforms.tFluid.value =
      programManager.density.read.texture

    const flashTriger = (t % 3000) / 3000
    if (flashTriger < 0.01) {
      programManager.finalRenderProgram.uniforms.uSampler.value = baseTexture
      getSplats()
    }
    // pass.uniforms.uTime.value = 1 - flashTriger

    programManager.pass.uniforms.uWhiter.value = 1 - flashTriger

    // Replace Renderer.render with post.render. Use the same arguments.
    post.render({ scene: programManager.scene, camera })
    post.render({
      scene: programManager.scene,
      camera,
      target: programManager.targetFinalBuffer.write,
      sort: false,
      update: false
    })
    programManager.targetFinalBuffer.swap()
    if (t > 2500) {
      programManager.finalRenderProgram.uniforms.uSampler.value =
        programManager.targetFinalBuffer.read.texture
    }

    drawStopCallback()
  }
}
export default {
  init
}

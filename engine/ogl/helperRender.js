import {
  Renderer,
  Camera,
  //   RenderTarget,
  Geometry,
  Program,
  // Texture,
  //   TextureLoader,
  Mesh,
  Color
  //   Vec2
  // Box,
  // Triangle,
  // NormalProgram,
  // Post
} from 'ogl-nuxt'
const frg = /* glsl */ `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;

uniform sampler2D uSampler;

void main(void) {
    gl_FragColor = vec4(1.0,texture2D(uSampler, vUv).yz,1.0);
}
            `
const vrtx = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main () {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
    }
`
export default class HelperRender {
  constructor(x, y, w, h, vertex, fragment, rtOptions, baseTexture) {
    const renderer = new Renderer({ dpr: 2 })
    const gl = renderer.gl
    // this.rgba = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloat)
    const triangle = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
    })
    gl.canvas.width = w
    gl.canvas.height = h
    gl.canvas.style.zIndex = 8
    gl.canvas.style.position = 'absolute'
    gl.canvas.style.border = '1px solid'
    gl.canvas.style.top = `${x}px`
    gl.canvas.style.left = `${y}px`

    document.body.appendChild(gl.canvas)
    const camera = new Camera(gl, { fov: 35 })
    camera.position.set(0, 1, 5)
    camera.lookAt([0, 0, 0])
    // renderer.setSize(w, h)
    renderer.setSize(w, h)
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height })
    const program = new Program(gl, {
      vertex: vrtx,
      fragment: frg,
      uniforms: {
        uSampler: { value: baseTexture },
        uTime: { value: 0 },
        uColor: { value: new Color(0.3, 0.2, 0.5) }
        // uSampler: { value: curl.texture }
      }
    })
    const mesh = new Mesh(gl, {
      geometry: triangle,
      program
    })
    this.gl = gl
    this.renderer = renderer
    this.mesh = mesh
    this.program = program
    this.camera = camera

    this.i = 0
  }

  redraw(texture) {
    // gl.renderer.autoClear = false
    // console.log(texture)
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture)
    this.program.uniforms.uSampler.value = texture
    // this.program.uniforms.uTime.value = this.i += 0.01

    this.renderer.render({ scene: this.mesh, camera: this.camera })
  }
}

import { RenderTarget, Geometry, Program, Mesh, Color, Vec2 } from 'ogl-nuxt'
import SHADERS from './shaders'
import GlHelpers from './glHelpers'
const curlStrength = 50
// Resolution of simulation

class ProgramManager {
  constructor(gl, renderer, simRes, dyeRes, texelSize, pressureDissipation) {
    this.gl = gl
    // Create fluid simulation FBOs
    const { halfFloat, createDoubleFBO, supportLinearFiltering, rgba, rg, r } =
      GlHelpers(gl)

    const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST
    this.density = createDoubleFBO(gl, {
      width: dyeRes,
      height: dyeRes,
      type: halfFloat,
      format: rgba?.format,
      internalFormat: rgba?.internalFormat,
      minFilter: filtering,
      depth: false
    })

    this.velocity = createDoubleFBO(gl, {
      width: simRes,
      height: simRes,
      type: halfFloat,
      format: rg?.format,
      internalFormat: rg?.internalFormat,
      minFilter: filtering,
      depth: false
    })

    this.pressure = createDoubleFBO(gl, {
      width: simRes,
      height: simRes,
      type: halfFloat,
      format: r?.format,
      internalFormat: r?.internalFormat,
      minFilter: gl.NEAREST,
      depth: false
    })

    this.divergence = new RenderTarget(gl, {
      width: simRes,
      height: simRes,
      type: halfFloat,
      format: r?.format,
      internalFormat: r?.internalFormat,
      minFilter: gl.NEAREST,
      depth: false
    })

    this.curl = new RenderTarget(gl, {
      width: simRes,
      height: simRes,
      type: halfFloat,
      format: r?.format,
      internalFormat: r?.internalFormat,
      minFilter: gl.NEAREST,
      depth: false
    })
    // const targetFinalBuffer = new RenderTarget(gl, {
    //   width: window.innerWidth,
    //   height: window.innerHeight,
    //   type: halfFloat,
    //   format: rgba?.format,
    //   internalFormat: rgba?.internalFormat,
    //   minFilter: filtering,
    //   depth: false
    // })
    this.targetFinalBuffer = createDoubleFBO(gl, {
      width: renderer.width,
      height: renderer.height
    })

    const triangle = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
    })
    this.triangle = triangle

    this.clearProgram = new Mesh(this.gl, {
      geometry: triangle,
      program: new Program(gl, {
        vertex: SHADERS.baseVertex,
        fragment: SHADERS.clearShader,
        uniforms: {
          texelSize,
          uTexture: { value: null },
          value: { value: pressureDissipation }
        },
        depthTest: false,
        depthWrite: false
      })
    })

    this.splatProgram = new Mesh(this.gl, {
      geometry: triangle,
      program: new Program(gl, {
        vertex: SHADERS.baseVertex,
        fragment: SHADERS.splatShader,
        uniforms: {
          texelSize,
          uTarget: { value: null },
          aspectRatio: { value: 1 },
          color: { value: new Color() },
          point: { value: new Vec2() },
          radius: { value: 1 }
        },
        depthTest: false,
        depthWrite: false
      })
    })

    this.advectionProgram = new Mesh(this.gl, {
      geometry: triangle,
      program: new Program(gl, {
        vertex: SHADERS.baseVertex,
        fragment: supportLinearFiltering
          ? SHADERS.advectionShader
          : SHADERS.advectionManualFilteringShader,
        uniforms: {
          texelSize,
          dyeTexelSize: { value: new Vec2(1 / dyeRes, 1 / dyeRes) },
          uVelocity: { value: null },
          uSource: { value: null },
          dt: { value: 0.06 },
          dissipation: { value: 0.01 }
        },
        depthTest: false,
        depthWrite: false
      })
    })

    this.divergenceProgram = new Mesh(this.gl, {
      geometry: triangle,
      program: new Program(gl, {
        vertex: SHADERS.baseVertex,
        fragment: SHADERS.divergenceShader,
        uniforms: {
          texelSize,
          uVelocity: { value: null }
        },
        depthTest: false,
        depthWrite: false
      })
    })

    this.curlProgram = new Mesh(this.gl, {
      geometry: triangle,
      program: new Program(gl, {
        vertex: SHADERS.baseVertex,
        fragment: SHADERS.curlShader,
        uniforms: {
          texelSize,
          uVelocity: { value: null }
        },
        depthTest: false,
        depthWrite: false
      })
    })

    this.vorticityProgram = new Mesh(this.gl, {
      geometry: triangle,
      program: new Program(gl, {
        vertex: SHADERS.baseVertex,
        fragment: SHADERS.vorticityShader,
        uniforms: {
          texelSize,
          uVelocity: { value: null },
          uCurl: { value: null },
          curl: { value: curlStrength },
          dt: { value: 0.016 }
        },
        depthTest: false,
        depthWrite: false
      })
    })

    this.pressureProgram = new Mesh(this.gl, {
      geometry: triangle,
      program: new Program(gl, {
        vertex: SHADERS.baseVertex,
        fragment: SHADERS.pressureShader,
        uniforms: {
          texelSize,
          uPressure: { value: null },
          uDivergence: { value: null }
        },
        depthTest: false,
        depthWrite: false
      })
    })

    this.gradienSubtractProgram = new Mesh(this.gl, {
      geometry: triangle,
      program: new Program(gl, {
        vertex: SHADERS.baseVertex,
        fragment: SHADERS.gradientSubtractShader,
        uniforms: {
          texelSize,
          uPressure: { value: null },
          uVelocity: { value: null }
        },
        depthTest: false,
        depthWrite: false
      })
    })
  }
}

export default ProgramManager

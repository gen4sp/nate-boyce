import {
  Renderer,
  Camera,
  RenderTarget,
  Geometry,
  Program,
  // Texture,
  TextureLoader,
  Mesh,
  Color,
  Transform,
  Vec2,
  // Box,
  // Triangle,
  // NormalProgram,
  Post
} from 'ogl-nuxt'

// const tvertex = /* glsl */ `
// precision highp float;
// attribute vec4 aVertexPosition;
// attribute vec2 aTextureCoord;

// uniform mat4 uModelViewMatrix;
// uniform mat4 uProjectionMatrix;

// varying highp vec2 vTextureCoord;

// void main(void) {
//   gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
//   vTextureCoord = aTextureCoord;
// } `

const tfragment = /* glsl */ `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vUv);
}
            `
const fragment = /* glsl */ `
    precision highp float;
    uniform sampler2D tMap;
    uniform sampler2D tFluid;
    uniform float uTime;
    uniform float uWhiter;
    varying vec2 vUv;
    void main() {
        vec3 fluid = texture2D(tFluid, vUv).rgb;
        // float bright = 0.5 * (fluid.r + fluid.g);
        // float tresholdr = mix(0.0, fluid.r, step(0.5, bright));
        // float tresholdg = mix(0.0, fluid.g, step(0.5, bright));
        // vec2 ft = vec2(tresholdr, tresholdg);
        vec2 uv = vUv - fluid.rg * 0.0002;
        //gl_FragColor = mix( texture2D(tMap, uv), vec4(fluid * 0.1 + 0.5, 1), step(0.5, vUv.x) ) ;
        //gl_FragColor = mix( texture2D(tMap, uv), vec4(fluid, 1), step(0.5, vUv.x) ) ;
        
        // Oscillate between fluid values and the distorted scene
         //gl_FragColor = mix(texture2D(tMap, uv), vec4(fluid * 0.1 + 0.5, 1), smoothstep(0.0, 0.7, sin(uTime)));
         gl_FragColor = mix(texture2D(tMap, uv), vec4(1,1,1, 1), smoothstep(0.5, 1.0, uTime));
         //gl_FragColor = texture2D(tMap, vUv);
    }
`
const baseVertex2 = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main () {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
    }
`
const baseVertex = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;
    void main () {
        vUv = uv;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(position, 0, 1);
    }
`

const clearShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`

const splatShader = /* glsl */ `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`

const advectionManualFilteringShader = /* glsl */ `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;
    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);
        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }
    void main () {
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
        gl_FragColor.a = 1.0;
    }
`

const advectionShader = /* glsl */ `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;
    void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
        gl_FragColor.a = 1.0;
    }
`

const divergenceShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`

const curlShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`

const vorticityShader = /* glsl */ `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }
`

const pressureShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`

const gradientSubtractShader = /* glsl */ `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`
// function createSneakPick() {
//   const canvas = document.createElement('canvas')

//   canvas.id = 'CursorLayer'
//   canvas.width = 600
//   canvas.height = 400
//   canvas.style.zIndex = 8
//   canvas.style.position = 'absolute'
//   canvas.style.border = '1px solid'

//   const body = document.getElementsByTagName('body')[0]
//   body.appendChild(canvas)
//   return canvas.getContext('2d')
// }
function init(drawStartCallback, drawStopCallback) {
  // const sneakpick = createSneakPick()

  const renderer = new Renderer({ dpr: 2 })
  const gl = renderer.gl

  const baseTexture = TextureLoader.load(gl, { src: 'images/cryo.png' })
  // const baseTexture2 = TextureLoader.load(gl, { src: 'images/pic2.jpg' })
  // console.log(' <><> ', baseTexture2, baseTexture)
  document.body.appendChild(gl.canvas)
  gl.clearColor(1, 1, 1, 1)

  const camera = new Camera(gl, { fov: 35 })
  camera.position.set(0, 1, 5)
  camera.lookAt([0, 0, 0])

  const post = new Post(gl)

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height })
    post.resize()
  }
  window.addEventListener('resize', resize, false)
  resize()

  // Helper functions for larger device support
  function getSupportedFormat(gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
      switch (internalFormat) {
        case gl.R16F:
          return getSupportedFormat(gl, gl.RG16F, gl.RG, type)
        case gl.RG16F:
          return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type)
        default:
          return null
      }
    }

    return { internalFormat, format }
  }

  function supportRenderTextureFormat(gl, internalFormat, format, type) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null)

    const fbo = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    )

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) return false
    return true
  }

  // Helper to create a ping-pong FBO pairing for simulating on GPU
  function createDoubleFBO(
    gl,
    {
      width,
      height,
      wrapS,
      wrapT,
      minFilter = gl.LINEAR,
      magFilter = minFilter,
      type,
      format,
      internalFormat,
      depth
    } = {}
  ) {
    const options = {
      width,
      height,
      wrapS,
      wrapT,
      minFilter,
      magFilter,
      type,
      format,
      internalFormat,
      depth
    }
    const fbo = {
      read: new RenderTarget(gl, options),
      write: new RenderTarget(gl, options),
      swap: () => {
        const temp = fbo.read
        fbo.read = fbo.write
        fbo.write = temp
      }
    }
    return fbo
  }

  // Resolution of simulation
  const simRes = 128
  const dyeRes = 512

  // Main inputs to control look and feel of fluid
  const iterations = 3
  const densityDissipation = 0.99
  const velocityDissipation = 0.99
  const pressureDissipation = 0.8
  const curlStrength = 20
  const radius = 0.6

  // Common uniform
  const texelSize = { value: new Vec2(1 / simRes) }

  // Get supported formats and types for FBOs
  const supportLinearFiltering =
    gl.renderer.extensions[
      `OES_texture_${gl.renderer.isWebgl2 ? `` : `half_`}float_linear`
    ]
  const halfFloat = gl.renderer.isWebgl2
    ? gl.HALF_FLOAT
    : gl.renderer.extensions.OES_texture_half_float.HALF_FLOAT_OES

  const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST
  let rgba, rg, r

  if (gl.renderer.isWebgl2) {
    rgba = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloat)
    // rgb = getSupportedFormat(gl, gl.RG16F, gl.RGB, halfFloat)
    rg = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloat)
    r = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloat)
  } else {
    rgba = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloat)
    rg = rgba
    r = rgba
  }

  // Create fluid simulation FBOs
  const density = createDoubleFBO(gl, {
    width: dyeRes,
    height: dyeRes,
    type: halfFloat,
    format: rgba?.format,
    internalFormat: rgba?.internalFormat,
    minFilter: filtering,
    depth: false
  })

  const velocity = createDoubleFBO(gl, {
    width: simRes,
    height: simRes,
    type: halfFloat,
    format: rg?.format,
    internalFormat: rg?.internalFormat,
    minFilter: filtering,
    depth: false
  })

  const pressure = createDoubleFBO(gl, {
    width: simRes,
    height: simRes,
    type: halfFloat,
    format: r?.format,
    internalFormat: r?.internalFormat,
    minFilter: gl.NEAREST,
    depth: false
  })

  const divergence = new RenderTarget(gl, {
    width: simRes,
    height: simRes,
    type: halfFloat,
    format: r?.format,
    internalFormat: r?.internalFormat,
    minFilter: gl.NEAREST,
    depth: false
  })

  const curl = new RenderTarget(gl, {
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
  const targetFinalBuffer = createDoubleFBO(gl, {
    width: renderer.width,
    height: renderer.height
    // type: halfFloat,
    // format: rgba?.format,
    // internalFormat: rgba?.internalFormat,
    // minFilter: filtering,
    // depth: false
  })
  // Geometry to be used for the simulation programs
  // const quad = new Geometry(gl, {
  //   position: {
  //     size: 2,
  //     data: new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1])
  //   },
  //   uv: {
  //     size: 2,
  //     data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1])
  //   }
  // })
  const triangle = new Geometry(gl, {
    position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
    uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
  })
  // const triangle2 = new Geometry(gl, {
  //   position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
  //   uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
  // })

  // const targetProgram = new Mesh(gl, {
  //   geometry: triangle,
  //   program: new Program(gl, {
  //     vertex: baseVertex,
  //     fragment: tfragment,
  //     uniforms: {
  //       uSampler: { value: baseTexture }
  //       // uSampler: { value: curl.texture }
  //     },
  //     depthTest: false,
  //     depthWrite: false
  //   })
  // })
  // Create fluid simulation programs
  const clearProgram = new Mesh(gl, {
    geometry: triangle,
    program: new Program(gl, {
      vertex: baseVertex,
      fragment: clearShader,
      uniforms: {
        texelSize,
        uTexture: { value: null },
        value: { value: pressureDissipation }
      },
      depthTest: false,
      depthWrite: false
    })
  })

  const splatProgram = new Mesh(gl, {
    geometry: triangle,
    program: new Program(gl, {
      vertex: baseVertex,
      fragment: splatShader,
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

  const advectionProgram = new Mesh(gl, {
    geometry: triangle,
    program: new Program(gl, {
      vertex: baseVertex,
      fragment: supportLinearFiltering
        ? advectionShader
        : advectionManualFilteringShader,
      uniforms: {
        texelSize,
        dyeTexelSize: { value: new Vec2(1 / dyeRes, 1 / dyeRes) },
        uVelocity: { value: null },
        uSource: { value: null },
        dt: { value: 0.016 },
        dissipation: { value: 1.0 }
      },
      depthTest: false,
      depthWrite: false
    })
  })

  const divergenceProgram = new Mesh(gl, {
    geometry: triangle,
    program: new Program(gl, {
      vertex: baseVertex,
      fragment: divergenceShader,
      uniforms: {
        texelSize,
        uVelocity: { value: null }
      },
      depthTest: false,
      depthWrite: false
    })
  })

  const curlProgram = new Mesh(gl, {
    geometry: triangle,
    program: new Program(gl, {
      vertex: baseVertex,
      fragment: curlShader,
      uniforms: {
        texelSize,
        uVelocity: { value: null }
      },
      depthTest: false,
      depthWrite: false
    })
  })

  const vorticityProgram = new Mesh(gl, {
    geometry: triangle,
    program: new Program(gl, {
      vertex: baseVertex,
      fragment: vorticityShader,
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

  const pressureProgram = new Mesh(gl, {
    geometry: triangle,
    program: new Program(gl, {
      vertex: baseVertex,
      fragment: pressureShader,
      uniforms: {
        texelSize,
        uPressure: { value: null },
        uDivergence: { value: null }
      },
      depthTest: false,
      depthWrite: false
    })
  })

  const gradienSubtractProgram = new Mesh(gl, {
    geometry: triangle,
    program: new Program(gl, {
      vertex: baseVertex,
      fragment: gradientSubtractShader,
      uniforms: {
        texelSize,
        uPressure: { value: null },
        uVelocity: { value: null }
      },
      depthTest: false,
      depthWrite: false
    })
  })

  const splats = []
  function getSplats() {
    // splats = []

    for (let i = 0; i < 5; i++) {
      splats.push({
        // Get mouse value in 0 to 1 range, with y flipped
        x: Math.random(),
        y: Math.random(),
        dx: Math.random() * 4000 - 2000,
        dy: Math.random() * 4000 - 2000
      })
    }
    // console.log('get splats', JSON.stringify(splats, null, 3))
  }
  // Create handlers to get mouse position and velocity
  // const isTouchCapable = 'ontouchstart' in window
  // if (isTouchCapable) {
  //   window.addEventListener('touchstart', updateMouse, false)
  //   window.addEventListener('touchmove', updateMouse, false)
  // } else {
  //   window.addEventListener('mousemove', updateMouse, false)
  // }

  // const lastMouse = new Vec2()
  // function updateMouse(e) {
  //   if (e.changedTouches && e.changedTouches.length) {
  //     e.x = e.changedTouches[0].pageX
  //     e.y = e.changedTouches[0].pageY
  //   }
  //   if (e.x === undefined) {
  //     e.x = e.pageX
  //     e.y = e.pageY
  //   }

  //   if (!lastMouse.isInit) {
  //     lastMouse.isInit = true

  //     // First input
  //     lastMouse.set(e.x, e.y)
  //   }

  //   const deltaX = e.x - lastMouse.x
  //   const deltaY = e.y - lastMouse.y

  //   lastMouse.set(e.x, e.y)

  //   // Add if the mouse is moving
  //   if (Math.abs(deltaX) || Math.abs(deltaY)) {
  //     splats.push({
  //       // Get mouse value in 0 to 1 range, with y flipped
  //       x: e.x / gl.renderer.width,
  //       y: 1.0 - e.y / gl.renderer.height,
  //       dx: deltaX * 5.0,
  //       dy: deltaY * -5.0
  //     })
  //   }
  // }

  // Function to draw number of interactions onto input render target
  function splat({ x, y, dx, dy }) {
    splatProgram.program.uniforms.uTarget.value = velocity.read.texture
    splatProgram.program.uniforms.aspectRatio.value =
      gl.renderer.width / gl.renderer.height
    splatProgram.program.uniforms.point.value.set(x, y)
    splatProgram.program.uniforms.color.value.set(dx, dy, 1.0)
    splatProgram.program.uniforms.radius.value = radius / 100.0

    gl.renderer.render({
      scene: splatProgram,
      target: velocity.write,
      sort: false,
      update: false
    })
    velocity.swap()

    splatProgram.program.uniforms.uTarget.value = density.read.texture

    gl.renderer.render({
      scene: splatProgram,
      target: density.write,
      sort: false,
      update: false
    })
    density.swap()
  }

  const p11 = new Program(gl, {
    vertex: baseVertex2,
    fragment: tfragment,
    uniforms: {
      uSampler: { value: baseTexture }
      // uSampler: { value: curl.texture }
    }
  })

  // const mesh = new Mesh(gl, {
  //   geometry: triangle,
  //   program: p11
  // })
  const mesh = new Mesh(gl, {
    geometry: triangle,
    program: p11
  })

  const pass = post.addPass({
    fragment,
    uniforms: {
      tFluid: { value: null },
      uTime: { value: 0 },
      tMap: { value: null },
      uWhiter: { value: 0 }
    }
  })
  const scene = new Transform()
  mesh.setParent(scene)
  // const target = new RenderTarget(gl, {
  //   color: 2, // Number of render targets

  //   // Use half float to get accurate position values
  //   type: gl.renderer.isWebgl2
  //     ? gl.HALF_FLOAT
  //     : gl.renderer.extensions.OES_texture_half_float.HALF_FLOAT_OES,
  //   internalFormat: gl.renderer.isWebgl2 ? gl.RGBA16F : gl.RGBA,
  //   minFilter: supportLinearFiltering ? gl.LINEAR : gl.NEAREST
  // })

  console.log(targetFinalBuffer.read)
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

    curlProgram.program.uniforms.uVelocity.value = velocity.read.texture

    gl.renderer.render({
      scene: curlProgram,
      target: curl,
      sort: false,
      update: false
    })

    vorticityProgram.program.uniforms.uVelocity.value = velocity.read.texture
    vorticityProgram.program.uniforms.uCurl.value = curl.texture

    gl.renderer.render({
      scene: vorticityProgram,
      target: velocity.write,
      sort: false,
      update: false
    })
    velocity.swap()

    divergenceProgram.program.uniforms.uVelocity.value = velocity.read.texture

    gl.renderer.render({
      scene: divergenceProgram,
      target: divergence,
      sort: false,
      update: false
    })

    clearProgram.program.uniforms.uTexture.value = pressure.read.texture
    clearProgram.program.uniforms.value.value = pressureDissipation

    gl.renderer.render({
      scene: clearProgram,
      target: pressure.write,
      sort: false,
      update: false
    })
    pressure.swap()

    pressureProgram.program.uniforms.uDivergence.value = divergence.texture

    for (let i = 0; i < iterations; i++) {
      pressureProgram.program.uniforms.uPressure.value = pressure.read.texture

      gl.renderer.render({
        scene: pressureProgram,
        target: pressure.write,
        sort: false,
        update: false
      })
      pressure.swap()
    }

    gradienSubtractProgram.program.uniforms.uPressure.value =
      pressure.read.texture
    gradienSubtractProgram.program.uniforms.uVelocity.value =
      velocity.read.texture

    gl.renderer.render({
      scene: gradienSubtractProgram,
      target: velocity.write,
      sort: false,
      update: false
    })
    velocity.swap()

    advectionProgram.program.uniforms.dyeTexelSize.value.set(1 / simRes)
    advectionProgram.program.uniforms.uVelocity.value = velocity.read.texture
    advectionProgram.program.uniforms.uSource.value = velocity.read.texture
    advectionProgram.program.uniforms.dissipation.value = velocityDissipation

    gl.renderer.render({
      scene: advectionProgram,
      target: velocity.write,
      sort: false,
      update: false
    })
    velocity.swap()

    advectionProgram.program.uniforms.dyeTexelSize.value.set(1 / dyeRes)
    advectionProgram.program.uniforms.uVelocity.value = velocity.read.texture
    advectionProgram.program.uniforms.uSource.value = density.read.texture
    advectionProgram.program.uniforms.dissipation.value = densityDissipation

    gl.renderer.render({
      scene: advectionProgram,
      target: density.write,
      sort: false,
      update: false
    })
    density.swap()

    //  - - - - - - - - - My attept
    // gl.renderer.render({
    //   scene: mesh,
    //   target: targetFinalBuffer.write,
    //   sort: false,
    //   update: false
    // })
    // targetFinalBuffer.swap()
    // p11.uniforms.uSampler.value = targetFinalBuffer.read.texture
    // - - -- -
    // Set clear back to default

    gl.renderer.autoClear = true

    // Update post pass uniform with the simulation output

    pass.uniforms.tFluid.value = density.read.texture

    const flashTriger = (t % 3000) / 3000
    if (flashTriger < 0.01) {
      // p11.uniforms.uSampler.value = baseTexture
      getSplats()
    }
    pass.uniforms.uTime.value = 1 - flashTriger

    // pass.uniforms.uWhiter.value = t * 0.001

    // Replace Renderer.render with post.render. Use the same arguments.
    post.render({ scene, camera })
    post.render({
      scene,
      camera,
      target: targetFinalBuffer.write,
      sort: false,
      update: false
    })
    targetFinalBuffer.swap()
    if (t > 2500) {
      p11.uniforms.uSampler.value = baseTexture // targetFinalBuffer.read.texture
    }

    drawStopCallback()
  }
}
export default {
  init
}

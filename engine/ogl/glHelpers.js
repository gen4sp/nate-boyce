import { RenderTarget } from 'ogl-nuxt'
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

export default function (gl) {
  const halfFloat = gl.renderer.isWebgl2
    ? gl.HALF_FLOAT
    : gl.renderer.extensions.OES_texture_half_float.HALF_FLOAT_OES
  let rgba
  let rg
  let r
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

  const supportLinearFiltering =
    gl.renderer.extensions[
      `OES_texture_${gl.renderer.isWebgl2 ? `` : `half_`}float_linear`
    ]

  return {
    halfFloat,
    createDoubleFBO,
    supportLinearFiltering,
    rgba,
    rg,
    r
  }
}

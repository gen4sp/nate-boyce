import * as PIXI from 'pixi.js'

import advectionFrag from './shaders/fluid/advection.frag'
import baseVert from './shaders/fluid/base.vert'
import blurFrag from './shaders/fluid/blur.frag'
import blurVert from './shaders/fluid/blur.vert'
import checkboardFrag from './shaders/fluid/checkboard.frag'
import clearFrag from './shaders/fluid/clear.frag'
import colorFrag from './shaders/fluid/color.frag'
import copyFrag from './shaders/fluid/copy.frag'
import curlFrag from './shaders/fluid/curl.frag'
import displayFrag from './shaders/fluid/display.frag'
import divergenceFrag from './shaders/fluid/divergence.frag'
import gradientSubstract from './shaders/fluid/gradientSubstract.frag'
import pressureFrag from './shaders/fluid/pressure.frag'
import splatFrag from './shaders/fluid/splat.frag'
import vorticityFrag from './shaders/fluid/vorticity.frag'

const SHADERS_SRCS = {
  advectionFrag,
  baseVert,
  blurVert,
  blurFrag,
  checkboardFrag,
  clearFrag,
  colorFrag,
  copyFrag,
  curlFrag,
  displayFrag,
  divergenceFrag,
  gradientSubstract,
  pressureFrag,
  splatFrag,
  vorticityFrag
}
// const SHADERS_UNFORMS = {
//   advectionFrag:{
//     uVelocity:null,
//     uSource:null,
//     texelSize: null,
//     dyeTexelSize: null;
//     uniform float dt;
//     uniform float dissipation;
//   },
//   baseVert,
//   blurVert,
//   blurFrag,
//   checkboardFrag,
//   clearFrag,
//   colorFrag,
//   copyFrag,
//   curlFrag,
//   displayFrag,
//   divergenceFrag,
//   gradientSubstract,
//   pressureFrag,
//   splatFrag,
//   vorticityFrag
// }

const blur = new PIXI.Filter(SHADERS_SRCS.blurVert, SHADERS_SRCS.blurFrag)
const copy = new PIXI.Filter(SHADERS_SRCS.baseVert, SHADERS_SRCS.copyFrag)
const clear = new PIXI.Filter(SHADERS_SRCS.baseVert, SHADERS_SRCS.clearFrag)
const color = new PIXI.Filter(SHADERS_SRCS.baseVert, SHADERS_SRCS.colorFrag)
const checkerboard = new PIXI.Filter(
  SHADERS_SRCS.baseVert,
  SHADERS_SRCS.checkboardFrag
)
const splat = new PIXI.Filter(SHADERS_SRCS.baseVert, SHADERS_SRCS.splat)
const advection = new PIXI.Filter(
  SHADERS_SRCS.baseVert,
  SHADERS_SRCS.advectionFrag
)
const divergence = new PIXI.Filter(
  SHADERS_SRCS.baseVert,
  SHADERS_SRCS.divergenceFrag
)
const curl = new PIXI.Filter(SHADERS_SRCS.baseVert, SHADERS_SRCS.curlFrag)
const vorticity = new PIXI.Filter(
  SHADERS_SRCS.baseVert,
  SHADERS_SRCS.vorticityFrag
)
const pressure = new PIXI.Filter(
  SHADERS_SRCS.baseVert,
  SHADERS_SRCS.pressureFrag
)
const gradienSubtract = new PIXI.Filter(
  SHADERS_SRCS.baseVert,
  SHADERS_SRCS.gradientSubstract
)

const display = new PIXI.Filter(SHADERS_SRCS.baseVert, SHADERS_SRCS.displayFrag)

export default {
  blur,
  copy,
  clear,
  color,
  checkerboard,
  splat,
  advection,
  divergence,
  curl,
  vorticity,
  pressure,
  gradienSubtract,
  display
}

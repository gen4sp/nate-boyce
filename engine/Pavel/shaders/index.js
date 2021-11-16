import advectionFrag from './advection.frag'
import baseVert from './base.vert'
import blurFrag from './blur.frag'
import blurVert from './blur.vert'
import checkboardFrag from './checkboard.frag'
import clearFrag from './clear.frag'
import colorFrag from './color.frag'
import copyFrag from './copy.frag'
import curlFrag from './curl.frag'
import displayFrag from './display.frag'
import divergenceFrag from './divergence.frag'
import gradientSubstract from './gradientSubstract.frag'
import pressureFrag from './pressure.frag'
import splatFrag from './splat.frag'
import vorticityFrag from './vorticity.frag'
import displacementFrag from './displacement.frag'

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
  vorticityFrag,
  displacementFrag
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

export default SHADERS_SRCS

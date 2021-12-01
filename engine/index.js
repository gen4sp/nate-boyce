import Stats from 'stats.js'
import OGL from './ogl'
const stats = new Stats()
// const ctx = null
// let isReadyToDraw = false
function init() {
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom

  document.body.appendChild(stats.dom)

  OGL.init(
    () => {
      stats.begin()
    },
    () => {
      stats.end()
    }
  )
}

export default {
  init
}

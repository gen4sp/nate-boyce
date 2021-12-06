import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
// import Stats from 'three/examples/jsm/libs/stats.module'

const scene = new THREE.Scene()
// scene.add(new THREE.AxesHelper(5))

const light = new THREE.PointLight()
light.position.set(0.8, 1.4, 1.0)
scene.add(light)

const ambientLight = new THREE.AmbientLight()
scene.add(ambientLight)

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0.8, 1.4, 1.0)

const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.domElement.style.cssText = 'opacity:0.2'
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1, 0)

// const material = new THREE.MeshNormalMaterial()

const fbxLoader = new FBXLoader()
fbxLoader.load(
  'fbx/doll_low.fbx',
  (object) => {
    // object.traverse(function (child) {
    //   if (child.isMesh) {
    //     // (child as THREE.Mesh).material = material
    //     if (child.material) {
    //       child.material.transparent = false
    //     }
    //   }
    // })
    const scale = 0.15
    object.scale.set(scale, scale, scale)
    object.position.set(0, scale * 5, 0)
    scene.add(object)
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
  },
  (error) => {
    console.log(error)
  }
)

// Create a different scene to hold our buffer objects
// const bufferScene = new THREE.Scene()
// Create the texture that will store our result
// const bufferTexture = new THREE.WebGLRenderTarget(
//   window.innerWidth,
//   window.innerHeight,
//   { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter }
// )
// renderer.setRenderTarget(bufferTexture)
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  render()
}

// const stats = Stats()
// document.body.appendChild(stats.dom)

function animate() {
  requestAnimationFrame(animate)

  controls.update()

  render()

  // stats.update()
}
let image = null
const imageTag = document.createElement('img')
imageTag.style.cssText =
  ' position: absolute;top: 200px;left: 200px;border: red 1px solid;width: 200px;'
document.body.appendChild(imageTag)
function render() {
  renderer.render(scene, camera)
  image = renderer.domElement.toDataURL()
  //   image = bufferTexture.texture.image
  //   console.log(image)
  imageTag.src = image
  // renderer.render(bufferScene, camera)
}

animate()
// function displayBase64Image(placeholder, base64Image) {

//     image.onload = function() {
//         placeholder.innerHTML = '';
//         placeholder.appendChild(this);
//     }
//     image.src = base64Image;
// }
export default {
  //   bufferTexture,
  image
}

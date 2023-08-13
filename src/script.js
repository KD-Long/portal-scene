import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'

import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

import {gsap} from 'gsap'
/**
 * Base
 */
// Debug
const gui = new dat.GUI({
    width: 400
})

const params = {
    clearColor: 0x201919,
    portalColorStart: 0x00082e,
    portalColorEnd: 0xd1fbff,
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loading bar
const loadingBar = document.querySelector('.loading-bar')

const loadingManager = new THREE.LoadingManager()
loadingManager.onLoad = () => {
    console.log('loaded')

    //delay to allow loading animation to complete
    window.setTimeout(()=>{
        // starts to fade out overlay
        gsap.to(overlayMat.uniforms.uAlpha, {duration: 2, value:0})
        //overlayMat.wireframe = true

        // delay to remove overlay after animation
        window.setTimeout(()=>{
            overlayGeo.dispose()
            overlayMat.dispose()
            scene.remove(overlayMesh)
        },2000)


        //removes bar
        loadingBar.style.display= 'none'
    },1000)

    
    
}
loadingManager.onProgress = (itemUrl,itemsLoaded,itemsTotal) => {
    const percentage = itemsLoaded/itemsTotal
    
    loadingBar.style.transform = `scaleX(${percentage})`
    
}

//overlay material

const overlayGeo = new THREE.PlaneGeometry(2,2,1,1)
const overlayMat = new THREE.ShaderMaterial({
    transparent:true,
    uniforms:{
        uAlpha:{value:1.0},
        uLoadingColor:{value: new THREE.Color(params.portalColorStart)}
    },
    vertexShader:
    `
    void main(){
        gl_Position = vec4(position, 1.0);
    }
    `,
    fragmentShader:
    `
    uniform vec3 uLoadingColor;
    uniform float uAlpha;
    void main(){
        gl_FragColor = vec4(uLoadingColor, uAlpha);
    }
    `
})
const overlayMesh = new THREE.Mesh(
    overlayGeo,
    overlayMat
)
 scene.add(overlayMesh)

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader(loadingManager)

const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

// Draco loader
const dracoLoader = new DRACOLoader(loadingManager)
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager)

gltfLoader.load('my_portal.glb',
    (gltf) =>{
          

        //******** because we merged the scene into on child (other than emissions) we dont need to traverse the whole scene
        // gltf.scene.traverse((child)=>{
        //     child.material = bakedMaterial
        // })
        const bakedScene = gltf.scene.children.find(
            (child)=>{
                return child.name === 'baked'
        })
        bakedScene.material = bakedMaterial




        // find children and apply light materials
        // Note these children names are blender object names
        const poleLight1 = gltf.scene.children.find(
            (child)=>{
                return child.name === 'plight1'
            })
        const poleLight2 = gltf.scene.children.find(
            (child)=>{
                return child.name === 'plight2'
            })
        const portalLight = gltf.scene.children.find(
            (child)=>{
                return child.name === 'portalLight'
            })
        poleLight1.material = poleLightMaterial
        poleLight2.material = poleLightMaterial
        portalLight.material = portalLightMaterial


        scene.add(gltf.scene)
    })

gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Object
 */

/**
 * Materials
**/

//Baked materials
const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture})

const poleLightMaterial = new THREE.MeshBasicMaterial({color:0xffffe5})



/**
 * FireFlies
 */

const ffGeo = new THREE.BufferGeometry()
const ffCount = 30

const posArray = new Float32Array(ffCount * 3)
const scaleArray = new Float32Array(ffCount)
for(let i = 0; i<ffCount;i++){
    posArray[i*3 + 0] = (Math.random() -0.5) *4
    posArray[i*3 + 1] = Math.random() *1.5
    posArray[i*3 + 2] = (Math.random() -0.5) *4
    scaleArray[i] = Math.random()
}
ffGeo.setAttribute('position', new THREE.BufferAttribute(posArray,3))
ffGeo.setAttribute('aScale', new THREE.BufferAttribute(scaleArray,1))

const ffMat = new THREE.ShaderMaterial({
        transparent:true,
        blending: THREE.AdditiveBlending,
        depthWrite:false,
        vertexShader: firefliesVertexShader,
        fragmentShader: firefliesFragmentShader,
        uniforms:{
            uTime: {value: 0.0},
            uPixelRatio: {value:Math.min(window.devicePixelRatio, 2)},
            uSize: {value: 180.0},
        }
    }
)
const ffpoints = new THREE.Points(ffGeo,ffMat)
scene.add(ffpoints)

/**
 * Portal
 */

//Material
const portalLightMaterial = new THREE.ShaderMaterial({
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    uniforms:{
        uTime: {value: 0.0},
        uPixelRatio: {value:Math.min(window.devicePixelRatio, 2)},
        uColorStart: {value: new THREE.Color(params.portalColorStart)},
        uColorEnd: {value: new THREE.Color(params.portalColorEnd)}

    }
}
)
//Fog
const fog = new THREE.Fog(0x262837,3,10)
scene.fog = fog

// const helper = new THREE.AxesHelper(2)
// scene.add(helper)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //update firefleis size
    ffMat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Debug

gui.addColor(params, 'clearColor')
    .onChange(()=>{
        renderer.setClearColor(params.clearColor)
})
gui.addColor(params, 'portalColorStart')
    .onChange(()=>{
        portalLightMaterial.uniforms.uColorStart.value = new THREE.Color(params.portalColorStart)
    })
gui.addColor(params, 'portalColorEnd')
.onChange(()=>{
    portalLightMaterial.uniforms.uColorEnd.value = new THREE.Color(params.portalColorEnd)
})
gui.add(ffMat.uniforms.uSize, 'value',0,500,1).name('ffSize')

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(params.clearColor)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // update fireflies
    ffMat.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
import * as THREE from 'three'

export function initScene() {
  // 场景
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a1a)

  // 相机
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 5, 10)
  camera.lookAt(0, 0, 0)

  // 渲染器
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)

  // 灯光
  const ambientLight = new THREE.AmbientLight(0x404040, 2)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0x00ffff, 1)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)

  // 占位：一个旋转的线框球体（代表未来的苏州3D地图）
  const geometry = new THREE.IcosahedronGeometry(2, 2)
  const material = new THREE.MeshBasicMaterial({
    color: 0x00aaff,
    wireframe: true
  })
  const sphere = new THREE.Mesh(geometry, material)
  scene.add(sphere)

  // 占位：地面网格
  const gridHelper = new THREE.GridHelper(20, 20, 0x004444, 0x002222)
  scene.add(gridHelper)

  // 动画循环
  function animate() {
    requestAnimationFrame(animate)
    sphere.rotation.y += 0.005
    renderer.render(scene, camera)
  }
  animate()

  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

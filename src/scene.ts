import * as THREE from 'three'

interface DemData {
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
  points: [number, number, number][]
}

export async function initScene(): Promise<THREE.Scene> {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0e1a)
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.0008)

  const container = document.getElementById('canvas-container')!
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 5000)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // 灯光
  scene.add(new THREE.AmbientLight(0x334466, 1.5))
  const dirLight = new THREE.DirectionalLight(0x00d4ff, 0.8)
  dirLight.position.set(50, 100, 50)
  scene.add(dirLight)
  const pointLight = new THREE.PointLight(0x00ff88, 0.5, 500)
  pointLight.position.set(-50, 80, -50)
  scene.add(pointLight)

  // 加载地形数据
  const resp = await fetch('/suzhou_dem.json')
  const dem: DemData = await resp.json()

  // 创建地形网格
  const gridSize = 300
  const minLat = dem.bounds.minLat, maxLat = dem.bounds.maxLat
  const minLon = dem.bounds.minLon, maxLon = dem.bounds.maxLon

  // 将点数据映射到网格
  const grid: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))
  const count: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))

  for (const [lon, lat, elev] of dem.points) {
    const x = Math.floor(((lon - minLon) / (maxLon - minLon)) * (gridSize - 1))
    const y = Math.floor(((lat - minLat) / (maxLat - minLat)) * (gridSize - 1))
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      grid[y][x] += elev
      count[y][x]++
    }
  }

  // 平均高程
  let maxElev = 0
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (count[y][x] > 0) {
        grid[y][x] /= count[y][x]
        maxElev = Math.max(maxElev, grid[y][x])
      }
    }
  }

  // 创建几何体
  const geometry = new THREE.PlaneGeometry(200, 200, gridSize - 1, gridSize - 1)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)

  for (let i = 0; i < positions.count; i++) {
    const x = i % gridSize
    const y = Math.floor(i / gridSize)
    const elev = grid[y][x] / maxElev * 30
    positions.setZ(i, elev)

    // 高程颜色映射
    const t = elev / 30
    let r, g, b
    if (t < 0.2) {
      r = 0; g = 0.3 + t * 2; b = 0.5 + t  // 深蓝→浅蓝
    } else if (t < 0.5) {
      const tt = (t - 0.2) / 0.3
      r = tt * 0.2; g = 0.5 + tt * 0.3; b = 0.3 - tt * 0.2  // 浅蓝→绿
    } else if (t < 0.8) {
      const tt = (t - 0.5) / 0.3
      r = 0.2 + tt * 0.5; g = 0.8 - tt * 0.3; b = 0.1  // 绿→黄
    } else {
      const tt = (t - 0.8) / 0.2
      r = 0.7 + tt * 0.3; g = 0.5 - tt * 0.3; b = 0.1  // 黄→红
    }
    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()

  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    shininess: 10,
  })

  const terrain = new THREE.Mesh(geometry, material)
  terrain.rotation.x = -Math.PI / 2
  scene.add(terrain)

  // 网格线
  const gridHelper = new THREE.GridHelper(200, 30, 0x1a2744, 0x0d1225)
  gridHelper.position.y = -0.5
  scene.add(gridHelper)

  // 相机
  camera.position.set(80, 120, 150)
  camera.lookAt(0, 0, 0)

  // 鼠标控制
  let isDragging = false
  let prevX = 0, prevY = 0
  let rotY = 0.3, rotX = 0.5
  let dist = 250

  canvas.addEventListener('mousedown', (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY })
  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return
    rotY += (e.clientX - prevX) * 0.005
    rotX += (e.clientY - prevY) * 0.005
    rotX = Math.max(0.1, Math.min(1.4, rotX))
    prevX = e.clientX
    prevY = e.clientY
  })
  canvas.addEventListener('mouseup', () => { isDragging = false })
  canvas.addEventListener('wheel', (e) => {
    dist += e.deltaY * 0.3
    dist = Math.max(50, Math.min(500, dist))
  })

  // 时钟
  function updateClock() {
    const el = document.getElementById('clock')
    if (el) el.textContent = new Date().toLocaleString('zh-CN')
  }
  setInterval(updateClock, 1000)
  updateClock()

  // 动画
  function animate() {
    requestAnimationFrame(animate)
    camera.position.x = dist * Math.sin(rotY) * Math.cos(rotX)
    camera.position.y = dist * Math.sin(rotX) + 50
    camera.position.z = dist * Math.cos(rotY) * Math.cos(rotX)
    camera.lookAt(0, 10, 0)
    renderer.render(scene, camera)
  }
  return scene
  animate()

  // 响应式
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  })
}

// 热力图和边界在main.ts中单独初始化

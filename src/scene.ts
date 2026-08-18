import * as THREE from "three"
import { generateSatelliteTexture, applySatelliteTexture } from "./components/satellite-texture"

interface DemData {
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
  points: [number, number, number][]
}

export async function initScene(): Promise<THREE.Scene> {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d1225)
  scene.fog = new THREE.FogExp2(0x0d1225, 0.0008)

  const container = document.getElementById("canvas-container")!
  const canvas = document.getElementById("canvas") as HTMLCanvasElement
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 5000)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // 亮色光照照亮地形，但背景保持暗色
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)
  
  const dirLight = new THREE.DirectionalLight(0xfff8e7, 1.8)
  dirLight.position.set(100, 200, 100)
  scene.add(dirLight)
  
  const dirLight2 = new THREE.DirectionalLight(0xddeeff, 0.6)
  dirLight2.position.set(-100, 150, -100)
  scene.add(dirLight2)

  const resp = await fetch("/suzhou_dem.json")
  const dem: DemData = await resp.json()

  // Higher resolution for finer terrain detail
  const gridSize = 500
  const minLat = dem.bounds.minLat, maxLat = dem.bounds.maxLat
  const minLon = dem.bounds.minLon, maxLon = dem.bounds.maxLon

  const grid: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))
  const count: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))

  for (const [lon, lat, elev] of dem.points) {
    const x = Math.floor(((lon - minLon) / (maxLon - minLon)) * (gridSize - 1))
    const y = (gridSize - 1) - Math.floor(((lat - minLat) / (maxLat - minLat)) * (gridSize - 1))
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      grid[y][x] += elev
      count[y][x]++
    }
  }

  let maxElev = 0
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (count[y][x] > 0) {
        grid[y][x] /= count[y][x]
        maxElev = Math.max(maxElev, grid[y][x])
      }
    }
  }

  const geometry = new THREE.PlaneGeometry(200, 200, gridSize - 1, gridSize - 1)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)

  // Multi-layer color scheme for terrain elevation
  for (let i = 0; i < positions.count; i++) {
    const x = i % gridSize
    const y = Math.floor(i / gridSize)
    const elev = grid[y][x] / maxElev * 6  // 平原地形，压低高度
    positions.setZ(i, elev)

    const t = elev / 6
    let r: number, g: number, b: number
    
    // 苏州是平原，地形起伏很小，用平缓渐变
    if (t < 0.2) {
      r = 0.6; g = 0.75; b = 0.5  // 浅绿平原
    } else if (t < 0.4) {
      const tt = (t - 0.2) / 0.2
      r = 0.55 + tt * 0.1; g = 0.7 + tt * 0.05; b = 0.45 - tt * 0.1
    } else if (t < 0.6) {
      const tt = (t - 0.4) / 0.2
      r = 0.65 + tt * 0.05; g = 0.75 - tt * 0.1; b = 0.35 - tt * 0.05
    } else if (t < 0.8) {
      const tt = (t - 0.6) / 0.2
      r = 0.7 + tt * 0.1; g = 0.65 - tt * 0.1; b = 0.3 - tt * 0.05
    } else {
      const tt = (t - 0.8) / 0.2
      r = 0.8 + tt * 0.1; g = 0.55 - tt * 0.1; b = 0.25
    }
    
    // Add subtle variation for natural look
    const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1)) * 0.02
    r += noise; g += noise; b += noise
    
    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()

  const terrain = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    shininess: 25,
    specular: new THREE.Color(0x222222),
  }))
  terrain.rotation.x = -Math.PI / 2
  scene.add(terrain)

  // 加载真实卫星图（天地图API）
  const satelliteTexture = await generateSatelliteTexture(dem.bounds)
  applySatelliteTexture(scene, terrain, satelliteTexture)

  const gridHelper = new THREE.GridHelper(200, 20, 0x8899aa, 0xaabbcc)
  gridHelper.position.y = -0.5
  scene.add(gridHelper)
  
  // 苏州是平原，不需要等高线（移除）

  camera.position.set(80, 120, 150)
  camera.lookAt(0, 0, 0)
  scene.add(camera)

  let isDragging = false
  let prevX = 0, prevY = 0
  let rotY = 0.3, rotX = 0.5
  let dist = 250
  const entranceStart = performance.now()
  const entranceDuration = 2000  // 2 second fly-in
  const startDist = 800  // start far away

  canvas.addEventListener("mousedown", (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY })
  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging) return
    rotY -= (e.clientX - prevX) * 0.005
    rotX -= (e.clientY - prevY) * 0.005
    rotX = Math.max(0.1, Math.min(1.4, rotX))
    prevX = e.clientX
    prevY = e.clientY
  })
  canvas.addEventListener("mouseup", () => { isDragging = false })
  canvas.addEventListener("wheel", (e) => {
    dist += e.deltaY * 0.3
    dist = Math.max(50, Math.min(500, dist))
  })

  function updateClock() {
    const el = document.getElementById("clock")
    if (el) el.textContent = new Date().toLocaleString("zh-CN")
  }
  setInterval(updateClock, 1000)
  updateClock()

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  })

  function animate() {
    requestAnimationFrame(animate)

    // Entrance fly-in animation
    const elapsed = performance.now() - entranceStart
    if (elapsed < entranceDuration) {
      const t = elapsed / entranceDuration
      const ease = 1 - Math.pow(1 - t, 3)  // easeOutCubic
      const currentDist = startDist + (dist - startDist) * ease
      camera.position.x = currentDist * Math.sin(rotY) * Math.cos(rotX)
      camera.position.y = currentDist * Math.sin(rotX) + 50
      camera.position.z = currentDist * Math.cos(rotY) * Math.cos(rotX)
    } else {
      camera.position.x = dist * Math.sin(rotY) * Math.cos(rotX)
      camera.position.y = dist * Math.sin(rotX) + 50
      camera.position.z = dist * Math.cos(rotY) * Math.cos(rotX)
    }
    camera.lookAt(0, 10, 0)
    renderer.render(scene, camera)
  }
  animate()

  return scene
}

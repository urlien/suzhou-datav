import * as THREE from "three"
import { generateSatelliteTexture, applySatelliteTexture } from "./components/satellite-texture"
import { setTerrainHeightGrid } from "./utils/geo"

interface DemData {
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
  points: [number, number, number][]
}

type FrameCallback = (time: number) => void
const frameCallbacks: FrameCallback[] = []

export function registerFrameCallback(cb: FrameCallback) {
  frameCallbacks.push(cb)
}

let entranceStart = 0
let dragMoved = false
let cameraTarget = new THREE.Vector3(0, 10, 0)
let desiredTarget = new THREE.Vector3(0, 10, 0)
let currentDist = 230
let desiredDist = 230
let rotY = 0.3
let rotX = 0.55

export function startEntranceAnimation() {
  entranceStart = performance.now()
}

export function wasCanvasDragged(): boolean {
  return dragMoved
}

export function flyCameraTo(x: number, z: number, zoomDist = 145) {
  desiredTarget.set(x, 6, z)
  desiredDist = zoomDist
}

export function resetCameraView() {
  desiredTarget.set(0, 10, 0)
  desiredDist = 230
  rotY = 0.3
  rotX = 0.55
}

export function updateSceneTheme(scene: THREE.Scene, theme: string) {
  const bgHex = theme === "light" ? 0xdce6f2 : theme === "projection" ? 0x050814 : 0x0d1225
  scene.background = new THREE.Color(bgHex)
  scene.fog = new THREE.FogExp2(bgHex, 0.0008)
}

export async function initScene(): Promise<THREE.Scene> {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d1225)
  scene.fog = new THREE.FogExp2(0x0d1225, 0.0008)

  const container = document.getElementById("canvas-container")!
  const canvas = document.getElementById("canvas") as HTMLCanvasElement
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 5000)
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true, // 允许 canvas.toDataURL 正常导出截图
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight, false)

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

  // 缓存地形高程网格供建筑、边界、热力图采样
  setTerrainHeightGrid(grid, maxElev)

  const geometry = new THREE.PlaneGeometry(200, 200, gridSize - 1, gridSize - 1)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)

  // Multi-layer color scheme for terrain elevation
  for (let i = 0; i < positions.count; i++) {
    const x = i % gridSize
    const y = Math.floor(i / gridSize)
    const elev = (grid[y][x] / maxElev) * 6 // 平原地形，压低高度
    positions.setZ(i, elev)

    const t = elev / 6
    let r: number, g: number, b: number

    // 苏州是平原，地形起伏很小，用平缓渐变
    if (t < 0.2) {
      r = 0.22; g = 0.42; b = 0.32
    } else if (t < 0.4) {
      const tt = (t - 0.2) / 0.2
      r = 0.28 + tt * 0.12; g = 0.48 + tt * 0.08; b = 0.32 - tt * 0.05
    } else if (t < 0.6) {
      const tt = (t - 0.4) / 0.2
      r = 0.4 + tt * 0.15; g = 0.56 - tt * 0.06; b = 0.27 - tt * 0.05
    } else if (t < 0.8) {
      const tt = (t - 0.6) / 0.2
      r = 0.55 + tt * 0.15; g = 0.5 - tt * 0.1; b = 0.22 - tt * 0.04
    } else {
      const tt = (t - 0.8) / 0.2
      r = 0.7 + tt * 0.15; g = 0.4 - tt * 0.08; b = 0.18
    }

    const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.015
    colors[i * 3] = r + noise
    colors[i * 3 + 1] = g + noise
    colors[i * 3 + 2] = b + noise
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()

  const terrain = new THREE.Mesh(
    geometry,
    new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      shininess: 25,
      specular: new THREE.Color(0x222222),
    })
  )
  terrain.name = "terrain"
  terrain.rotation.x = -Math.PI / 2
  scene.add(terrain)

  // 异步非阻塞加载天地图卫星纹理（不阻塞首屏与入场动画）
  generateSatelliteTexture(dem.bounds)
    .then(satelliteTexture => {
      if (satelliteTexture) {
        applySatelliteTexture(terrain, satelliteTexture)
      }
    })
    .catch(err => console.warn("[Satellite] 异步贴图加载异常:", err))

  const gridHelper = new THREE.GridHelper(200, 20, 0x2d3a5c, 0x1e2942)
  gridHelper.position.y = -0.5
  gridHelper.name = "grid-helper"
  scene.add(gridHelper)

  camera.position.set(80, 120, 150)
  camera.lookAt(cameraTarget)
  scene.add(camera)

  let isDragging = false
  let downX = 0, downY = 0
  let prevX = 0, prevY = 0
  const entranceDuration = 1800
  const startDist = 650

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return
    isDragging = true
    dragMoved = false
    downX = prevX = e.clientX
    downY = prevY = e.clientY
  })

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
      dragMoved = true
    }
    rotY -= (e.clientX - prevX) * 0.005
    rotX -= (e.clientY - prevY) * 0.005
    rotX = Math.max(0.12, Math.min(1.45, rotX))
    prevX = e.clientX
    prevY = e.clientY
  })

  window.addEventListener("mouseup", () => {
    isDragging = false
  })

  canvas.addEventListener("dblclick", () => {
    resetCameraView()
  })

  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault()
      desiredDist += e.deltaY * 0.25
      desiredDist = Math.max(45, Math.min(800, desiredDist))
    },
    { passive: false }
  )

  function updateClock() {
    const el = document.getElementById("clock")
    if (el) el.textContent = new Date().toLocaleString("zh-CN")
  }
  setInterval(updateClock, 1000)
  updateClock()

  window.addEventListener("resize", () => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (w > 0 && h > 0) {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
  })

  entranceStart = performance.now()

  function animate() {
    requestAnimationFrame(animate)

    const now = performance.now()
    const timeSec = now * 0.001

    // 统一驱动飞线、热力图等子模块的帧动画
    for (let i = 0; i < frameCallbacks.length; i++) {
      frameCallbacks[i](timeSec)
    }

    // 平滑插值相机焦点与距离
    cameraTarget.lerp(desiredTarget, 0.08)
    currentDist += (desiredDist - currentDist) * 0.08

    const elapsed = now - entranceStart
    let activeDist = currentDist
    if (elapsed < entranceDuration) {
      const t = Math.max(0, elapsed / entranceDuration)
      const ease = 1 - Math.pow(1 - t, 3) // easeOutCubic
      activeDist = startDist + (currentDist - startDist) * ease
    }

    camera.position.x = cameraTarget.x + activeDist * Math.sin(rotY) * Math.cos(rotX)
    camera.position.y = cameraTarget.y + activeDist * Math.sin(rotX) + 35
    camera.position.z = cameraTarget.z + activeDist * Math.cos(rotY) * Math.cos(rotX)
    camera.lookAt(cameraTarget)

    renderer.render(scene, camera)
  }
  animate()

  return scene
}

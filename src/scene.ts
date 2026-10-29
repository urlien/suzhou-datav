import * as THREE from "three"
import { generateSatelliteTexture, generateRegistrationReferenceTexture, applySatelliteTexture } from "./components/satellite-texture"
import { createTerrainAtlasTexture } from "./components/terrain-atlas"
import { setTerrainHeightGrid, BOUNDS } from "./utils/geo"
import { resolveTerrainMode } from "./utils/terrain-mode"
import { createNearImagery } from "./components/near-imagery"

interface DemData {
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
  points: [number, number, number][]
}

type FrameCallback = (time: number, deltaTime: number) => void
const frameCallbacks: FrameCallback[] = []

export function registerFrameCallback(cb: FrameCallback) {
  frameCallbacks.push(cb)
}

let entranceStart = 0
let dragMoved = false
let cameraTarget = new THREE.Vector3(0, 8, 0)
let desiredTarget = new THREE.Vector3(0, 8, 0)
let currentDist = 210
let desiredDist = 210
let rotY = 0.3
let rotX = 0.55

export function startEntranceAnimation() {
  entranceStart = performance.now()
}

export function skipEntranceAnimation() {
  entranceStart = -Infinity
}

export function wasCanvasDragged(): boolean {
  return dragMoved
}

export function flyCameraTo(x: number, z: number, zoomDist = 135) {
  desiredTarget.set(x, 5, z)
  desiredDist = zoomDist
}

export function resetCameraView() {
  desiredTarget.set(0, 8, 0)
  desiredDist = 210
  rotY = 0.3
  rotX = 0.55
}

export function setMapViewDistance(distance: number) {
  skipEntranceAnimation()
  desiredDist = Math.max(18, Math.min(750, distance))
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
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.25)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xfff8e7, 1.8)
  dirLight.position.set(100, 200, 100)
  scene.add(dirLight)

  const dirLight2 = new THREE.DirectionalLight(0xddeeff, 0.65)
  dirLight2.position.set(-100, 150, -100)
  scene.add(dirLight2)

  const resp = await fetch("/suzhou_dem.json")
  const dem: DemData = await resp.json()
  const terrainMode = resolveTerrainMode()
  // The diagnostic imagery view exaggerates height only; horizontal positions
  // retain their existing geographic alignment.
  const verticalScale = terrainMode === "registration" ? 11 : 6

  // 构建与 BOUNDS 严格对齐的高清 DEM 网格（260x260）
  const gridSize = 260
  const minLat = BOUNDS.minLat, maxLat = BOUNDS.maxLat
  const minLon = BOUNDS.minLon, maxLon = BOUNDS.maxLon

  const rawGrid: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))
  const count: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))

  for (const [lon, lat, elev] of dem.points) {
    if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) continue
    const x = Math.floor(((lon - minLon) / (maxLon - minLon)) * (gridSize - 1))
    const y = (gridSize - 1) - Math.floor(((lat - minLat) / (maxLat - minLat)) * (gridSize - 1))
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      rawGrid[y][x] += elev
      count[y][x]++
    }
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (count[y][x] > 0) {
        rawGrid[y][x] /= count[y][x]
      }
    }
  }

  // 迭代邻域补洞（Inpainting），修复 DEM 原始点稀疏导致的空洞与凹坑噪点
  for (let pass = 0; pass < 10; pass++) {
    let filled = 0
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (count[y][x] > 0) continue
        let sum = 0, n = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx
            if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize && count[ny][nx] > 0) {
              sum += rawGrid[ny][nx]
              n++
            }
          }
        }
        if (n > 0) {
          rawGrid[y][x] = sum / n
          count[y][x] = 1
          filled++
        }
      }
    }
    if (filled === 0) break
  }

  // 3x3 高斯平滑卷积核，消除台阶伪影
  const grid: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1],
  ]
  let maxElev = 0
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let sum = 0, weight = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize) {
            const w = kernel[dy + 1][dx + 1]
            sum += rawGrid[ny][nx] * w
            weight += w
          }
        }
      }
      grid[y][x] = sum / (weight || 1)
      if (grid[y][x] > maxElev) maxElev = grid[y][x]
    }
  }

  // 缓存地形高程网格供建筑、边界、热力图双线性采样
  setTerrainHeightGrid(grid, maxElev || 1, verticalScale)

  const geometry = new THREE.PlaneGeometry(200, 200, gridSize - 1, gridSize - 1)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)

  for (let i = 0; i < positions.count; i++) {
    const x = i % gridSize
    const y = Math.floor(i / gridSize)
    const elev = (grid[y][x] / (maxElev || 1)) * verticalScale // 平原地形，适度保留低丘起伏
    positions.setZ(i, elev)

    const t = elev / verticalScale
    let r: number, g: number, b: number

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

  // Keep the earlier view available for visual comparison. The atlas is the
  // default because the remote satellite tiles may fail or load only partly.
  const atlasMode = terrainMode !== "legacy"
  const imageryMode = terrainMode === "satellite" || terrainMode === "registration"
  const atlasTexture = atlasMode
    ? await createTerrainAtlasTexture(grid, terrainMode === "island")
    : null
  const terrainMaterial = atlasMode
    ? imageryMode
      ? new THREE.MeshPhongMaterial({
          map: atlasTexture,
          side: THREE.DoubleSide,
          color: 0xd5d5d5,
          shininess: 4,
          specular: new THREE.Color(0x101010),
        })
      : new THREE.MeshBasicMaterial({
          map: atlasTexture,
          side: THREE.DoubleSide,
          alphaTest: 0.01,
        })
    : new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        shininess: 25,
        specular: new THREE.Color(0x222222),
      })
  const terrain = new THREE.Mesh(geometry, terrainMaterial)
  terrain.name = "terrain"
  terrain.rotation.x = -Math.PI / 2
  scene.add(terrain)
  const updateNearImagery = terrainMode === 'registration' ? createNearImagery(scene) : null

  // Satellite imagery remains an explicit optional mode, rather than an
  // unreliable dependency of the default map view.
  if (terrainMode === "satellite") {
    const footer = document.getElementById("terrain-mode-status")
    if (footer) footer.textContent = "天地图卫星影像加载中…"
    generateSatelliteTexture(BOUNDS)
      .then(satelliteTexture => {
        if (satelliteTexture) {
          applySatelliteTexture(terrain, satelliteTexture)
          if (footer) footer.textContent = "卫星影像：天地图；地形高程：ASTER GDEM V3"
        } else if (footer) {
          footer.textContent = "卫星影像未加载，当前显示本地高程设色地形"
        }
      })
      .catch(err => {
        if (footer) footer.textContent = "卫星影像未加载，当前显示本地高程设色地形"
        console.warn("[Satellite] 异步贴图加载异常:", err)
      })
  } else if (terrainMode === "registration") {
    const footer = document.getElementById("terrain-mode-status")
    if (footer) footer.textContent = "配准影像：Esri、Maxar、Earthstar Geographics、GIS User Community｜起伏增强，仅供核查"
    generateRegistrationReferenceTexture(grid)
      .then(texture => applySatelliteTexture(terrain, texture))
      .catch(err => {
        if (footer) footer.textContent = "配准核查影像加载失败，当前显示本地地形纹理"
        console.warn("[Registration] 参考影像加载失败:", err)
      })
  }

  const gridHelper = new THREE.GridHelper(200, 20, 0x2d3a5c, 0x1e2942)
  gridHelper.position.y = -0.5
  gridHelper.name = "grid-helper"
  scene.add(gridHelper)

  camera.position.set(70, 110, 140)
  camera.lookAt(cameraTarget)
  scene.add(camera)

  let isDragging = false
  let downX = 0, downY = 0
  let prevX = 0, prevY = 0
  const entranceDuration = 5600
  const startDist = 720

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return
    skipEntranceAnimation()
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
      skipEntranceAnimation()
      desiredDist += e.deltaY * 0.25
      desiredDist = Math.max(18, Math.min(750, desiredDist))
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
  let lastTime = performance.now()

  function animate() {
    requestAnimationFrame(animate)

    const now = performance.now()
    const timeSec = now * 0.001
    const deltaSec = Math.min((now - lastTime) * 0.001, 0.1)
    lastTime = now

    // 统一驱动飞线、热力图等子模块的帧动画（传入 timeSec 与 deltaSec 实现帧率无关动画）
    for (let i = 0; i < frameCallbacks.length; i++) {
      frameCallbacks[i](timeSec, deltaSec)
    }

    // 基于 deltaSec 的平滑指数阻尼衰减，无论 60Hz 还是 144Hz 都能呈现完全一致的手感
    const dampFactor = 1 - Math.exp(-6.5 * deltaSec)
    cameraTarget.lerp(desiredTarget, dampFactor)
    currentDist += (desiredDist - currentDist) * dampFactor

    const viewLevel = desiredDist > 155 ? 'city' : desiredDist > 82 ? 'region' : 'near'
    document.querySelectorAll<HTMLButtonElement>('#map-scale button[data-view-level]').forEach(button => {
      const selected = button.dataset.viewLevel === viewLevel
      button.classList.toggle('active', selected)
      button.setAttribute('aria-pressed', String(selected))
    })

    const elapsed = now - entranceStart
    let activeDist = currentDist
    if (elapsed < entranceDuration && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const t = Math.max(0, elapsed / entranceDuration)
      const ease = t * t * (3 - 2 * t) // smoother spatial approach with gentle arrival
      activeDist = startDist + (currentDist - startDist) * ease
    }

    camera.position.x = cameraTarget.x + activeDist * Math.sin(rotY) * Math.cos(rotX)
    camera.position.y = cameraTarget.y + activeDist * Math.sin(rotX) + 32 * Math.min(1, activeDist / 210)
    camera.position.z = cameraTarget.z + activeDist * Math.cos(rotY) * Math.cos(rotX)
    camera.lookAt(cameraTarget)

    updateNearImagery?.(cameraTarget, activeDist, now)

    // 缩放层级影响标注与边界墙，所有地形模式保持一致的地图阅读层级。
    const boundary = scene.getObjectByName('boundary-group')
    const scale = Math.max(0.18, Math.min(1, activeDist / 210))
    boundary?.children.forEach(obj => {
      if (obj.userData?.type === 'boundary-label-group') {
        const sprite = obj.children.find(child => child instanceof THREE.Sprite) as THREE.Sprite | undefined
        if (sprite) {
          const emphasis = sprite.userData.highlightScale || 1
          sprite.scale.set(sprite.userData.baseScaleX * scale * emphasis, sprite.userData.baseScaleY * scale, 1)
        }
      } else if (obj.userData?.type === 'boundary-wall' && obj instanceof THREE.Mesh) {
        ;(obj.material as THREE.MeshBasicMaterial).opacity = Math.max(0.08, Math.min(1, (activeDist - 20) / 140))
      }
    })

    renderer.render(scene, camera)
  }
  animate()

  return scene
}


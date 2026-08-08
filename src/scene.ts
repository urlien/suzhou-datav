import * as THREE from "three"

interface DemData {
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
  points: [number, number, number][]
}

export async function initScene(): Promise<THREE.Scene> {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0e1a)
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.0008)

  const container = document.getElementById("canvas-container")!
  const canvas = document.getElementById("canvas") as HTMLCanvasElement
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 5000)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene.add(new THREE.AmbientLight(0x334466, 1.5))
  const dirLight = new THREE.DirectionalLight(0x00d4ff, 0.8)
  dirLight.position.set(50, 100, 50)
  scene.add(dirLight)
  const pointLight = new THREE.PointLight(0x00ff88, 0.5, 500)
  pointLight.position.set(-50, 80, -50)
  scene.add(pointLight)

  const resp = await fetch("/suzhou_dem.json")
  const dem: DemData = await resp.json()

  const gridSize = 300
  const minLat = dem.bounds.minLat, maxLat = dem.bounds.maxLat
  const minLon = dem.bounds.minLon, maxLon = dem.bounds.maxLon

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

  for (let i = 0; i < positions.count; i++) {
    const x = i % gridSize
    const y = Math.floor(i / gridSize)
    const elev = grid[y][x] / maxElev * 30
    positions.setZ(i, elev)

    const t = elev / 30
    let r: number, g: number, b: number
    if (t < 0.2) {
      r = 0; g = 0.3 + t * 2; b = 0.5 + t
    } else if (t < 0.5) {
      const tt = (t - 0.2) / 0.3
      r = tt * 0.2; g = 0.5 + tt * 0.3; b = 0.3 - tt * 0.2
    } else if (t < 0.8) {
      const tt = (t - 0.5) / 0.3
      r = 0.2 + tt * 0.5; g = 0.8 - tt * 0.3; b = 0.1
    } else {
      const tt = (t - 0.8) / 0.2
      r = 0.7 + tt * 0.3; g = 0.5 - tt * 0.3; b = 0.1
    }
    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()

  const terrain = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    shininess: 10,
  }))
  terrain.rotation.x = -Math.PI / 2
  scene.add(terrain)

  const gridHelper = new THREE.GridHelper(200, 30, 0x1a2744, 0x0d1225)
  gridHelper.position.y = -0.5
  scene.add(gridHelper)

  camera.position.set(80, 120, 150)
  camera.lookAt(0, 0, 0)

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
    rotY += (e.clientX - prevX) * 0.005
    rotX += (e.clientY - prevY) * 0.005
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

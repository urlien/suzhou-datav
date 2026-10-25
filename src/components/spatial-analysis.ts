import * as THREE from 'three'
import { geoTo3D, getTerrainHeightAtXZ } from '../utils/geo'

// 苏州A级景区真实坐标
const scenicSpots = [
  { name: '拙政园', lat: 31.3281, lon: 120.6313, level: 5 },
  { name: '留园', lat: 31.3194, lon: 120.6169, level: 5 },
  { name: '虎丘', lat: 31.3253, lon: 120.5769, level: 5 },
  { name: '周庄', lat: 31.1158, lon: 120.8486, level: 5 },
  { name: '同里', lat: 31.1583, lon: 120.7253, level: 5 },
  { name: '金鸡湖', lat: 31.3194, lon: 120.7053, level: 5 },
  { name: '寒山寺', lat: 31.3194, lon: 120.6003, level: 4 },
  { name: '狮子林', lat: 31.3247, lon: 120.6303, level: 4 },
  { name: '耦园', lat: 31.3247, lon: 120.6381, level: 4 },
  { name: '网师园', lat: 31.3139, lon: 120.6319, level: 4 },
  { name: '沧浪亭', lat: 31.3083, lon: 120.6319, level: 4 },
  { name: '盘门景区', lat: 31.3083, lon: 120.5847, level: 4 },
  { name: '木渎古镇', lat: 31.2583, lon: 120.4319, level: 4 },
  { name: '东山景区', lat: 31.1583, lon: 120.2819, level: 5 },
  { name: '西山景区', lat: 31.1083, lon: 120.3819, level: 5 },
  { name: '沙家浜', lat: 31.6583, lon: 120.7819, level: 5 },
  { name: '虞山', lat: 31.6583, lon: 120.7319, level: 5 },
  { name: '尚湖', lat: 31.6083, lon: 120.7319, level: 5 },
  { name: '阳澄湖半岛', lat: 31.4083, lon: 120.8319, level: 4 },
  { name: '千灯古镇', lat: 31.2819, lon: 120.9819, level: 4 },
  { name: '锦溪古镇', lat: 31.1819, lon: 120.9319, level: 4 },
  { name: '甪直古镇', lat: 31.2819, lon: 120.8819, level: 4 },
  { name: '上方山', lat: 31.2583, lon: 120.5319, level: 4 },
  { name: '大阳山', lat: 31.3083, lon: 120.4319, level: 4 },
]

// 核密度分析（使用4通道RGBA顶点颜色，低密度区域全透明，不遮挡底图）
export function addKernelDensity(scene: THREE.Scene): THREE.Mesh {
  const existing = scene.getObjectByName('kernel-density') as THREE.Mesh | undefined
  if (existing) {
    existing.visible = true
    return existing
  }

  const gridSize = 120
  const bandwidth = 5.5 // 带宽（3D单位）
  const grid: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))

  const spotCoords = scenicSpots.map(s => ({
    ...geoTo3D(s.lat, s.lon),
    weight: s.level === 5 ? 1.5 : 1.0,
  }))

  let maxDensity = 0
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const gx = (x / (gridSize - 1)) * 200 - 100
      const gz = (y / (gridSize - 1)) * 200 - 100

      let density = 0
      for (const spot of spotCoords) {
        const dx = gx - spot.x
        const dz = gz - spot.z
        const dist2 = dx * dx + dz * dz
        density += spot.weight * Math.exp(-dist2 / (2 * bandwidth * bandwidth))
      }
      grid[y][x] = density
      if (density > maxDensity) maxDensity = density
    }
  }

  const geometry = new THREE.PlaneGeometry(200, 200, gridSize - 1, gridSize - 1)
  const positions = geometry.attributes.position
  // 4通道 RGBA 顶点颜色，使低密度背景完全透明
  const colors = new Float32Array(positions.count * 4)

  for (let i = 0; i < positions.count; i++) {
    const x = i % gridSize
    const y = Math.floor(i / gridSize)
    const d = maxDensity > 0 ? grid[y][x] / maxDensity : 0

    let r = 0, g = 0, b = 0, a = 0
    if (d < 0.06) {
      r = 0; g = 0; b = 0; a = 0
    } else if (d < 0.25) {
      const t = (d - 0.06) / 0.19
      r = 0; g = t * 0.6; b = 0.8 + t * 0.2; a = t * 0.45
    } else if (d < 0.5) {
      const t = (d - 0.25) / 0.25
      r = t * 0.2; g = 0.6 + t * 0.4; b = 1 - t * 0.6; a = 0.45 + t * 0.2
    } else if (d < 0.78) {
      const t = (d - 0.5) / 0.28
      r = 0.2 + t * 0.8; g = 1.0 - t * 0.15; b = 0.4 - t * 0.4; a = 0.65 + t * 0.15
    } else {
      const t = (d - 0.78) / 0.22
      r = 1.0; g = 0.85 - t * 0.65; b = 0.0; a = 0.8 + t * 0.15
    }

    // 高密度核心产生微凸立体效果
    positions.setZ(i, d * 2.2)

    colors[i * 4] = r
    colors[i * 4 + 1] = g
    colors[i * 4 + 2] = b
    colors[i * 4 + 3] = a
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 1.1
  mesh.name = 'kernel-density'
  scene.add(mesh)

  return mesh
}

// 标准差椭圆（含协方差主轴方向角旋转与景区散点）
export function addStandardDeviationalEllipse(scene: THREE.Scene): THREE.Group {
  const existing = scene.getObjectByName('std-ellipse-group') as THREE.Group | undefined
  if (existing) {
    existing.visible = true
    return existing
  }

  const group = new THREE.Group()
  group.name = 'std-ellipse-group'

  let cx = 0, cz = 0
  const positions = scenicSpots.map(s => geoTo3D(s.lat, s.lon))
  for (const p of positions) {
    cx += p.x
    cz += p.z
  }
  cx /= positions.length
  cz /= positions.length

  let sumDx2 = 0, sumDz2 = 0, sumDxDz = 0
  for (const p of positions) {
    const dx = p.x - cx
    const dz = p.z - cz
    sumDx2 += dx * dx
    sumDz2 += dz * dz
    sumDxDz += dx * dz
  }
  const n = positions.length
  // 利用协方差矩阵计算主轴旋转角 theta 与长短半轴标准差
  const theta = 0.5 * Math.atan2(2 * sumDxDz, sumDx2 - sumDz2)
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)

  let sumU2 = 0, sumV2 = 0
  for (const p of positions) {
    const dx = p.x - cx
    const dz = p.z - cz
    const u = dx * cosT + dz * sinT
    const v = -dx * sinT + dz * cosT
    sumU2 += u * u
    sumV2 += v * v
  }
  const sdU = Math.sqrt(sumU2 / n) * 1.8
  const sdV = Math.sqrt(sumV2 / n) * 1.8

  // 创建旋转后的椭圆轮廓与半透明填充面
  const ellipsePoints: THREE.Vector3[] = []
  const shape = new THREE.Shape()
  const segments = 72
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const u = sdU * Math.cos(angle)
    const v = sdV * Math.sin(angle)
    const x = cx + u * cosT - v * sinT
    const z = cz + u * sinT + v * cosT
    const y = getTerrainHeightAtXZ(x, z) + 1.6
    ellipsePoints.push(new THREE.Vector3(x, y, z))
    if (i === 0) shape.moveTo(x, -z)
    else shape.lineTo(x, -z)
  }

  const fillGeo = new THREE.ShapeGeometry(shape)
  const fillMesh = new THREE.Mesh(
    fillGeo,
    new THREE.MeshBasicMaterial({
      color: 0xff9f43,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  )
  fillMesh.rotation.x = -Math.PI / 2
  fillMesh.position.y = 1.4
  group.add(fillMesh)

  const ellipseGeometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints)
  const ellipseMaterial = new THREE.LineBasicMaterial({
    color: 0xff9f43,
    linewidth: 2,
    transparent: true,
    opacity: 0.95,
  })
  const ellipse = new THREE.Line(ellipseGeometry, ellipseMaterial)
  ellipse.name = 'std-ellipse'
  group.add(ellipse)

  // 绘制长短主轴十字线
  const majorAxis = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(cx - sdU * cosT, 1.8, cz - sdU * sinT),
    new THREE.Vector3(cx + sdU * cosT, 1.8, cz + sdU * sinT),
  ])
  const minorAxis = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(cx + sdV * sinT, 1.8, cz - sdV * cosT),
    new THREE.Vector3(cx - sdV * sinT, 1.8, cz + sdV * cosT),
  ])
  const axisMat = new THREE.LineBasicMaterial({ color: 0xffd93d, transparent: true, opacity: 0.65 })
  group.add(new THREE.Line(majorAxis, axisMat))
  group.add(new THREE.Line(minorAxis, axisMat))

  // 添加重心标记
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff4757 })
  )
  center.position.set(cx, 2.5, cz)
  center.name = 'ellipse-center'
  group.add(center)

  scene.add(group)
  return group
}

// 可达性分析（以姑苏古城区/苏州站为核心的 10/20/30/60 分钟等时圈）
export function addAccessibilityAnalysis(scene: THREE.Scene): THREE.Group {
  const existing = scene.getObjectByName('accessibility-group') as THREE.Group | undefined
  if (existing) {
    existing.visible = true
    return existing
  }

  const group = new THREE.Group()
  group.name = 'accessibility-group'

  const center = geoTo3D(31.30, 120.63)

  const timeZones = [
    { minutes: 10, inner: 0, outer: 12, color: 0x00ff88, opacity: 0.26 },
    { minutes: 20, inner: 12, outer: 24, color: 0x00d4ff, opacity: 0.22 },
    { minutes: 30, inner: 24, outer: 38, color: 0x54a0ff, opacity: 0.18 },
    { minutes: 60, inner: 38, outer: 58, color: 0xa855f7, opacity: 0.14 },
  ]

  for (const zone of timeZones) {
    // 填充环带
    const fillGeo = new THREE.RingGeometry(zone.inner, zone.outer, 72)
    const fillMat = new THREE.MeshBasicMaterial({
      color: zone.color,
      transparent: true,
      opacity: zone.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const fillRing = new THREE.Mesh(fillGeo, fillMat)
    fillRing.rotation.x = -Math.PI / 2
    fillRing.position.set(center.x, 0.9, center.z)
    fillRing.name = `accessibility-${zone.minutes}min`
    group.add(fillRing)

    // 边界亮环
    const borderGeo = new THREE.RingGeometry(zone.outer - 0.35, zone.outer, 72)
    const borderMat = new THREE.MeshBasicMaterial({
      color: zone.color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const borderRing = new THREE.Mesh(borderGeo, borderMat)
    borderRing.rotation.x = -Math.PI / 2
    borderRing.position.set(center.x, 0.95, center.z)
    group.add(borderRing)
  }

  // 中心锥标
  const marker = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 4.5, 12),
    new THREE.MeshBasicMaterial({ color: 0xff4757 })
  )
  marker.position.set(center.x, 2.8, center.z)
  marker.name = 'accessibility-center'
  group.add(marker)

  scene.add(group)
  return group
}

import * as THREE from 'three'

// 苏州市A级景点坐标数据（基于Paper 2数据）
const scenicSpots = [
  { name: '拙政园', lat: 31.3281, lon: 120.6313, level: 5 },
  { name: '留园', lat: 31.3194, lon: 120.6169, level: 5 },
  { name: '虎丘', lat: 31.3253, lon: 120.5769, level: 5 },
  { name: '周庄', lat: 31.1158, lon: 120.8486, level: 5 },
  { name: '同里', lat: 31.1583, lon: 120.7253, level: 5 },
  { name: '金鸡湖', lat: 31.3194, lon: 120.7053, level: 4 },
  { name: '寒山寺', lat: 31.3194, lon: 120.6003, level: 4 },
  { name: '狮子林', lat: 31.3247, lon: 120.6303, level: 4 },
  { name: '耦园', lat: 31.3247, lon: 120.6381, level: 4 },
  { name: '网师园', lat: 31.3139, lon: 120.6319, level: 4 },
  { name: '沧浪亭', lat: 31.3083, lon: 120.6319, level: 4 },
  { name: '苏州乐园', lat: 31.3083, lon: 120.5847, level: 4 },
  { name: '太湖湿地', lat: 31.2583, lon: 120.4319, level: 4 },
  { name: '西山', lat: 31.1583, lon: 120.2819, level: 4 },
  { name: '东山', lat: 31.1083, lon: 120.3819, level: 4 },
  { name: '沙家浜', lat: 31.6583, lon: 120.7819, level: 4 },
  { name: '虞山', lat: 31.6583, lon: 120.7319, level: 4 },
  { name: '尚湖', lat: 31.6083, lon: 120.7319, level: 4 },
  { name: '阳澄湖', lat: 31.4083, lon: 120.8319, level: 4 },
  { name: '千灯', lat: 31.2819, lon: 120.9819, level: 3 },
  { name: '锦溪', lat: 31.1819, lon: 120.9319, level: 3 },
  { name: '甪直', lat: 31.2819, lon: 120.8819, level: 3 },
  { name: '木渎', lat: 31.2583, lon: 120.5319, level: 3 },
  { name: '光福', lat: 31.3083, lon: 120.4319, level: 3 },
]

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200 - 100
  return new THREE.Vector3(x, 0, z)
}

// 核密度分析
export function addKernelDensity(scene: THREE.Scene) {
  const gridSize = 100
  const bandwidth = 5 // 带宽（3D单位）
  const grid: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))

  // 计算每个网格点的核密度值
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const gx = (x / gridSize) * 200 - 100
      const gz = (y / gridSize) * 200 - 100

      let density = 0
      for (const spot of scenicSpots) {
        const pos = geoTo3D(spot.lat, spot.lon)
        const dx = gx - pos.x
        const dz = gz - pos.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        // 高斯核函数
        density += Math.exp(-(dist * dist) / (2 * bandwidth * bandwidth))
      }
      grid[y][x] = density
    }
  }

  // 找最大密度值用于归一化
  let maxDensity = 0
  for (const row of grid) {
    for (const v of row) {
      if (v > maxDensity) maxDensity = v
    }
  }

  // 创建热力图平面
  const geometry = new THREE.PlaneGeometry(200, 200, gridSize - 1, gridSize - 1)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)

  for (let i = 0; i < positions.count; i++) {
    const x = i % gridSize
    const y = Math.floor(i / gridSize)
    const density = grid[y][x] / maxDensity

    // 颜色映射：透明→蓝→绿→黄→红
    let r, g, b, a
    if (density < 0.1) {
      r = 0; g = 0; b = 0; a = 0
    } else if (density < 0.3) {
      r = 0; g = 0; b = density * 3; a = density * 0.3
    } else if (density < 0.5) {
      r = 0; g = density * 2; b = 1 - density; a = density * 0.5
    } else if (density < 0.8) {
      r = density; g = 1; b = 0; a = density * 0.6
    } else {
      r = 1; g = 1 - density; b = 0; a = density * 0.8
    }

    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 1
  mesh.name = 'kernel-density'
  scene.add(mesh)

  return mesh
}

// 标准差椭圆
export function addStandardDeviationalEllipse(scene: THREE.Scene) {
  // 计算中心点
  let cx = 0, cz = 0
  const positions = scenicSpots.map(s => geoTo3D(s.lat, s.lon))
  for (const p of positions) {
    cx += p.x
    cz += p.z
  }
  cx /= positions.length
  cz /= positions.length

  // 计算标准差
  let sumDx2 = 0, sumDz2 = 0, sumDxDz = 0
  for (const p of positions) {
    const dx = p.x - cx
    const dz = p.z - cz
    sumDx2 += dx * dx
    sumDz2 += dz * dz
    sumDxDz += dx * dz
  }
  const n = positions.length
  const sdX = Math.sqrt(sumDx2 / n)
  const sdZ = Math.sqrt(sumDz2 / n)

  // 创建椭圆
  const ellipseGeometry = new THREE.BufferGeometry()
  const ellipsePoints: THREE.Vector3[] = []
  const segments = 64
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = cx + sdX * 2 * Math.cos(angle)
    const z = cz + sdZ * 2 * Math.sin(angle)
    ellipsePoints.push(new THREE.Vector3(x, 2, z))
  }
  ellipseGeometry.setFromPoints(ellipsePoints)

  const ellipseMaterial = new THREE.LineBasicMaterial({
    color: 0xff9f43,
    linewidth: 2,
    transparent: true,
    opacity: 0.8,
  })

  const ellipse = new THREE.Line(ellipseGeometry, ellipseMaterial)
  ellipse.name = 'std-ellipse'
  scene.add(ellipse)

  // 添加中心点标记
  const centerGeometry = new THREE.SphereGeometry(1, 16, 16)
  const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4757 })
  const center = new THREE.Mesh(centerGeometry, centerMaterial)
  center.position.set(cx, 3, cz)
  center.name = 'ellipse-center'
  scene.add(center)

  return ellipse
}

// 可达性分析（简化版：基于直线距离的等时圈）
export function addAccessibilityAnalysis(scene: THREE.Scene) {
  // 以姑苏区为中心，画等时圈
  const centerLat = 31.30
  const centerLon = 120.63
  const center = geoTo3D(centerLat, centerLon)

  const timeZones = [
    { minutes: 10, radius: 15, color: 0x00ff88 },
    { minutes: 20, radius: 30, color: 0x00d4ff },
    { minutes: 30, radius: 45, color: 0x0066ff },
    { minutes: 60, radius: 70, color: 0x6600cc },
  ]

  for (const zone of timeZones) {
    const geometry = new THREE.RingGeometry(zone.radius - 1, zone.radius, 64)
    const material = new THREE.MeshBasicMaterial({
      color: zone.color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(geometry, material)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(center.x, 0.5, center.z)
    ring.name = `accessibility-${zone.minutes}min`
    scene.add(ring)
  }

  // 添加中心标记
  const markerGeometry = new THREE.ConeGeometry(1.5, 4, 8)
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4757 })
  const marker = new THREE.Mesh(markerGeometry, markerMaterial)
  marker.position.set(center.x, 2, center.z)
  marker.name = 'accessibility-center'
  scene.add(marker)
}

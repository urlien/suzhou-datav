import * as THREE from "three"

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200
  return { x, z }
}

// 区县中心坐标
const districtCoords: Record<string, { lat: number; lon: number }> = {
  '昆山市': { lat: 31.39, lon: 120.98 },
  '苏州工业园区': { lat: 31.32, lon: 120.72 },
  '张家港市': { lat: 31.87, lon: 120.55 },
  '常熟市': { lat: 31.65, lon: 120.74 },
  '吴江区': { lat: 31.16, lon: 120.65 },
  '虎丘区': { lat: 31.30, lon: 120.57 },
  '太仓市': { lat: 31.45, lon: 121.10 },
  '吴中区': { lat: 31.26, lon: 120.62 },
  '相城区': { lat: 31.37, lon: 120.62 },
  '姑苏区': { lat: 31.30, lon: 120.63 },
}

// 四套飞线数据（连接、强度、颜色）
interface FlyingLineData {
  name: string
  color: number
  description: string
  lines: { from: string; to: string; strength: number }[]
}

const flyingLineSystems: FlyingLineData[] = [
  {
    name: 'population',
    color: 0x00ff88,
    description: '人口流动',
    lines: [
      { from: '姑苏区', to: '工业园区', strength: 0.9 },
      { from: '姑苏区', to: '虎丘区', strength: 0.7 },
      { from: '姑苏区', to: '相城区', strength: 0.6 },
      { from: '姑苏区', to: '吴中区', strength: 0.5 },
      { from: '昆山市', to: '工业园区', strength: 0.8 },
      { from: '昆山市', to: '太仓市', strength: 0.4 },
      { from: '常熟市', to: '张家港市', strength: 0.5 },
      { from: '常熟市', to: '相城区', strength: 0.4 },
      { from: '吴江区', to: '姑苏区', strength: 0.6 },
      { from: '吴江区', to: '吴中区', strength: 0.3 },
      { from: '太仓市', to: '昆山市', strength: 0.3 },
      { from: '张家港市', to: '常熟市', strength: 0.4 },
    ],
  },
  {
    name: 'transport',
    color: 0x00d4ff,
    description: '交通流量',
    lines: [
      { from: '姑苏区', to: '工业园区', strength: 0.95 },
      { from: '姑苏区', to: '昆山市', strength: 0.7 },
      { from: '姑苏区', to: '常熟市', strength: 0.5 },
      { from: '姑苏区', to: '张家港市', strength: 0.4 },
      { from: '工业园区', to: '昆山市', strength: 0.85 },
      { from: '工业园区', to: '太仓市', strength: 0.6 },
      { from: '昆山市', to: '太仓市', strength: 0.5 },
      { from: '常熟市', to: '张家港市', strength: 0.6 },
      { from: '吴江区', to: '工业园区', strength: 0.5 },
      { from: '虎丘区', to: '相城区', strength: 0.4 },
    ],
  },
  {
    name: 'logistics',
    color: 0xff9f43,
    description: '物流货运',
    lines: [
      { from: '昆山市', to: '工业园区', strength: 0.9 },
      { from: '张家港市', to: '工业园区', strength: 0.7 },
      { from: '太仓市', to: '工业园区', strength: 0.8 },
      { from: '常熟市', to: '工业园区', strength: 0.5 },
      { from: '吴江区', to: '工业园区', strength: 0.4 },
      { from: '昆山市', to: '太仓市', strength: 0.6 },
      { from: '张家港市', to: '常熟市', strength: 0.5 },
      { from: '虎丘区', to: '工业园区', strength: 0.3 },
      { from: '吴中区', to: '工业园区', strength: 0.3 },
    ],
  },
  {
    name: 'economic',
    color: 0xa855f7,
    description: '经济联系',
    lines: [
      { from: '工业园区', to: '昆山市', strength: 0.95 },
      { from: '工业园区', to: '姑苏区', strength: 0.8 },
      { from: '工业园区', to: '虎丘区', strength: 0.7 },
      { from: '昆山市', to: '太仓市', strength: 0.6 },
      { from: '昆山市', to: '张家港市', strength: 0.5 },
      { from: '姑苏区', to: '吴中区', strength: 0.5 },
      { from: '常熟市', to: '张家港市', strength: 0.6 },
      { from: '吴江区', to: '工业园区', strength: 0.5 },
      { from: '相城区', to: '姑苏区', strength: 0.4 },
      { from: '虎丘区', to: '相城区', strength: 0.3 },
    ],
  },
]

let currentSystem = 0 // 当前激活的飞线系统索引
const groupNames = flyingLineSystems.map(s => `flying-lines-${s.name}`)

function createFlyingLineGroup(data: FlyingLineData): THREE.Group {
  const group = new THREE.Group()
  group.name = `flying-lines-${data.name}`

  for (const line of data.lines) {
    const fromCoords = districtCoords[line.from]
    const toCoords = districtCoords[line.to]
    if (!fromCoords || !toCoords) continue

    const start = geoTo3D(fromCoords.lat, fromCoords.lon)
    const end = geoTo3D(toCoords.lat, toCoords.lon)
    const startPos = new THREE.Vector3(start.x, 2, start.z)
    const endPos = new THREE.Vector3(end.x, 2, end.z)

    // 弧高随强度变化
    const arcHeight = 10 + line.strength * 20
    const midPoint = new THREE.Vector3(
      (startPos.x + endPos.x) / 2,
      arcHeight,
      (startPos.z + endPos.z) / 2
    )

    const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos)

    // 线条（透明度随强度变化）
    const points = curve.getPoints(40)
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
    const lineMat = new THREE.LineBasicMaterial({
      color: data.color,
      transparent: true,
      opacity: 0.2 + line.strength * 0.5,
    })
    group.add(new THREE.Line(lineGeo, lineMat))

    // 粒子（2个，相位不同）
    const particleGeo = new THREE.SphereGeometry(0.3, 8, 8)
    for (let p = 0; p < 2; p++) {
      const particleMat = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.9,
      })
      const particle = new THREE.Mesh(particleGeo, particleMat)
      particle.userData = {
        curve,
        progress: p * 0.5,
        speed: 0.001 + line.strength * 0.002,
      }
      group.add(particle)
    }
  }

  // 起点标记（小）
  const originPos = geoTo3D(districtCoords['姑苏区'].lat, districtCoords['姑苏区'].lon)
  const originMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 12, 12),
    new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.9 })
  )
  originMarker.position.set(originPos.x, 3, originPos.z)
  group.add(originMarker)

  return group
}

export function addFlyingLines(scene: THREE.Scene) {
  // 创建所有4套飞线系统
  for (const data of flyingLineSystems) {
    const group = createFlyingLineGroup(data)
    group.visible = false // 默认隐藏
    scene.add(group)
  }

  // 默认显示第一套
  const firstGroup = scene.getObjectByName(groupNames[0])
  if (firstGroup) firstGroup.visible = true

  console.log(`[FlyingLines] 创建了 4 套飞线系统，当前显示: ${flyingLineSystems[0].description}`)

  // 动画循环
  function animate() {
    requestAnimationFrame(animate)
    const time = performance.now() * 0.001

    scene.children.forEach(child => {
      if (!groupNames.includes(child.name)) return
      if (!child.visible) return

      child.children.forEach(obj => {
        if (obj.userData.curve) {
          const data = obj.userData
          data.progress += data.speed
          if (data.progress > 1) data.progress = 0
          const point = data.curve.getPoint(data.progress)
          obj.position.copy(point)
        }
      })
    })
  }
  animate()
}

// 切换飞线系统
export function switchFlyingLineSystem(scene: THREE.Scene, index: number): void {
  if (index < 0 || index >= flyingLineSystems.length) return

  // 隐藏当前
  const currentGroup = scene.getObjectByName(groupNames[currentSystem])
  if (currentGroup) currentGroup.visible = false

  // 显示新的
  currentSystem = index
  const newGroup = scene.getObjectByName(groupNames[currentSystem])
  if (newGroup) newGroup.visible = true

  console.log(`[FlyingLines] 切换到: ${flyingLineSystems[currentSystem].description}`)
}

export function toggleFlyingLines(scene: THREE.Scene): boolean {
  const group = scene.getObjectByName(groupNames[currentSystem])
  if (group) {
    group.visible = !group.visible
    return group.visible
  }
  return false
}

export function getCurrentFlyingLineSystem(): { name: string; description: string; index: number } {
  return {
    name: flyingLineSystems[currentSystem].name,
    description: flyingLineSystems[currentSystem].description,
    index: currentSystem,
  }
}

export function getFlyingLineSystems(): { name: string; description: string }[] {
  return flyingLineSystems.map(s => ({ name: s.name, description: s.description }))
}

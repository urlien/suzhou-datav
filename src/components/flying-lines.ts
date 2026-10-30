import * as THREE from "three"
import { geoTo3D, getDistrictCoords, getTerrainHeightAtXZ, normalizeDistrictName } from "../utils/geo"
import { registerFrameCallback } from "../scene"

// 四套飞线数据（连接、强度、颜色）
interface FlyingLineData {
  name: string
  color: number
  secondaryColor: number
  description: string
  lines: { from: string; to: string; strength: number }[]
}

const flyingLineSystems: FlyingLineData[] = [
  {
    name: 'population',
    color: 0x00ff88,
    secondaryColor: 0x00d4ff,
    description: '人口流动',
    lines: [
      { from: '姑苏区', to: '苏州工业园区', strength: 0.95 },
      { from: '姑苏区', to: '虎丘区', strength: 0.75 },
      { from: '姑苏区', to: '相城区', strength: 0.65 },
      { from: '姑苏区', to: '吴中区', strength: 0.6 },
      { from: '昆山市', to: '苏州工业园区', strength: 0.85 },
      { from: '昆山市', to: '太仓市', strength: 0.45 },
      { from: '常熟市', to: '张家港市', strength: 0.55 },
      { from: '常熟市', to: '相城区', strength: 0.45 },
      { from: '吴江区', to: '姑苏区', strength: 0.65 },
      { from: '吴江区', to: '吴中区', strength: 0.5 },
      { from: '太仓市', to: '昆山市', strength: 0.4 },
      { from: '张家港市', to: '常熟市', strength: 0.45 },
    ],
  },
  {
    name: 'transport',
    color: 0x00d4ff,
    secondaryColor: 0x54a0ff,
    description: '交通流量',
    lines: [
      { from: '姑苏区', to: '苏州工业园区', strength: 0.95 },
      { from: '姑苏区', to: '昆山市', strength: 0.75 },
      { from: '姑苏区', to: '常熟市', strength: 0.55 },
      { from: '姑苏区', to: '张家港市', strength: 0.45 },
      { from: '苏州工业园区', to: '昆山市', strength: 0.9 },
      { from: '苏州工业园区', to: '太仓市', strength: 0.6 },
      { from: '昆山市', to: '太仓市', strength: 0.55 },
      { from: '常熟市', to: '张家港市', strength: 0.6 },
      { from: '吴江区', to: '苏州工业园区', strength: 0.6 },
      { from: '虎丘区', to: '相城区', strength: 0.5 },
    ],
  },
  {
    name: 'logistics',
    color: 0xff9f43,
    secondaryColor: 0xffd93d,
    description: '物流货运',
    lines: [
      { from: '昆山市', to: '苏州工业园区', strength: 0.9 },
      { from: '张家港市', to: '苏州工业园区', strength: 0.75 },
      { from: '太仓市', to: '苏州工业园区', strength: 0.85 },
      { from: '常熟市', to: '苏州工业园区', strength: 0.55 },
      { from: '吴江区', to: '苏州工业园区', strength: 0.5 },
      { from: '昆山市', to: '太仓市', strength: 0.65 },
      { from: '张家港市', to: '常熟市', strength: 0.55 },
      { from: '虎丘区', to: '苏州工业园区', strength: 0.45 },
      { from: '吴中区', to: '苏州工业园区', strength: 0.4 },
    ],
  },
  {
    name: 'economic',
    color: 0xa855f7,
    secondaryColor: 0xff6b9d,
    description: '经济联系',
    lines: [
      { from: '苏州工业园区', to: '昆山市', strength: 0.95 },
      { from: '苏州工业园区', to: '姑苏区', strength: 0.85 },
      { from: '苏州工业园区', to: '虎丘区', strength: 0.75 },
      { from: '昆山市', to: '太仓市', strength: 0.65 },
      { from: '昆山市', to: '张家港市', strength: 0.55 },
      { from: '姑苏区', to: '吴中区', strength: 0.55 },
      { from: '常熟市', to: '张家港市', strength: 0.6 },
      { from: '吴江区', to: '苏州工业园区', strength: 0.6 },
      { from: '相城区', to: '姑苏区', strength: 0.5 },
      { from: '虎丘区', to: '相城区', strength: 0.45 },
    ],
  },
]

let currentSystem = 0
const groupNames = flyingLineSystems.map(s => `flying-lines-${s.name}`)

function createFlyingLineGroup(data: FlyingLineData): THREE.Group {
  const group = new THREE.Group()
  group.name = `flying-lines-${data.name}`

  const endpointSet = new Set<string>()

  for (const line of data.lines) {
    const fromName = normalizeDistrictName(line.from)
    const toName = normalizeDistrictName(line.to)
    const fromCoords = getDistrictCoords(fromName)
    const toCoords = getDistrictCoords(toName)
    if (!fromCoords || !toCoords) continue

    endpointSet.add(fromName)
    endpointSet.add(toName)

    const start = geoTo3D(fromCoords.lat, fromCoords.lon)
    const end = geoTo3D(toCoords.lat, toCoords.lon)
    const startY = getTerrainHeightAtXZ(start.x, start.z) + 0.8
    const endY = getTerrainHeightAtXZ(end.x, end.z) + 0.8
    const startPos = new THREE.Vector3(start.x, startY, start.z)
    const endPos = new THREE.Vector3(end.x, endY, end.z)

    // 弧高随距离和强度自适应
    const dist = startPos.distanceTo(endPos)
    const arcHeight = Math.max(12, dist * 0.42 + line.strength * 14)
    const midPoint = new THREE.Vector3(
      (startPos.x + endPos.x) / 2,
      Math.max(startY, endY) + arcHeight,
      (startPos.z + endPos.z) / 2
    )

    const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos)

    // 全域视距下保持可辨的主体和柔光，仍只是关系示意。
    const tubeRadius = 0.24 + line.strength * 0.24
    const lineColor = new THREE.Color(data.color).lerp(new THREE.Color(data.secondaryColor), 1 - line.strength)
    const halo = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, tubeRadius * 2.2, 5, false),
      new THREE.MeshBasicMaterial({ color: lineColor, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false })
    )
    halo.renderOrder = 20
    group.add(halo)
    const tubeMat = new THREE.MeshBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.64 + line.strength * 0.22,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    })
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, tubeRadius, 6, false), tubeMat)
    tube.renderOrder = 21
    group.add(tube)

    // 每条连接只保留一个移动光点和一个尾迹，控制全域绘制开销。
    const baseSpeed = 0.0022 + line.strength * 0.0025
    for (let p = 0; p < 1; p++) {
      const headProgress = p * 0.5
      const tailLengths = [0, 0.045]
      const radii = [0.9, 0.48]
      const opacities = [1, 0.52]

      for (let t = 0; t < tailLengths.length; t++) {
        const sphereGeo = new THREE.SphereGeometry(radii[t], 8, 8)
        const sphereMat = new THREE.MeshBasicMaterial({
          color: t === 0 ? 0xffffff : data.color,
          transparent: true,
          opacity: opacities[t],
          blending: THREE.AdditiveBlending,
          depthTest: false,
          depthWrite: false,
        })
        const particle = new THREE.Mesh(sphereGeo, sphereMat)
        particle.renderOrder = 22
        particle.position.copy(curve.getPoint((headProgress - tailLengths[t] + 1) % 1))
        particle.userData = {
          curve,
          progress: (headProgress - tailLengths[t] + 1) % 1,
          speed: baseSpeed,
        }
        group.add(particle)
      }
    }
  }

  // 为所有参与连接的区县添加底座光环节点
  endpointSet.forEach(districtName => {
    const coords = getDistrictCoords(districtName)
    if (!coords) return
    const pos = geoTo3D(coords.lat, coords.lon)
    const y = getTerrainHeightAtXZ(pos.x, pos.z) + 0.6
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 10, 10),
      new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })
    )
    marker.renderOrder = 22
    marker.position.set(pos.x, y, pos.z)
    group.add(marker)
  })

  return group
}

export function addFlyingLines(scene: THREE.Scene) {
  for (const data of flyingLineSystems) {
    const group = createFlyingLineGroup(data)
    group.visible = false
    scene.add(group)
  }

  const firstGroup = scene.getObjectByName(groupNames[0])
  if (firstGroup) firstGroup.visible = true

  console.log(`[FlyingLines] 创建了 4 套飞线系统，当前显示: ${flyingLineSystems[0].description}`)

  // 注册到主场景统一渲染循环（基于 deltaSec 归一化粒子流速，彻底消除高刷新率屏幕下的速度翻倍现象）
  registerFrameCallback((_timeSec, deltaSec) => {
    const dt = deltaSec || 0.016
    scene.children.forEach(child => {
      if (!groupNames.includes(child.name) || !child.visible) return

      child.children.forEach(obj => {
        if (obj.userData.curve) {
          const data = obj.userData
          data.progress += data.speed * (dt * 60)
          if (data.progress > 1) data.progress -= 1
          const point = data.curve.getPoint(data.progress)
          obj.position.copy(point)
        }
      })
    })
  })
}

export function switchFlyingLineSystem(scene: THREE.Scene, index: number): void {
  if (index < 0 || index >= flyingLineSystems.length) return

  const currentGroup = scene.getObjectByName(groupNames[currentSystem])
  if (currentGroup) currentGroup.visible = false

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

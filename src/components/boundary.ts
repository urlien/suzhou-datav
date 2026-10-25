import * as THREE from 'three'
import { getTerrainHeightAtXZ, lonLatTo3D, normalizeDistrictName } from '../utils/geo'
import { filterState } from './filter'

let boundaryVisible = true

const districtColors: Record<string, number> = {
  '虎丘区': 0x4ecdc4,
  '吴中区': 0xff6b6b,
  '相城区': 0x45b7d1,
  '姑苏区': 0xf7b731,
  '苏州工业园区': 0x00ff88,
  '吴江区': 0x2ed573,
  '常熟市': 0xff9ff3,
  '张家港市': 0x54a0ff,
  '昆山市': 0x48dbfb,
  '太仓市': 0xff6348,
}

// 苏州工业园区管辖范围边界环（补充国标行政区划 GeoJSON 中未独立列出的工业园区边界）
const SIP_RING: number[][] = [
  [120.655, 31.355],
  [120.695, 31.415],
  [120.805, 31.405],
  [120.835, 31.345],
  [120.825, 31.265],
  [120.735, 31.255],
  [120.665, 31.280],
  [120.655, 31.355],
]

function ringToShape(ring: number[][]): THREE.Shape {
  const shape = new THREE.Shape()
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i]
    const { x, z } = lonLatTo3D(lon, lat)
    if (i === 0) {
      shape.moveTo(x, -z)
    } else {
      shape.lineTo(x, -z)
    }
  }
  shape.closePath()
  return shape
}

function createFillMesh(
  ring: number[][],
  color: number,
  name: string,
  yOffset = 0.52,
): THREE.Mesh {
  const shape = ringToShape(ring)
  const geo = new THREE.ShapeGeometry(shape, 2)
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = yOffset
  mesh.userData = { districtName: name, type: 'boundary-fill', baseOpacity: 0.35, baseColor: color }
  mesh.name = `boundary-fill-${name}`
  return mesh
}

function createBoundaryLine(
  ring: number[][],
  color: number,
  name: string,
): THREE.Line {
  const points: THREE.Vector3[] = []
  for (const [lon, lat] of ring) {
    const { x, z } = lonLatTo3D(lon, lat)
    const y = getTerrainHeightAtXZ(x, z) + 0.62
    points.push(new THREE.Vector3(x, y, z))
  }
  const [lon0, lat0] = ring[0]
  const { x: x0, z: z0 } = lonLatTo3D(lon0, lat0)
  points.push(new THREE.Vector3(x0, getTerrainHeightAtXZ(x0, z0) + 0.62, z0))

  const geo = new THREE.BufferGeometry().setFromPoints(points)
  const mat = new THREE.LineBasicMaterial({
    color,
    linewidth: 2,
    transparent: true,
    opacity: 0.92,
  })
  const line = new THREE.Line(geo, mat)
  line.userData = { districtName: name, type: 'boundary-line' }
  return line
}

function createCenterMarker(
  center: [number, number],
  color: number,
  name: string,
): THREE.Mesh {
  const { x, z } = lonLatTo3D(center[0], center[1])
  const y = getTerrainHeightAtXZ(x, z) + 2.5
  const geo = new THREE.SphereGeometry(0.85, 14, 14)
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.92,
  })
  const dot = new THREE.Mesh(geo, mat)
  dot.position.set(x, y, z)
  dot.userData = { districtName: name, type: 'boundary-marker' }
  dot.name = `boundary-marker-${name}`
  return dot
}

// 创建 3D 悬浮区县名称标签（Sprite），支持悬停拾取与截图导出
function createDistrictLabelSprite(
  center: [number, number],
  color: number,
  name: string,
): THREE.Sprite {
  const displayName = name === '苏州工业园区' ? '工业园区' : name
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 72
  const ctx = canvas.getContext('2d')!

  const hexColor = '#' + color.toString(16).padStart(6, '0')

  // 绘制圆角半透明深色科技标牌
  ctx.fillStyle = 'rgba(13, 18, 37, 0.86)'
  ctx.strokeStyle = hexColor
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(8, 8, 240, 56, 14)
  ctx.fill()
  ctx.stroke()

  // 左侧色点指示器
  ctx.fillStyle = hexColor
  ctx.beginPath()
  ctx.arc(32, 36, 7, 0, Math.PI * 2)
  ctx.fill()

  // 区县文字
  ctx.font = 'bold 28px "Microsoft YaHei", "PingFang SC", sans-serif'
  ctx.fillStyle = '#f0f6ff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(displayName, 138, 37)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(mat)
  const { x, z } = lonLatTo3D(center[0], center[1])
  // 对姑苏、虎丘、相城、工业园区等中心密集区微调标签高度，避免视觉重叠
  const heightBoost =
    name === '姑苏区' ? 8.2 :
    name === '苏州工业园区' ? 7.2 :
    name === '虎丘区' ? 6.4 : 5.6
  const y = getTerrainHeightAtXZ(x, z) + heightBoost
  sprite.position.set(x, y, z)
  sprite.scale.set(11.5, 3.2, 1)
  sprite.renderOrder = 20
  sprite.userData = {
    districtName: name,
    type: 'boundary-label',
    baseScaleX: 11.5,
    baseScaleY: 3.2,
  }
  sprite.name = `boundary-label-${name}`
  return sprite
}

export async function addBoundary(scene: THREE.Scene) {
  const group = new THREE.Group()
  group.name = 'boundary-group'

  try {
    const resp = await fetch('/suzhou_districts.geojson')
    const geojson = await resp.json()
    const features = geojson.features || []

    for (const feature of features) {
      const name = feature.properties?.name
      if (!name) continue

      const color = districtColors[name] || 0x888888
      const geometry = feature.geometry
      const coordsList: number[][][][] =
        geometry.type === 'MultiPolygon'
          ? geometry.coordinates
          : [geometry.coordinates]

      for (const polygon of coordsList) {
        const outerRing = polygon[0]
        group.add(createFillMesh(outerRing, color, name, 0.52))
        group.add(createBoundaryLine(outerRing, color, name))
      }

      const center = feature.properties?.center as [number, number] | undefined
      if (center) {
        group.add(createCenterMarker(center, color, name))
        group.add(createDistrictLabelSprite(center, color, name))
      }
    }

    // 补充第10个板块：苏州工业园区边界、填充与悬浮地名标签
    const sipColor = districtColors['苏州工业园区']
    group.add(createFillMesh(SIP_RING, sipColor, '苏州工业园区', 0.65))
    group.add(createBoundaryLine(SIP_RING, sipColor, '苏州工业园区'))
    group.add(createCenterMarker([120.72, 31.32], sipColor, '苏州工业园区'))
    group.add(createDistrictLabelSprite([120.72, 31.32], sipColor, '苏州工业园区'))

    scene.add(group)

    // 响应筛选器变化：动态显隐/半透明化未选中区县的边界与标签
    document.addEventListener('filter-changed', () => {
      const selectedSet = new Set(filterState.selectedDistricts.map(normalizeDistrictName))
      group.children.forEach(obj => {
        const dName = obj.userData?.districtName
        if (!dName) return
        const isSelected = selectedSet.size === 0 || selectedSet.has(normalizeDistrictName(dName))
        if (obj.userData.type === 'boundary-label' || obj.userData.type === 'boundary-marker') {
          obj.visible = isSelected
        } else if (obj instanceof THREE.Mesh && obj.userData.type === 'boundary-fill') {
          const mat = obj.material as THREE.MeshBasicMaterial
          obj.userData.baseOpacity = isSelected ? 0.35 : 0.06
          mat.opacity = obj.userData.baseOpacity
        } else if (obj instanceof THREE.Line && obj.userData.type === 'boundary-line') {
          const mat = obj.material as THREE.LineBasicMaterial
          mat.opacity = isSelected ? 0.92 : 0.18
        }
      })
    })

    console.log(`[Boundary] 加载了 ${features.length + 1} 个区县/园区边界与 3D 悬浮标注`)
  } catch (e) {
    console.error('[Boundary] 加载失败:', e)
  }
}

export function highlightDistrictBoundary(scene: THREE.Scene, targetName: string | null) {
  const group = scene.getObjectByName('boundary-group')
  if (!group) return
  const normalized = targetName ? normalizeDistrictName(targetName) : null

  group.children.forEach(obj => {
    if (obj instanceof THREE.Mesh && obj.userData?.type === 'boundary-fill') {
      const mat = obj.material as THREE.MeshBasicMaterial
      const isMatch = normalized && obj.userData.districtName === normalized
      mat.opacity = isMatch ? 0.72 : (normalized ? 0.16 : obj.userData.baseOpacity)
    } else if (obj instanceof THREE.Sprite && obj.userData?.type === 'boundary-label') {
      const isMatch = normalized && obj.userData.districtName === normalized
      const sx = obj.userData.baseScaleX || 11.5
      const sy = obj.userData.baseScaleY || 3.2
      obj.scale.set(isMatch ? sx * 1.22 : sx, isMatch ? sy * 1.22 : sy, 1)
    }
  })
}

export function toggleBoundary(scene: THREE.Scene): boolean {
  const group = scene.getObjectByName('boundary-group')
  if (group) {
    boundaryVisible = !group.visible
    group.visible = boundaryVisible
  }
  return boundaryVisible
}

export function isBoundaryVisible(): boolean {
  return boundaryVisible
}

import * as THREE from 'three'
import { BOUNDS, getTerrainHeightAtXZ, lonLatTo3D, normalizeDistrictName } from '../utils/geo'
import { resolveTerrainMode } from '../utils/terrain-mode'
import { filterState } from './filter'

let boundaryVisible = true
let districtPolygons: Array<{ name: string; polygons: number[][][][] }> = []

function inRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function districtAtXZ(x: number, z: number): string | null {
  const lon = BOUNDS.minLon + (x + 100) / 200 * (BOUNDS.maxLon - BOUNDS.minLon)
  const lat = BOUNDS.minLat + (100 - z) / 200 * (BOUNDS.maxLat - BOUNDS.minLat)
  for (const { name, polygons } of districtPolygons) {
    for (const rings of polygons) {
      if (rings.length && inRing(lon, lat, rings[0]) && !rings.slice(1).some(ring => inRing(lon, lat, ring))) return name
    }
  }
  return null
}

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

// 中心区标签错位布局偏移（单位：3D场景坐标），彻底解决中心四区标牌碰撞重叠
const LABEL_LAYOUT_CONFIG: Record<string, { ox: number; oz: number; height: number }> = {
  '姑苏区': { ox: 0, oz: -3.5, height: 9.8 },
  '苏州工业园区': { ox: 6.5, oz: -1.5, height: 8.5 },
  '虎丘区': { ox: -6.5, oz: 1.5, height: 8.5 },
  '相城区': { ox: 0, oz: -7.5, height: 8.8 },
  '吴中区': { ox: -3.0, oz: 6.0, height: 8.0 },
  '昆山市': { ox: 0, oz: 0, height: 6.5 },
  '太仓市': { ox: 0, oz: 0, height: 6.5 },
  '常熟市': { ox: 0, oz: 0, height: 6.5 },
  '张家港市': { ox: 0, oz: 0, height: 6.5 },
  '吴江区': { ox: 0, oz: 0, height: 6.5 },
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

function createTerrainFill(scene: THREE.Scene, polygons: number[][][][], color: number, name: string): THREE.Mesh | null {
  const terrain = scene.getObjectByName('terrain') as THREE.Mesh | undefined
  if (!terrain) return null
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
  for (const polygon of polygons) {
    ctx.beginPath()
    for (const ring of polygon) {
      ring.forEach(([lon, lat], i) => {
        const x = (lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon) * canvas.width
        const y = (BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat) * canvas.height
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.closePath()
    }
    ctx.fill('evenodd')
  }
  const geo = terrain.geometry.clone()
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + 0.12)
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = 2
  mesh.userData = { districtName: name, type: 'boundary-fill', baseOpacity: 0.16, baseColor: color }
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

/**
 * 3D 发光立体边界墙（Glow Wall）
 * 沿行政边界环挤出一道高度 1.8 场景单位的发光面，底部强辉光，顶部渐变透明
 */
function createGlowWall(
  ring: number[][],
  color: number,
  name: string,
  wallHeight = 1.8,
): THREE.Mesh {
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []

  const baseC = new THREE.Color(color)
  const len = ring.length

  for (let i = 0; i < len; i++) {
    const [lon, lat] = ring[i]
    const { x, z } = lonLatTo3D(lon, lat)
    const groundY = getTerrainHeightAtXZ(x, z) + 0.15

    // 底部顶点（亮色高对比）
    positions.push(x, groundY, z)
    colors.push(baseC.r, baseC.g, baseC.b, 0.75)

    // 顶部顶点（渐隐消失）
    positions.push(x, groundY + wallHeight, z)
    colors.push(baseC.r * 1.2, baseC.g * 1.2, baseC.b * 1.2, 0.0)

    const next = (i + 1) % len
    const b0 = i * 2
    const t0 = i * 2 + 1
    const b1 = next * 2
    const t1 = next * 2 + 1

    indices.push(b0, b1, t0)
    indices.push(b1, t1, t0)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
  geo.setIndex(indices)

  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.userData = { districtName: name, type: 'boundary-wall' }
  mesh.name = `boundary-wall-${name}`
  return mesh
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

/**
 * 创建 3D 悬浮区县名称标签与错位牵引线（Leader Line），防重叠
 */
function createDistrictLabelWithLeader(
  center: [number, number],
  color: number,
  name: string,
): THREE.Group {
  const labelGroup = new THREE.Group()
  labelGroup.name = `boundary-label-group-${name}`
  labelGroup.userData = { districtName: name, type: 'boundary-label-group' }

  const displayName = name === '苏州工业园区' ? '工业园区' : name
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 72
  const ctx = canvas.getContext('2d')!

  const hexColor = '#' + color.toString(16).padStart(6, '0')
  const atlasLabels = resolveTerrainMode() === 'registration'

  if (!atlasLabels) {
    ctx.fillStyle = 'rgba(13, 18, 37, 0.88)'
    ctx.strokeStyle = hexColor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(8, 8, 240, 56, 14)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = hexColor
    ctx.beginPath()
    ctx.arc(32, 36, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.font = atlasLabels ? 'bold 32px "Microsoft YaHei", sans-serif' : 'bold 28px "Microsoft YaHei", "PingFang SC", sans-serif'
  ctx.fillStyle = atlasLabels ? '#fff3d2' : '#f0f6ff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (atlasLabels) {
    ctx.strokeStyle = 'rgba(20, 20, 17, 0.95)'
    ctx.lineWidth = 6
    ctx.lineJoin = 'round'
    ctx.strokeText(displayName, 128, 37)
  }
  ctx.fillText(displayName, atlasLabels ? 128 : 138, 37)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(spriteMat)

  const { x: gx, z: gz } = lonLatTo3D(center[0], center[1])
  const gy = getTerrainHeightAtXZ(gx, gz)

  // 错位偏移量
  const cfg = LABEL_LAYOUT_CONFIG[name] || { ox: 0, oz: 0, height: 6.5 }
  const targetX = gx + cfg.ox
  const targetZ = gz + cfg.oz
  const targetY = gy + cfg.height

  sprite.position.set(targetX, targetY, targetZ)
  sprite.scale.set(11.5, 3.2, 1)
  sprite.renderOrder = 20
  sprite.userData = {
    districtName: name,
    type: 'boundary-label',
    baseScaleX: 11.5,
    baseScaleY: 3.2,
  }
  labelGroup.add(sprite)

  // 如果有错位偏移或高度较大，生成发光牵引线（连接实际地面中心与悬浮标牌底部）
  const leaderPoints = [
    new THREE.Vector3(gx, gy + 0.5, gz),
    new THREE.Vector3(targetX, targetY - 1.4, targetZ),
  ]
  const lineGeo = new THREE.BufferGeometry().setFromPoints(leaderPoints)
  const lineMat = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.8,
    gapSize: 0.4,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  })
  const leaderLine = new THREE.Line(lineGeo, lineMat)
  leaderLine.computeLineDistances()
  leaderLine.userData = { districtName: name, type: 'boundary-leader' }
  labelGroup.add(leaderLine)

  return labelGroup
}

export async function addBoundary(scene: THREE.Scene) {
  const group = new THREE.Group()
  group.name = 'boundary-group'

  try {
    const resp = await fetch('/suzhou_districts.geojson')
    const geojson = await resp.json()
    const features = geojson.features || []
    districtPolygons = features.map((feature: { properties: { name: string }, geometry: { type: string, coordinates: number[][][][] } }) => ({
      name: feature.properties.name,
      polygons: feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates as unknown as number[][][]],
    }))
    const showFlatFills = resolveTerrainMode() !== 'registration'

    for (const feature of features) {
      const name = feature.properties?.name
      if (!name) continue

      const color = districtColors[name] || 0x888888
      const geometry = feature.geometry
      const coordsList: number[][][][] =
        geometry.type === 'MultiPolygon'
          ? geometry.coordinates
          : [geometry.coordinates]

      if (!showFlatFills) {
        const fill = createTerrainFill(scene, coordsList, color, name)
        if (fill) group.add(fill)
      }

      for (const polygon of coordsList) {
        const outerRing = polygon[0]
        if (showFlatFills) group.add(createFillMesh(outerRing, color, name, 0.52))
        group.add(createBoundaryLine(outerRing, color, name))
        group.add(createGlowWall(outerRing, color, name, 1.8))
      }

      const center = feature.properties?.center as [number, number] | undefined
      if (center) {
        group.add(createCenterMarker(center, color, name))
        group.add(createDistrictLabelWithLeader(center, color, name))
      }
    }

    // 补充第10个板块：苏州工业园区边界、发光墙与悬浮牵引地名标签
    const sipColor = districtColors['苏州工业园区']
    if (showFlatFills) group.add(createFillMesh(SIP_RING, sipColor, '苏州工业园区', 0.65))
    group.add(createBoundaryLine(SIP_RING, sipColor, '苏州工业园区'))
    group.add(createGlowWall(SIP_RING, sipColor, '苏州工业园区', 1.8))
    group.add(createCenterMarker([120.72, 31.32], sipColor, '苏州工业园区'))
    group.add(createDistrictLabelWithLeader([120.72, 31.32], sipColor, '苏州工业园区'))

    scene.add(group)

    // 响应筛选器变化：动态显隐/半透明化未选中区县的边界、发光墙与标签
    document.addEventListener('filter-changed', () => {
      const selectedSet = new Set(filterState.selectedDistricts.map(normalizeDistrictName))
      group.children.forEach(obj => {
        const dName = obj.userData?.districtName
        if (!dName) return
        const isSelected = selectedSet.size === 0 || selectedSet.has(normalizeDistrictName(dName))
        if (
          obj.userData.type === 'boundary-label-group' ||
          obj.userData.type === 'boundary-marker' ||
          obj.userData.type === 'boundary-wall'
        ) {
          obj.visible = isSelected
        } else if (obj instanceof THREE.Mesh && obj.userData.type === 'boundary-fill') {
          const mat = obj.material as THREE.MeshBasicMaterial
          obj.userData.baseOpacity = isSelected ? (showFlatFills ? 0.35 : 0.16) : 0.04
          mat.opacity = obj.userData.baseOpacity
        } else if (obj instanceof THREE.Line && obj.userData.type === 'boundary-line') {
          const mat = obj.material as THREE.LineBasicMaterial
          mat.opacity = isSelected ? 0.92 : 0.18
        }
      })
    })

    console.log(`[Boundary] 加载了 ${features.length + 1} 个区县/园区边界、发光立体边界墙与防重叠标注`)
  } catch (e) {
    console.error('[Boundary] 加载失败:', e)
  }
}

/**
 * 分级设色图（Choropleth Map）：
 * 根据外部传入的各区县指标强度（0~1），动态更新多边形填充面色相与透明度
 */
export function updateChoroplethColors(scene: THREE.Scene, intensityMap: Record<string, number>) {
  const group = scene.getObjectByName('boundary-group')
  if (!group) return

  group.children.forEach(obj => {
    if (obj instanceof THREE.Mesh && obj.userData?.type === 'boundary-fill') {
      const dName = obj.userData.districtName
      if (!dName) return
      const intensity = Math.max(0, Math.min(1, intensityMap[normalizeDistrictName(dName)] ?? 0.3))

      // 经典多级渐变：深蓝(0.0) -> 青(0.25) -> 翠绿(0.5) -> 金黄(0.75) -> 橙红(1.0)
      const color = new THREE.Color()
      if (intensity < 0.25) {
        color.setRGB(0.0, 0.4 + intensity * 2.0, 0.9)
      } else if (intensity < 0.5) {
        const t = (intensity - 0.25) / 0.25
        color.setRGB(0.0, 0.9, 0.9 - t * 0.5)
      } else if (intensity < 0.75) {
        const t = (intensity - 0.5) / 0.25
        color.setRGB(t * 1.0, 0.9 - t * 0.1, 0.2)
      } else {
        const t = (intensity - 0.75) / 0.25
        color.setRGB(1.0, 0.8 - t * 0.5, 0.1)
      }

      const mat = obj.material as THREE.MeshBasicMaterial
      mat.color.copy(color)
      obj.userData.baseOpacity = 0.22 + intensity * 0.38
      mat.opacity = obj.userData.baseOpacity
    }
  })
}

export function highlightDistrictBoundary(scene: THREE.Scene, targetName: string | null) {
  const group = scene.getObjectByName('boundary-group')
  if (!group) return
  const normalized = targetName ? normalizeDistrictName(targetName) : null

  group.children.forEach(obj => {
    if (obj instanceof THREE.Mesh && obj.userData?.type === 'boundary-fill') {
      const mat = obj.material as THREE.MeshBasicMaterial
      const isMatch = normalized && obj.userData.districtName === normalized
      mat.opacity = isMatch ? (resolveTerrainMode() === 'registration' ? 0.48 : 0.75) : (normalized ? 0.12 : obj.userData.baseOpacity)
    } else if (obj.userData?.type === 'boundary-label-group') {
      const isMatch = normalized && obj.userData.districtName === normalized
      const sprite = obj.children.find(c => c instanceof THREE.Sprite) as THREE.Sprite | undefined
      if (sprite) {
        const sx = sprite.userData.baseScaleX || 11.5
        const sy = sprite.userData.baseScaleY || 3.2
        sprite.userData.highlightScale = isMatch ? 1.25 : 1
        sprite.scale.set(isMatch ? sx * 1.25 : sx, isMatch ? sy * 1.25 : sy, 1)
      }
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

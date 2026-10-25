import * as THREE from 'three'
import { geoTo3D, getTerrainHeightAtXZ } from '../utils/geo'

interface BuildingData {
  coords: [number, number][]
  height: number
  name: string
}

export async function addBuildings(scene: THREE.Scene) {
  try {
    const resp = await fetch('/suzhou_buildings.json')
    const data = await resp.json()
    const buildings: BuildingData[] = data.buildings

    if (!buildings || buildings.length === 0) return

    const mergedGeometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    let vertexCount = 0
    let renderedCount = 0

    for (const building of buildings) {
      const rawCoords = building.coords
      if (!rawCoords || rawCoords.length < 3) continue

      const [firstLon, firstLat] = rawCoords[0]
      // 过滤掉落在苏州市域范围外的噪点框
      if (firstLon < 119.85 || firstLon > 121.35 || firstLat < 30.75 || firstLat > 32.05) {
        continue
      }

      // 去除首尾重合的闭合点，保留完整轮廓（最多12个点）
      let ring = rawCoords
      if (
        ring.length > 3 &&
        Math.abs(ring[0][0] - ring[ring.length - 1][0]) < 1e-6 &&
        Math.abs(ring[0][1] - ring[ring.length - 1][1]) < 1e-6
      ) {
        ring = ring.slice(0, ring.length - 1)
      }
      if (ring.length > 12) {
        ring = ring.slice(0, 12)
      }
      if (ring.length < 3) continue

      const rawPoints = ring.map(([lon, lat]) => geoTo3D(lat, lon))

      let cx = 0, cz = 0
      for (const p of rawPoints) {
        cx += p.x
        cz += p.z
      }
      cx /= rawPoints.length
      cz /= rawPoints.length

      // 计算当前基底半径（在 3.5x 紧凑市域比例下控制在真实建筑物尺度）
      let maxR = 0
      for (const p of rawPoints) {
        const r = Math.hypot(p.x - cx, p.z - cz)
        if (r > maxR) maxR = r
      }
      const isLandmark = Boolean(building.name) || building.height >= 80
      const targetMinR = isLandmark ? 0.18 : 0.08
      const targetMaxR = isLandmark ? 0.42 : 0.18
      const scaleFactor = maxR > 1e-5
        ? Math.min(targetMaxR / maxR, Math.max(1, targetMinR / maxR))
        : 1

      const points = rawPoints.map(p => ({
        x: cx + (p.x - cx) * scaleFactor,
        z: cz + (p.z - cz) * scaleFactor,
      }))

      // 采样真实地形高程
      const baseY = getTerrainHeightAtXZ(cx, cz) + 0.12
      const clampedHeight = Math.min(Math.max(building.height || 12, 6), 450)
      // 高度缩放与地形 DEM 比例（0~6 单位）保持和谐，消除细高针刺感
      const heightScale = isLandmark
        ? Math.max(1.2, clampedHeight / 28)
        : Math.max(0.38, clampedHeight / 36)

      // 按建筑高度赋予科技感渐变色彩（高层地标呈亮青金色，普通建筑呈科技冰蓝）
      const hRatio = Math.min(clampedHeight / 240, 1)
      const baseR = 0.18 + hRatio * 0.15
      const baseG = 0.32 + hRatio * 0.25
      const baseB = 0.55 + hRatio * 0.2
      const topR = isLandmark ? 0.2 + hRatio * 0.75 : 0.45 + hRatio * 0.4
      const topG = isLandmark ? 0.88 + hRatio * 0.12 : 0.82 + hRatio * 0.15
      const topB = 1.0

      const base = vertexCount
      const n = points.length

      // 底面顶点
      for (const p of points) {
        positions.push(p.x, baseY, p.z)
        colors.push(baseR * 0.7, baseG * 0.7, baseB * 0.7)
      }

      // 顶面顶点
      for (const p of points) {
        positions.push(p.x, baseY + heightScale, p.z)
        colors.push(topR, topG, topB)
      }

      // 顶面三角形（扇形）
      const topBase = base + n
      for (let i = 1; i < n - 1; i++) {
        indices.push(topBase, topBase + i, topBase + i + 1)
      }

      // 侧面
      for (let i = 0; i < n; i++) {
        const next = (i + 1) % n
        const bl = base + i
        const br = base + next
        const tl = topBase + i
        const tr = topBase + next
        indices.push(bl, br, tl)
        indices.push(br, tr, tl)
      }

      vertexCount += n * 2
      renderedCount++
    }

    mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    mergedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    mergedGeometry.setIndex(indices)
    mergedGeometry.computeVertexNormals()

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      shininess: 45,
      specular: new THREE.Color(0x00d4ff),
      emissive: new THREE.Color(0x0d1a2d),
      emissiveIntensity: 0.4,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(mergedGeometry, material)
    mesh.name = 'buildings'
    scene.add(mesh)

    console.log(`[Buildings] 渲染了 ${renderedCount} 栋苏州市域建筑白膜`)
  } catch (e) {
    console.warn('[Buildings] 加载失败:', e)
  }
}

export function toggleBuildings(scene: THREE.Scene): boolean {
  const mesh = scene.getObjectByName('buildings')
  if (mesh) {
    mesh.visible = !mesh.visible
    return mesh.visible
  }
  return false
}

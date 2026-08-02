import * as THREE from 'three'

interface BuildingData {
  coords: [number, number][]
  height: number
  name: string
}

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200 - 100
  return { x, z }
}

export async function addBuildings(scene: THREE.Scene) {
  try {
    const resp = await fetch('/suzhou_buildings.json')
    const data = await resp.json()
    const buildings: BuildingData[] = data.buildings

    if (!buildings || buildings.length === 0) return

    // 合并所有建筑几何体
    const mergedGeometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const normals: number[] = []
    const indices: number[] = []
    let vertexCount = 0

    for (const building of buildings) {
      const coords = building.coords
      if (coords.length < 3) continue

      const height = Math.min(building.height, 200) // 限制最大高度
      const heightScale = height / 50

      // 转换坐标到3D空间
      const points = coords.map(([lon, lat]) => {
        const { x, z } = geoTo3D(lat, lon)
        return { x, z }
      })

      // 计算建筑中心
      let cx = 0, cz = 0
      for (const p of points) {
        cx += p.x
        cz += p.z
      }
      cx /= points.length
      cz /= points.length

      // 简化：只取前6个点（避免过于复杂的多边形）
      const simplified = points.slice(0, 6)
      const base = vertexCount

      // 底面顶点
      for (const p of simplified) {
        positions.push(p.x, 1, p.z)
        normals.push(0, -1, 0)
      }

      // 顶面顶点
      for (const p of simplified) {
        positions.push(p.x, 1 + heightScale, p.z)
        normals.push(0, 1, 0)
      }

      // 底面三角形（扇形）
      for (let i = 1; i < simplified.length - 1; i++) {
        indices.push(base, base + i, base + i + 1)
      }

      // 顶面三角形（扇形）
      const topBase = base + simplified.length
      for (let i = 1; i < simplified.length - 1; i++) {
        indices.push(topBase, topBase + i + 1, topBase + i)
      }

      // 侧面
      for (let i = 0; i < simplified.length; i++) {
        const next = (i + 1) % simplified.length
        const bl = base + i
        const br = base + next
        const tl = topBase + i
        const tr = topBase + next
        indices.push(bl, br, tl)
        indices.push(br, tr, tl)
      }

      vertexCount += simplified.length * 2
    }

    mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    mergedGeometry.setIndex(indices)

    const material = new THREE.MeshPhongMaterial({
      color: 0xd0d0d0,
      transparent: true,
      opacity: 0.6,
      shininess: 10,
    })

    const mesh = new THREE.Mesh(mergedGeometry, material)
    mesh.name = 'buildings'
    scene.add(mesh)

    console.log(`[Buildings] 渲染了 ${buildings.length} 个建筑`)
  } catch (e) {
    console.warn('[Buildings] 加载失败:', e)
  }
}

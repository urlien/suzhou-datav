import * as THREE from 'three'
import { areaData, populationData, gdpData } from '../data/official-stats'

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

/**
 * GeoJSON [lon, lat] → 3D world coordinates.
 *   x = (lon-119)/(122-119)*200 - 100
 *   z = (lat-30)/(33-30)*200   - 100
 */
function geoTo3D(lon: number, lat: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200
  return { x, z }
}

let boundaryVisible = true

const districtColors: Record<string, number> = {
  '虎丘区': 0x4ecdc4,
  '吴中区': 0xff6b6b,
  '相城区': 0x45b7d1,
  '姑苏区': 0xf7b731,
  '苏州工业园区': 0x5f27cd,
  '吴江区': 0x2ed573,
  '常熟市': 0xff9ff3,
  '张家港市': 0x54a0ff,
  '昆山市': 0x48dbfb,
  '太仓市': 0xff6348,
}

/**
 * Create a THREE.Shape from a GeoJSON ring.
 *
 * ShapeGeometry lives in the XY plane.  After rotation.x = -PI/2:
 *   (sx, sy, 0) → world (sx, 0, -sy)
 *
 * To place the geometry at world (wx, 0, wz) we create the shape at (wx, -wz).
 */
function ringToShape(ring: number[][]): THREE.Shape {
  const shape = new THREE.Shape()
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i]
    const { x, z } = geoTo3D(lon, lat)
    // shape coords: (worldX, -worldZ) so that after rotation.x=-PI/2 → (worldX, 0, worldZ)
    if (i === 0) {
      shape.moveTo(x, -z)
    } else {
      shape.lineTo(x, -z)
    }
  }
  shape.closePath()
  return shape
}

/**
 * Create a filled polygon mesh for a single outer ring.
 * Uses THREE.ShapeGeometry (proper triangulation, no earcut artifacts).
 */
function createFillMesh(
  ring: number[][],
  color: number,
  name: string,
): THREE.Mesh {
  const shape = ringToShape(ring)
  const geo = new THREE.ShapeGeometry(shape, 2)
  // rotation.x = -PI/2 flips the XY-plane shape onto the XZ ground plane
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.3  // slight lift to avoid z-fighting with terrain
  mesh.userData = { districtName: name, type: 'boundary-fill' }
  mesh.name = `boundary-fill-${name}`
  return mesh
}

/**
 * Create boundary line (loop) for a single outer ring.
 */
function createBoundaryLine(
  ring: number[][],
  color: number,
): THREE.Line {
  const points: THREE.Vector3[] = []
  for (const [lon, lat] of ring) {
    const { x, z } = geoTo3D(lon, lat)
    points.push(new THREE.Vector3(x, 0.5, z))
  }
  // close the loop
  const [lon0, lat0] = ring[0]
  const { x: x0, z: z0 } = geoTo3D(lon0, lat0)
  points.push(new THREE.Vector3(x0, 0.5, z0))

  const geo = new THREE.BufferGeometry().setFromPoints(points)
  const mat = new THREE.LineBasicMaterial({
    color,
    linewidth: 2,
    transparent: true,
    opacity: 0.9,
  })
  return new THREE.Line(geo, mat)
}

/**
 * Create a small sphere marker at the district center.
 */
function createCenterMarker(
  center: [number, number],
  color: number,
  name: string,
): THREE.Mesh {
  const { x, z } = geoTo3D(center[0], center[1])
  const geo = new THREE.SphereGeometry(1, 12, 12)
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
  })
  const dot = new THREE.Mesh(geo, mat)
  dot.position.set(x, 3, z)
  dot.userData = { districtName: name, type: 'boundary-marker' }
  dot.name = `boundary-marker-${name}`
  return dot
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
        const outerRing = polygon[0] // first ring is always the outer boundary

        // Filled polygon using ShapeGeometry (proper concave triangulation)
        group.add(createFillMesh(outerRing, color, name))

        // Boundary outline
        group.add(createBoundaryLine(outerRing, color))
      }

      // Center marker sphere
      const center = feature.properties?.center as [number, number] | undefined
      if (center) {
        group.add(createCenterMarker(center, color, name))
      }
    }

    scene.add(group)
    console.log(`[Boundary] 加载了 ${features.length} 个区县边界（ShapeGeometry填充）`)
  } catch (e) {
    console.error('[Boundary] 加载失败:', e)
  }
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

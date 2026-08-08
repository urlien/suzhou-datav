import * as THREE from "three"

interface GeoJSONFeature {
  properties: { name: string; adcode: number }
  geometry: { type: string; coordinates: number[][][][] }
}

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number): THREE.Vector3 {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200 - 100
  return new THREE.Vector3(x, 1.5, z)
}

// adcode -> color mapping
const colorMap: Record<number, number> = {
  320508: 0xff6348,
  320505: 0x00d4ff,
  320506: 0x00ff88,
  320507: 0xff9f43,
  320509: 0xa855f7,
  320581: 0x4ecdc4,
  320582: 0xffd93d,
  320583: 0xff6b6b,
  320585: 0x45b7d1,
}

export async function addBoundary(scene: THREE.Scene) {
  try {
    const resp = await fetch("/suzhou_districts.geojson")
    const geoJson = await resp.json()
    const features: GeoJSONFeature[] = geoJson.features

    const group = new THREE.Group()
    group.name = "boundary-group"

    for (const feature of features) {
      const color = colorMap[feature.properties.adcode] || 0x00d4ff

      for (const polygon of feature.geometry.coordinates) {
        for (const ring of polygon) {
          const pts: THREE.Vector3[] = []
          for (const coord of ring) {
            pts.push(geoTo3D(coord[1], coord[0]))
          }
          const geometry = new THREE.BufferGeometry().setFromPoints(pts)
          const material = new THREE.LineBasicMaterial({
            color,
            linewidth: 1,
            transparent: true,
            opacity: 0.7,
          })
          const line = new THREE.Line(geometry, material)
          line.name = "boundary-" + feature.properties.adcode
          group.add(line)
        }
      }
    }

    scene.add(group)
  } catch (e) {
    console.warn("[Boundary] load failed:", e)
  }
}

let boundaryVisible = true

export function toggleBoundary(scene: THREE.Scene): boolean {
  const group = scene.getObjectByName("boundary-group")
  if (group) {
    boundaryVisible = !boundaryVisible
    group.visible = boundaryVisible
  }
  return boundaryVisible
}

export function isBoundaryVisible(): boolean { return boundaryVisible }

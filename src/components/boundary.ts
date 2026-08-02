import * as THREE from 'three'

// 苏州市边界近似坐标（简化版）
const suzhouBoundary: [number, number][] = [
  [120.25, 30.85], [120.55, 30.85], [120.85, 30.95],
  [121.10, 31.05], [121.35, 31.20], [121.45, 31.40],
  [121.40, 31.55], [121.15, 31.75], [120.85, 31.90],
  [120.55, 31.85], [120.30, 31.70], [120.15, 31.50],
  [120.10, 31.25], [120.15, 31.00], [120.25, 30.85],
]

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200 - 100
  return new THREE.Vector3(x, 1, z)
}

export function addBoundary(scene: THREE.Scene) {
  const points = suzhouBoundary.map(([lon, lat]) => geoTo3D(lat, lon))
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: 0x00d4ff,
    linewidth: 2,
    transparent: true,
    opacity: 0.8,
  })
  const line = new THREE.Line(geometry, material)
  scene.add(line)
}

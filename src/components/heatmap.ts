import * as THREE from "three"

const districts = [
  { name: "昆山市", lat: 31.39, lon: 120.98, population: 216 },
  { name: "工业园区", lat: 31.32, lon: 120.72, population: 137 },
  { name: "张家港市", lat: 31.87, lon: 120.55, population: 88 },
  { name: "常熟市", lat: 31.65, lon: 120.74, population: 106 },
  { name: "吴江区", lat: 31.16, lon: 120.65, population: 90 },
  { name: "虎丘区", lat: 31.30, lon: 120.57, population: 86 },
  { name: "太仓市", lat: 31.45, lon: 121.10, population: 51 },
  { name: "吴中区", lat: 31.26, lon: 120.62, population: 112 },
  { name: "相城区", lat: 31.37, lon: 120.62, population: 92 },
  { name: "姑苏区", lat: 31.30, lon: 120.63, population: 92 },
]

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200 - 100
  return { x, z }
}

let heatmapVisible = true

export function addHeatmap(scene: THREE.Scene) {
  const group = new THREE.Group()
  group.name = "heatmap-group"
  const maxPop = Math.max(...districts.map(d => d.population))

  for (const d of districts) {
    const { x, z } = geoTo3D(d.lat, d.lon)
    const intensity = d.population / maxPop
    const radius = 5 + intensity * 15

    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 32),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.6 - intensity * 0.6, 1, 0.5),
        transparent: true, opacity: 0.3 + intensity * 0.4,
        side: THREE.DoubleSide,
      })
    )
    circle.rotation.x = -Math.PI / 2
    circle.position.set(x, 0.5, z)
    group.add(circle)

    const pillarHeight = 5 + intensity * 20
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, pillarHeight, 8),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.6 - intensity * 0.6, 1, 0.6),
        transparent: true, opacity: 0.8,
      })
    )
    pillar.position.set(x, pillarHeight / 2, z)
    group.add(pillar)
  }

  scene.add(group)
}

export function toggleHeatmap(scene: THREE.Scene): boolean {
  const group = scene.getObjectByName("heatmap-group")
  if (group) {
    heatmapVisible = !heatmapVisible
    group.visible = heatmapVisible
  }
  return heatmapVisible
}

export function isHeatmapVisible(): boolean { return heatmapVisible }

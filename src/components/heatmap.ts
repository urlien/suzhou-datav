import * as THREE from 'three'

// 苏州市主要区域坐标（近似经纬度→3D坐标映射）
const districts = [
  { name: '姑苏区', lat: 31.30, lon: 120.62, population: 92, gdp: 1200 },
  { name: '虎丘区', lat: 31.30, lon: 120.57, population: 39, gdp: 800 },
  { name: '吴中区', lat: 31.26, lon: 120.62, population: 112, gdp: 950 },
  { name: '相城区', lat: 31.37, lon: 120.62, population: 73, gdp: 680 },
  { name: '吴江区', lat: 31.16, lon: 120.65, population: 90, gdp: 780 },
  { name: '昆山市', lat: 31.39, lon: 120.98, population: 210, gdp: 4500 },
  { name: '太仓市', lat: 31.45, lon: 121.10, population: 51, gdp: 1200 },
  { name: '常熟市', lat: 31.65, lon: 120.74, population: 106, gdp: 2200 },
  { name: '张家港市', lat: 31.87, lon: 120.55, population: 88, gdp: 2800 },
]

// 经纬度转3D坐标
function geoTo3D(lat: number, lon: number, bounds: { minLat: number, maxLat: number, minLon: number, maxLon: number }) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200 - 100
  return { x, z }
}

export function addHeatmap(scene: THREE.Scene) {
  const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }
  const maxPop = Math.max(...districts.map(d => d.population))

  for (const d of districts) {
    const { x, z } = geoTo3D(d.lat, d.lon, bounds)
    const intensity = d.population / maxPop
    const radius = 5 + intensity * 15

    // 热力圆圈
    const geometry = new THREE.CircleGeometry(radius, 32)
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.6 - intensity * 0.6, 1, 0.5),
      transparent: true,
      opacity: 0.3 + intensity * 0.4,
      side: THREE.DoubleSide,
    })
    const circle = new THREE.Mesh(geometry, material)
    circle.rotation.x = -Math.PI / 2
    circle.position.set(x, 0.5, z)
    scene.add(circle)

    // 区域标签（用竖线表示）
    const labelGeo = new THREE.CylinderGeometry(0.2, 0.2, 5 + intensity * 20, 8)
    const labelMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.6 - intensity * 0.6, 1, 0.6),
      transparent: true,
      opacity: 0.8,
    })
    const pillar = new THREE.Mesh(labelGeo, labelMat)
    pillar.position.set(x, (5 + intensity * 20) / 2, z)
    scene.add(pillar)
  }
}

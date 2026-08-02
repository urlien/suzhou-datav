import * as THREE from 'three'

const districts = [
  { name: '姑苏区', lat: 31.30, lon: 120.62, population: 92, gdp: 1200, area: 83 },
  { name: '虎丘区', lat: 31.30, lon: 120.57, population: 39, gdp: 800, area: 223 },
  { name: '吴中区', lat: 31.26, lon: 120.62, population: 112, gdp: 950, area: 2231 },
  { name: '相城区', lat: 31.37, lon: 120.62, population: 73, gdp: 680, area: 490 },
  { name: '吴江区', lat: 31.16, lon: 120.65, population: 90, gdp: 780, area: 1176 },
  { name: '昆山市', lat: 31.39, lon: 120.98, population: 210, gdp: 4500, area: 931 },
  { name: '太仓市', lat: 31.45, lon: 121.10, population: 51, gdp: 1200, area: 620 },
  { name: '常熟市', lat: 31.65, lon: 120.74, population: 106, gdp: 2200, area: 1276 },
  { name: '张家港市', lat: 31.87, lon: 120.55, population: 88, gdp: 2800, area: 999 },
]

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200 - 100
  return { x, z }
}

export function setupInteraction(camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const infoEl = document.getElementById('terrain-info')
  if (!infoEl) return

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 检查鼠标是否在某个区域附近
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const relX = (event.clientX - rect.left - centerX) / centerX
    const relY = (event.clientY - rect.top - centerY) / centerY

    let closest: typeof districts[0] | null = null
    let minDist = Infinity

    for (const d of districts) {
      const { x, z } = geoTo3D(d.lat, d.lon)
      // 简化的屏幕空间距离计算
      const dx = (x / 100) - relX
      const dz = (z / 100) - relY
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < minDist && dist < 0.3) {
        minDist = dist
        closest = d
      }
    }

    if (closest) {
      infoEl.innerHTML = `
        <strong style="color:#00d4ff">${closest.name}</strong><br>
        人口: ${closest.population}万<br>
        GDP: ${closest.gdp}亿<br>
        面积: ${closest.area}km²
      `
      infoEl.classList.add('visible')
    } else {
      infoEl.classList.remove('visible')
    }
  })
}

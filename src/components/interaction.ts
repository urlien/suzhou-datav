import * as THREE from 'three'

const districts = [
  { name: '昆山市', lat: 31.39, lon: 120.98, population: 216, gdp: 5615, area: 931, desc: '中国最强县级市，台资聚集地' },
  { name: '工业园区', lat: 31.32, lon: 120.72, population: 137, gdp: 4163, area: 278, desc: '金鸡湖畔，中新合作典范' },
  { name: '张家港市', lat: 31.87, lon: 120.55, population: 88, gdp: 3300, area: 999, desc: '全国文明城市，钢铁化工重镇' },
  { name: '常熟市', lat: 31.65, lon: 120.74, population: 106, gdp: 3200, area: 1276, desc: '服装之都，虞山尚湖风景区' },
  { name: '吴江区', lat: 31.16, lon: 120.65, population: 90, gdp: 2332, area: 1176, desc: '丝绸之府，民营经济发达' },
  { name: '虎丘区', lat: 31.30, lon: 120.57, population: 86, gdp: 1766, area: 223, desc: '苏州高新区，科技创新高地' },
  { name: '太仓市', lat: 31.45, lon: 121.10, population: 51, gdp: 1654, area: 620, desc: '德企之乡，港口城市' },
  { name: '吴中区', lat: 31.26, lon: 120.62, population: 112, gdp: 1590, area: 2231, desc: '太湖之滨，生态宜居区' },
  { name: '相城区', lat: 31.37, lon: 120.62, population: 92, gdp: 1431, area: 490, desc: '高铁新城，交通枢纽' },
  { name: '姑苏区', lat: 31.30, lon: 120.63, population: 92, gdp: 1048, area: 83, desc: '苏州古城，世界文化遗产集中地' },
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

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const relX = (event.clientX - rect.left - centerX) / centerX
    const relY = (event.clientY - rect.top - centerY) / centerY

    let closest: typeof districts[0] | null = null
    let minDist = Infinity

    for (const d of districts) {
      const { x, z } = geoTo3D(d.lat, d.lon)
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
        人口: ${closest.population}万 | GDP: ${closest.gdp}亿<br>
        面积: ${closest.area}km²<br>
        <span style="color:#6b7a99">${closest.desc}</span>
      `
      infoEl.classList.add('visible')
    } else {
      infoEl.classList.remove('visible')
    }
  })
}

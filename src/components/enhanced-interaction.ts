// 增强交互模块 - 区县下钻 + 点击弹窗升级
import * as THREE from 'three'

interface DistrictDetail {
  name: string
  lat: number
  lon: number
  population: number
  gdp: number
  area: number
  density: number
  income: number
  desc: string
  color: string
  // 下钻数据
  subDistricts?: { name: string; population: number; gdp: number }[]
  highlights?: string[]
}

const districtDetails: DistrictDetail[] = [
  {
    name: '昆山市', lat: 31.39, lon: 120.98, population: 216, gdp: 5615, area: 931,
    density: 232, income: 73968, desc: '中国最强县级市，台资聚集地', color: '#00d4ff',
    subDistricts: [
      { name: '玉山镇', population: 45, gdp: 1200 },
      { name: '花桥镇', population: 28, gdp: 800 },
      { name: '周市镇', population: 22, gdp: 650 },
      { name: '巴城镇', population: 18, gdp: 500 },
    ],
    highlights: ['GDP连续18年全国县级市第一', '电子信息产业集群', '深化两岸产业合作试验区'],
  },
  {
    name: '工业园区', lat: 31.32, lon: 120.72, population: 137, gdp: 4163, area: 278,
    density: 493, income: 90125, desc: '金鸡湖畔，中新合作典范', color: '#00ff88',
    subDistricts: [
      { name: '湖东', population: 35, gdp: 1500 },
      { name: '湖西', population: 28, gdp: 1200 },
      { name: '娄葑', population: 25, gdp: 600 },
      { name: '唯亭', population: 22, gdp: 500 },
    ],
    highlights: ['中新合作项目', '生物医药产业高地', '金鸡湖商务区'],
  },
  {
    name: '张家港市', lat: 31.87, lon: 120.55, population: 88, gdp: 3300, area: 999,
    density: 88, income: 68000, desc: '全国文明城市，钢铁化工重镇', color: '#ff9f43',
    subDistricts: [
      { name: '杨舍镇', population: 32, gdp: 1100 },
      { name: '金港镇', population: 18, gdp: 800 },
      { name: '锦丰镇', population: 15, gdp: 600 },
    ],
    highlights: ['全国文明城市六连冠', '钢铁冶金产业集群', '长江港口物流'],
  },
  {
    name: '常熟市', lat: 31.65, lon: 120.74, population: 106, gdp: 3200, area: 1276,
    density: 83, income: 65000, desc: '服装之都，虞山尚湖风景区', color: '#a855f7',
    subDistricts: [
      { name: '虞山镇', population: 38, gdp: 1000 },
      { name: '梅李镇', population: 15, gdp: 500 },
      { name: '海虞镇', population: 12, gdp: 400 },
    ],
    highlights: ['中国服装城', '虞山尚湖5A景区', '汽车零部件产业'],
  },
  {
    name: '吴江区', lat: 31.16, lon: 120.65, population: 90, gdp: 2332, area: 1176,
    density: 77, income: 62000, desc: '丝绸之府，民营经济发达', color: '#ff6b6b',
    subDistricts: [
      { name: '松陵镇', population: 28, gdp: 700 },
      { name: '盛泽镇', population: 22, gdp: 600 },
      { name: '同里镇', population: 10, gdp: 300 },
    ],
    highlights: ['国家乡村振兴示范县', '丝绸纺织产业集群', '同里古镇世界文化遗产'],
  },
  {
    name: '虎丘区', lat: 31.30, lon: 120.57, population: 86, gdp: 1766, area: 223,
    density: 386, income: 75000, desc: '苏州高新区，科技创新高地', color: '#ffd93d',
    subDistricts: [
      { name: '狮山', population: 30, gdp: 700 },
      { name: '枫桥', population: 20, gdp: 400 },
      { name: '横塘', population: 15, gdp: 300 },
    ],
    highlights: ['国家级高新技术产业开发区', '集成电路产业', '太湖科学城'],
  },
  {
    name: '太仓市', lat: 31.45, lon: 121.10, population: 51, gdp: 1654, area: 620,
    density: 82, income: 66000, desc: '德企之乡，港口城市', color: '#4ecdc4',
    subDistricts: [
      { name: '城厢镇', population: 18, gdp: 500 },
      { name: '浏河镇', population: 12, gdp: 350 },
    ],
    highlights: ['中德中小企业合作区', '太仓港集装箱码头', '对德合作典范城市'],
  },
  {
    name: '吴中区', lat: 31.26, lon: 120.62, population: 112, gdp: 1590, area: 2231,
    density: 50, income: 60000, desc: '太湖之滨，生态宜居区', color: '#45b7d1',
    subDistricts: [
      { name: '长桥', population: 25, gdp: 400 },
      { name: '木渎', population: 18, gdp: 350 },
      { name: '甪直', population: 12, gdp: 250 },
    ],
    highlights: ['太湖生态岛', '吴文化发源地', '生物医药产业园'],
  },
  {
    name: '相城区', lat: 31.37, lon: 120.62, population: 92, gdp: 1431, area: 490,
    density: 188, income: 62000, desc: '高铁新城，交通枢纽', color: '#f78fb3',
    subDistricts: [
      { name: '元和', population: 28, gdp: 450 },
      { name: '黄桥', population: 15, gdp: 300 },
    ],
    highlights: ['苏州北站高铁枢纽', '数字金融产业园', '阳澄湖大闸蟹'],
  },
  {
    name: '姑苏区', lat: 31.30, lon: 120.63, population: 92, gdp: 1048, area: 83,
    density: 1108, income: 68000, desc: '苏州古城，世界文化遗产集中地', color: '#e056a0',
    subDistricts: [
      { name: '观前', population: 18, gdp: 250 },
      { name: '平江', population: 15, gdp: 200 },
      { name: '沧浪', population: 12, gdp: 180 },
    ],
    highlights: ['拙政园/留园/虎丘世界遗产', '平江路历史街区', '苏州古城保护示范区'],
  },
]

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200 - 100
  return { x, z }
}

let currentDrillDown: string | null = null

export function setupEnhancedInteraction(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  scene: THREE.Scene
) {
  const infoEl = document.getElementById('terrain-info')
  const modal = document.getElementById('district-modal')
  const modalBody = modal?.querySelector('.modal-body')
  const modalHeader = modal?.querySelector('.modal-header h2')
  const modalClose = modal?.querySelector('.modal-close')

  if (!infoEl || !modal || !modalBody) return

  // 关闭弹窗
  modalClose?.addEventListener('click', () => {
    modal.style.display = 'none'
    currentDrillDown = null
  })

  // 悬浮显示信息
  canvas.addEventListener('mousemove', (event) => {
    if (currentDrillDown) return // 下钻时不显示悬浮

    const rect = canvas.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const relX = (event.clientX - rect.left - centerX) / centerX
    const relY = (event.clientY - rect.top - centerY) / centerY

    let closest: DistrictDetail | null = null
    let minDist = Infinity

    for (const d of districtDetails) {
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
        <strong style="color:${closest.color}">${closest.name}</strong><br>
        人口: ${closest.population}万 | GDP: ${closest.gdp}亿<br>
        面积: ${closest.area}km² | 人口密度: ${closest.density}人/km²<br>
        <span style="color:#6b7a99">${closest.desc}</span><br>
        <span style="color:#00d4ff;font-size:10px">点击查看详细数据 →</span>
      `
      infoEl.classList.add('visible')
      canvas.style.cursor = 'pointer'
    } else {
      infoEl.classList.remove('visible')
      canvas.style.cursor = 'grab'
    }
  })

  // 点击弹窗
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const relX = (event.clientX - rect.left - centerX) / centerX
    const relY = (event.clientY - rect.top - centerY) / centerY

    let closest: DistrictDetail | null = null
    let minDist = Infinity

    for (const d of districtDetails) {
      const { x, z } = geoTo3D(d.lat, d.lon)
      const dx = (x / 100) - relX
      const dz = (z / 100) - relY
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < minDist && dist < 0.3) {
        minDist = dist
        closest = d
      }
    }

    if (!closest) return

    currentDrillDown = closest.name

    // 3D相机飞到该区县上方
    const { x, z } = geoTo3D(closest.lat, closest.lon)
    flyToDistrict(camera, x, z)

    // 显示弹窗
    if (modalHeader) modalHeader.textContent = closest.name
    modalBody.innerHTML = renderDistrictDetail(closest)
    modal.style.display = 'block'

    infoEl.classList.remove('visible')
  })
}

function flyToDistrict(camera: THREE.PerspectiveCamera, x: number, z: number) {
  const targetPos = new THREE.Vector3(x + 50, 80, z + 50)
  const targetLookAt = new THREE.Vector3(x, 0, z)
  const startPos = camera.position.clone()
  const startLookAt = new THREE.Vector3(0, 10, 0)

  let t = 0
  const duration = 1000 // 1秒
  const startTime = Date.now()

  function animate() {
    t = Math.min((Date.now() - startTime) / duration, 1)
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t // easeInOutQuad

    camera.position.lerpVectors(startPos, targetPos, ease)

    const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, ease)
    camera.lookAt(currentLookAt)

    if (t < 1) requestAnimationFrame(animate)
  }
  animate()
}

function renderDistrictDetail(d: DistrictDetail): string {
  const subDistrictsHtml = d.subDistricts?.map(sd => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a2744">
      <span>${sd.name}</span>
      <span>${sd.population}万人 | ${sd.gdp}亿</span>
    </div>
  `).join('') || ''

  const highlightsHtml = d.highlights?.map(h => `
    <span style="display:inline-block;background:rgba(0,212,255,0.1);border:1px solid #1a2744;border-radius:12px;padding:3px 10px;font-size:11px;margin:2px">${h}</span>
  `).join('') || ''

  return `
    <div style="padding:16px;color:#e0e6f0;font-family:'Segoe UI','PingFang SC',sans-serif">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="detail-card">
          <div class="detail-label">常住人口</div>
          <div class="detail-value" style="color:${d.color}">${d.population}万</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">GDP</div>
          <div class="detail-value" style="color:${d.color}">${d.gdp}亿</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">面积</div>
          <div class="detail-value">${d.area}km²</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">人口密度</div>
          <div class="detail-value">${d.density}人/km²</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">人均收入</div>
          <div class="detail-value">${(d.income / 10000).toFixed(1)}万</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">人均GDP</div>
          <div class="detail-value">${(d.gdp / d.population * 10000).toFixed(0)}元</div>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <div style="font-size:12px;color:#6b7a99;margin-bottom:6px">${d.desc}</div>
      </div>

      ${d.subDistricts ? `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;color:#00d4ff;margin-bottom:8px">📍 下辖区域</div>
          ${subDistrictsHtml}
        </div>
      ` : ''}

      ${d.highlights ? `
        <div>
          <div style="font-size:13px;color:#00ff88;margin-bottom:8px">✨ 特色亮点</div>
          ${highlightsHtml}
        </div>
      ` : ''}
    </div>
  `
}

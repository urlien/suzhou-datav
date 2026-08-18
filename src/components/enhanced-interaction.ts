// 增强交互模块 - 区县点击弹窗
import * as THREE from 'three'
import { areaData, populationData, gdpData } from '../data/official-stats'

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200
  return { x, z }
}

// 区县中心坐标（用于点击检测）
const districtCenters: Record<string, { x: number; z: number; lat: number; lon: number }> = {
  '昆山市': { ...geoTo3D(31.39, 120.98), lat: 31.39, lon: 120.98 },
  '苏州工业园区': { ...geoTo3D(31.32, 120.72), lat: 31.32, lon: 120.72 },
  '张家港市': { ...geoTo3D(31.87, 120.55), lat: 31.87, lon: 120.55 },
  '常熟市': { ...geoTo3D(31.65, 120.74), lat: 31.65, lon: 120.74 },
  '吴江区': { ...geoTo3D(31.16, 120.65), lat: 31.16, lon: 120.65 },
  '虎丘区': { ...geoTo3D(31.30, 120.57), lat: 31.30, lon: 120.57 },
  '太仓市': { ...geoTo3D(31.45, 121.10), lat: 31.45, lon: 121.10 },
  '吴中区': { ...geoTo3D(31.26, 120.62), lat: 31.26, lon: 120.62 },
  '相城区': { ...geoTo3D(31.37, 120.62), lat: 31.37, lon: 120.62 },
  '姑苏区': { ...geoTo3D(31.30, 120.63), lat: 31.30, lon: 120.63 },
}

// 详细信息
const districtDetails: Record<string, {
  population: number; gdp: number; area: number; density: number;
  income: number; desc: string; color: string;
  subDistricts?: { name: string; population: number; gdp: number }[];
  highlights?: string[];
}> = {
  '昆山市': {
    population: 216, gdp: 5615, area: 931, density: 232, income: 73968,
    desc: '中国最强县级市，台资聚集地', color: '#00d4ff',
    subDistricts: [
      { name: '玉山镇', population: 45, gdp: 1200 },
      { name: '花桥镇', population: 28, gdp: 800 },
      { name: '周市镇', population: 22, gdp: 650 },
      { name: '巴城镇', population: 18, gdp: 500 },
    ],
    highlights: ['GDP连续18年全国县级市第一', '电子信息产业集群', '深化两岸产业合作试验区'],
  },
  '苏州工业园区': {
    population: 137, gdp: 4163, area: 278, density: 493, income: 90125,
    desc: '金鸡湖畔，中新合作典范', color: '#00ff88',
    subDistricts: [
      { name: '湖东', population: 35, gdp: 1500 },
      { name: '湖西', population: 28, gdp: 1200 },
      { name: '娄葑', population: 25, gdp: 600 },
      { name: '唯亭', population: 22, gdp: 500 },
    ],
    highlights: ['中新合作项目', '生物医药产业高地', '金鸡湖商务区'],
  },
  '张家港市': {
    population: 88, gdp: 3300, area: 999, density: 88, income: 68000,
    desc: '全国文明城市，钢铁化工重镇', color: '#ff9f43',
    subDistricts: [
      { name: '杨舍镇', population: 32, gdp: 1100 },
      { name: '金港镇', population: 18, gdp: 800 },
      { name: '锦丰镇', population: 15, gdp: 600 },
    ],
    highlights: ['全国文明城市六连冠', '钢铁冶金产业集群', '长江港口物流'],
  },
  '常熟市': {
    population: 106, gdp: 3200, area: 1276, density: 83, income: 65000,
    desc: '服装之都，虞山尚湖风景区', color: '#a855f7',
    subDistricts: [
      { name: '虞山镇', population: 38, gdp: 1000 },
      { name: '梅李镇', population: 15, gdp: 500 },
      { name: '海虞镇', population: 12, gdp: 400 },
    ],
    highlights: ['中国服装城', '虞山尚湖5A景区', '汽车零部件产业'],
  },
  '吴江区': {
    population: 90, gdp: 2332, area: 1176, density: 77, income: 62000,
    desc: '丝绸之府，民营经济发达', color: '#ff6b6b',
    subDistricts: [
      { name: '松陵镇', population: 28, gdp: 700 },
      { name: '盛泽镇', population: 22, gdp: 600 },
      { name: '同里镇', population: 10, gdp: 300 },
    ],
    highlights: ['国家乡村振兴示范县', '丝绸纺织产业集群', '同里古镇世界文化遗产'],
  },
  '虎丘区': {
    population: 86, gdp: 1766, area: 223, density: 386, income: 75000,
    desc: '苏州高新区，科技创新高地', color: '#ffd93d',
    subDistricts: [
      { name: '狮山', population: 30, gdp: 700 },
      { name: '枫桥', population: 20, gdp: 400 },
      { name: '横塘', population: 15, gdp: 300 },
    ],
    highlights: ['国家级高新技术产业开发区', '集成电路产业', '太湖科学城'],
  },
  '太仓市': {
    population: 51, gdp: 1654, area: 620, density: 82, income: 66000,
    desc: '德企之乡，港口城市', color: '#4ecdc4',
    subDistricts: [
      { name: '城厢镇', population: 18, gdp: 500 },
      { name: '浏河镇', population: 12, gdp: 350 },
    ],
    highlights: ['中德中小企业合作区', '太仓港集装箱码头', '对德合作典范城市'],
  },
  '吴中区': {
    population: 112, gdp: 1590, area: 2231, density: 50, income: 60000,
    desc: '太湖之滨，生态宜居区', color: '#45b7d1',
    subDistricts: [
      { name: '长桥', population: 25, gdp: 400 },
      { name: '木渎', population: 18, gdp: 350 },
      { name: '甪直', population: 12, gdp: 250 },
    ],
    highlights: ['太湖生态岛', '吴文化发源地', '生物医药产业园'],
  },
  '相城区': {
    population: 92, gdp: 1431, area: 490, density: 188, income: 62000,
    desc: '高铁新城，交通枢纽', color: '#f78fb3',
    subDistricts: [
      { name: '元和', population: 28, gdp: 450 },
      { name: '黄桥', population: 15, gdp: 300 },
    ],
    highlights: ['苏州北站高铁枢纽', '数字金融产业园', '阳澄湖大闸蟹'],
  },
  '姑苏区': {
    population: 92, gdp: 1048, area: 83, density: 1108, income: 68000,
    desc: '苏州古城，世界文化遗产集中地', color: '#e056a0',
    subDistricts: [
      { name: '观前', population: 18, gdp: 250 },
      { name: '平江', population: 15, gdp: 200 },
      { name: '沧浪', population: 12, gdp: 180 },
    ],
    highlights: ['拙政园/留园/虎丘世界遗产', '平江路历史街区', '苏州古城保护示范区'],
  },
}

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

  if (!infoEl || !modal || !modalBody) {
    console.warn('[Interaction] 找不到弹窗元素')
    return
  }

  console.log('[Interaction] 初始化完成，等待点击...')

  // 关闭弹窗
  modalClose?.addEventListener('click', () => {
    modal.style.display = 'none'
  })

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none'
    }
  })

  // 将鼠标屏幕坐标投影到3D地面（y=0平面）
  function screenToGround(event: MouseEvent): THREE.Vector3 | null {
    const rect = canvas.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)

    // 与y=0平面相交
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const target = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, target)
    return target
  }

  // 找最近的区县
  function findNearestDistrict(groundPos: THREE.Vector3): { name: string; dist: number } | null {
    let nearest: string | null = null
    let minDist = Infinity

    for (const [name, center] of Object.entries(districtCenters)) {
      const dx = groundPos.x - center.x
      const dz = groundPos.z - center.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < minDist) {
        minDist = dist
        nearest = name
      }
    }

    // 点击范围阈值：15个3D单位（覆盖整个区县）
    if (nearest && minDist < 15) {
      return { name: nearest, dist: minDist }
    }
    return null
  }

  // 悬浮提示
  canvas.addEventListener('mousemove', (event) => {
    const groundPos = screenToGround(event)
    if (!groundPos) return

    const result = findNearestDistrict(groundPos)
    if (result) {
      const detail = districtDetails[result.name]
      if (detail) {
        const realPop = populationData[result.name] || detail.population
        const realGdp = gdpData[result.name] || detail.gdp
        infoEl.innerHTML = `
          <strong style="color:${detail.color}">${result.name}</strong><br>
          人口: ${realPop}万 | GDP: ${realGdp}亿<br>
          <span style="color:#6b7a99">${detail.desc}</span><br>
          <span style="color:#00d4ff;font-size:10px">点击查看详细数据 →</span>
        `
        infoEl.classList.add('visible')
        canvas.style.cursor = 'pointer'
        return
      }
    }

    infoEl.classList.remove('visible')
    canvas.style.cursor = 'grab'
  })

  // 点击弹窗
  canvas.addEventListener('click', (event) => {
    const groundPos = screenToGround(event)
    if (!groundPos) return

    const result = findNearestDistrict(groundPos)
    if (!result) return

    const detail = districtDetails[result.name]
    if (!detail) return

    if (modalHeader) modalHeader.textContent = result.name
    modalBody.innerHTML = renderDistrictDetail(result.name, detail)
    modal.style.display = 'block'
    infoEl.classList.remove('visible')
  })
}

function renderDistrictDetail(name: string, d: {
  population: number; gdp: number; area: number; density: number;
  income: number; desc: string; color: string;
  subDistricts?: { name: string; population: number; gdp: number }[];
  highlights?: string[];
}): string {
  const subDistrictsHtml = d.subDistricts?.map(sd => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a2744">
      <span>${sd.name}</span>
      <span>${sd.population}万人 | ${sd.gdp}亿</span>
    </div>
  `).join('') || ''

  const highlightsHtml = d.highlights?.map(h => `
    <span style="display:inline-block;background:rgba(0,212,255,0.1);border:1px solid #1a2744;border-radius:12px;padding:3px 10px;font-size:11px;margin:2px">${h}</span>
  `).join('') || ''

  const realPop = populationData[name] || d.population
  const realGdp = gdpData[name] || d.gdp
  const realArea = areaData[name] || d.area
  const realDensity = realArea > 0 ? Math.round(realPop * 10000 / realArea) : d.density

  return `
    <div style="padding:16px;color:#e0e6f0;font-family:'Segoe UI','PingFang SC',sans-serif">
      <div style="font-size:10px;color:#6b7a99;margin-bottom:12px;text-align:right">数据来源：苏州市统计局</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="detail-card">
          <div class="detail-label">常住人口</div>
          <div class="detail-value" style="color:${d.color}">${realPop}万</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">GDP</div>
          <div class="detail-value" style="color:${d.color}">${realGdp}亿</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">面积</div>
          <div class="detail-value">${realArea}km²</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">人口密度</div>
          <div class="detail-value">${realDensity}人/km²</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">人均收入</div>
          <div class="detail-value">${(d.income / 10000).toFixed(1)}万</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">人均GDP</div>
          <div class="detail-value">${realPop > 0 ? (realGdp / realPop * 10000).toFixed(0) : 0}元</div>
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

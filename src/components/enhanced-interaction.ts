// 增强交互模块 - 基于 Raycaster 精确多边形拾取 + 区县点击下钻弹窗 + 相机飞行联动
import * as THREE from 'three'
import { areaData, districtDetails, gdpData, gdpYearData, getDistrictDetail, populationData, populationYearData, verifiedDistrictSources, type DistrictDetailInfo } from '../data/official-stats'
import { districtPlanningNotes, districtPlanningSource, gusuHeritageSource } from '../data/planning-narratives'
import { CANONICAL_DISTRICTS, geoTo3D, getDistrictCoords, normalizeDistrictName } from '../utils/geo'
import { flyCameraTo, resetCameraView, wasCanvasDragged } from '../scene'
import { districtAtXZ, highlightDistrictBoundary } from './boundary'

const districtCenters: Record<string, { x: number; z: number; lat: number; lon: number }> = {}
for (const name of CANONICAL_DISTRICTS) {
  const c = getDistrictCoords(name)!
  districtCenters[name] = { ...geoTo3D(c.lat, c.lon), lat: c.lat, lon: c.lon }
}

let activeScene: THREE.Scene | null = null

export function openDistrictModal(rawName: string) {
  const canonicalName = normalizeDistrictName(rawName)
  const detail = getDistrictDetail(canonicalName)
  if (!detail) return

  const modal = document.getElementById('district-modal')
  const modalBody = modal?.querySelector('.modal-body')
  const modalHeader = modal?.querySelector('.modal-header h2')
  if (!modal || !modalBody) return

  if (modalHeader) modalHeader.textContent = canonicalName
  modalBody.innerHTML = renderDistrictDetail(canonicalName, detail)
  modal.style.display = 'flex'
  document.querySelectorAll<HTMLButtonElement>('.district-nav-item').forEach(button => {
    button.classList.toggle('active', button.dataset.district === canonicalName)
  })

  const center = districtCenters[canonicalName]
  if (center) {
    flyCameraTo(center.x, center.z, 140)
  }
  if (activeScene) {
    highlightDistrictBoundary(activeScene, canonicalName)
  }
}

export function setupEnhancedInteraction(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  scene: THREE.Scene
) {
  activeScene = scene
  const infoEl = document.getElementById('terrain-info')
  const modal = document.getElementById('district-modal')
  const modalBody = modal?.querySelector('.modal-body')
  const modalClose = modal?.querySelector('.modal-close')

  if (!infoEl || !modal || !modalBody) {
    console.warn('[Interaction] 找不到弹窗元素')
    return
  }

  const closeModal = () => {
    modal.style.display = 'none'
    document.querySelectorAll('.district-nav-item').forEach(button => button.classList.remove('active'))
    highlightDistrictBoundary(scene, null)
    resetCameraView()
  }

  modalClose?.addEventListener('click', closeModal)

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      closeModal()
    }
  })

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  // 优先通过 Raycaster 检测区县精确多边形网格与悬浮标牌，若边界层隐藏则回退至中心距离检测
  function pickDistrict(event: MouseEvent): string | null {
    const rect = canvas.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    const terrain = scene.getObjectByName('terrain')
    if (!terrain || !terrain.visible || !scene.getObjectByName('boundary-group')?.visible) return null
    const hit = raycaster.intersectObject(terrain, false)[0]
    return hit ? districtAtXZ(hit.point.x, hit.point.z) : null
  }

  // 悬浮提示 + 3D 边界高亮
  canvas.addEventListener('mousemove', (event) => {
    if (modal.style.display !== 'none') return
    const pickedName = pickDistrict(event)
    if (pickedName) {
      const detail = districtDetails[pickedName]
      if (detail) {
        const realPop = populationData[pickedName] || detail.population
        const realGdp = gdpData[pickedName] || detail.gdp
        const realArea = areaData[pickedName] || detail.area
        infoEl.innerHTML = `
          <strong style="color:${detail.color};font-size:13px">${pickedName}</strong><br>
          常住人口: <b>${realPop}万（${populationYearData[pickedName] ? `${populationYearData[pickedName]}年` : '年份待核'}）</b> | GDP: <b>${realGdp}亿（${gdpYearData[pickedName]}年）</b> | 面积: <b>${realArea}km²（待核）</b><br>
          <span style="color:var(--text-dim)">${detail.desc}</span><br>
          <span style="color:var(--accent);font-size:11px">点击查看下钻详情 · 双击画布或点击复位键恢复视角 →</span>
        `
        infoEl.classList.add('visible')
        canvas.style.cursor = 'pointer'
        highlightDistrictBoundary(scene, pickedName)
        return
      }
    }

    infoEl.classList.remove('visible')
    canvas.style.cursor = 'grab'
    if (modal.style.display === 'none') {
      highlightDistrictBoundary(scene, null)
    }
  })

  canvas.addEventListener('mouseleave', () => {
    infoEl.classList.remove('visible')
    if (modal.style.display === 'none') highlightDistrictBoundary(scene, null)
  })

  // 点击弹窗（过滤掉拖拽旋转操作）
  canvas.addEventListener('click', (event) => {
    if (wasCanvasDragged()) return
    const pickedName = pickDistrict(event)
    if (!pickedName) return

    infoEl.classList.remove('visible')
    openDistrictModal(pickedName)
  })
}

function renderDistrictDetail(name: string, d: DistrictDetailInfo): string {
  const planningNote = districtPlanningNotes[name]
  const planningSource = name === '姑苏区' ? gusuHeritageSource : districtPlanningSource
  const subDistrictsHtml = d.subDistricts?.map(sd => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
      <span>${sd.name}</span>
    </div>
  `).join('') || ''

  const highlightsHtml = d.highlights?.map(h => `
    <span style="display:inline-block;background:rgba(0,212,255,0.12);border:1px solid var(--border);border-radius:12px;padding:3px 10px;font-size:11px;margin:2px">${h}</span>
  `).join('') || ''

  const realPop = populationData[name] || d.population
  const realGdp = gdpData[name] || d.gdp
  const realArea = areaData[name] || d.area
  const realDensity = realArea > 0 ? Math.round((realPop * 10000) / realArea) : d.density
  const populationYear = populationYearData[name]
  const gdpYear = gdpYearData[name]
  const districtSource = verifiedDistrictSources[name]
  const densityText = populationYear === 2025 && districtSource?.population ? `${realDensity}人/km²` : '—'
  const gdpPerCapitaText = populationYear === gdpYear && districtSource?.gdp && districtSource.population && realPop > 0 ? `${((realGdp / realPop) * 10000).toFixed(0)}元` : '—'

  return `
    <div style="padding:16px;color:var(--text);font-family:'Segoe UI','PingFang SC',sans-serif">
      <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;text-align:right">统计指标年份与来源待逐项核验；当前数值请勿直接用于同年比较</div>
      ${districtSource ? `<div style="font-size:11px;margin-bottom:12px"><a href="${districtSource.url}" target="_blank" rel="noopener noreferrer">${districtSource.label}（${districtSource.gdp ? 'GDP' : ''}${districtSource.gdp && districtSource.population ? '、' : ''}${districtSource.population ? '常住人口' : ''}已核）↗</a></div>` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="detail-card">
            <div class="detail-label">常住人口（${populationYear ? `${populationYear}年末` : '年份待核'}）</div>
          <div class="detail-value" style="color:${d.color}">${realPop}万</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">GDP（${gdpYear}年）</div>
          <div class="detail-value" style="color:${d.color}">${realGdp}亿</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">面积</div>
          <div class="detail-value">${realArea}km²</div>
        </div>
        <div class="detail-card">
            <div class="detail-label">人口密度（人口已核、面积待核的估算）</div>
          <div class="detail-value">${densityText}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">人均可支配收入（待核验）</div>
          <div class="detail-value">${(d.income / 10000).toFixed(2)}万</div>
        </div>
        <div class="detail-card">
            <div class="detail-label">人均GDP（同年两项均已核时估算）</div>
          <div class="detail-value">${gdpPerCapitaText}</div>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:6px">${d.desc}</div>
      </div>

      ${planningNote ? `<div style="margin-bottom:16px;line-height:1.7;font-size:12px;color:var(--text)">
        <div style="font-size:13px;color:var(--accent);margin-bottom:6px">规划定位与阅读线索</div>
        <p>${planningNote}</p>
        <a href="${planningSource.url}" target="_blank" rel="noopener noreferrer">资料来源：${planningSource.title} ↗</a>
      </div>` : ''}

      ${d.subDistricts ? `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;color:var(--accent);margin-bottom:8px">区内板块 / 镇街（展示线索）</div>
          ${subDistrictsHtml}
        </div>
      ` : ''}

      ${d.highlights ? `
        <div>
          <div style="font-size:13px;color:var(--accent2);margin-bottom:8px">✨ 区域定位与特色亮点</div>
          ${highlightsHtml}
        </div>
      ` : ''}
    </div>
  `
}





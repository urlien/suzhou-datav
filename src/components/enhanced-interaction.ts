import { districtPhotos } from '../data/district-photos'
// 增强交互模块 - 基于 Raycaster 精确多边形拾取 + 区县点击下钻弹窗 + 相机飞行联动
import * as THREE from 'three'
import { getVerifiedDistrictMetrics, areaData, districtDetails, gdpData, gdpYearData, getDistrictDetail, populationData, populationYearData, verifiedDistrictSources, type DistrictDetailInfo } from '../data/official-stats'
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

  const featureImage = document.querySelector<HTMLImageElement>('.region-feature-image')
  const featureTitle = document.querySelector('.region-feature-content strong')
  const featureKicker = document.querySelector('.region-feature-kicker')
  const featureCopy = document.querySelector('.region-feature-content p')
  const featureCredit = document.querySelector<HTMLElement>('.region-feature-credit')
  const photo = districtPhotos[canonicalName]
  if (featureImage && photo) { featureImage.src = photo.src; featureImage.alt = canonicalName + ' · ' + photo.caption }
  if (featureTitle) featureTitle.textContent = canonicalName
  if (featureKicker && photo) featureKicker.textContent = '区域导览 · ' + photo.caption
  if (featureCopy) featureCopy.textContent = detail.desc
  if (featureCredit && photo) featureCredit.innerHTML = photoCredit(canonicalName)
  const featured = document.getElementById('featured-district')
  if (featured) featured.dataset.district = canonicalName
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
  let lastHoverTime = 0
  let lastPicked: string | null | undefined
  canvas.addEventListener('mousemove', (event) => {
    if (event.buttons || performance.now() - lastHoverTime < 80) return
    lastHoverTime = performance.now()
    if (modal.style.display !== 'none') return
    const pickedName = pickDistrict(event)
    if (pickedName === lastPicked) return
    lastPicked = pickedName
    if (pickedName) {
      const detail = districtDetails[pickedName]
      if (detail) {
        const realPop = populationData[pickedName] || detail.population
        const realGdp = gdpData[pickedName] || detail.gdp
        const realArea = areaData[pickedName] || detail.area
        infoEl.innerHTML = `
          <strong style="color:${detail.color};font-size:13px">${pickedName}</strong><br>
          常住人口: <b>${getVerifiedDistrictMetrics(pickedName).population !== null ? `${realPop}万（2025年）` : '最新值待核'}</b> | GDP: <b>${getVerifiedDistrictMetrics(pickedName).gdp !== null ? `${realGdp}亿（2025年）` : '最新值待核'}</b> | 面积: <b>待核</b><br>
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
    lastPicked = undefined
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

function escapePhotoText(value: string): string {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
}
function photoCredit(name: string): string {
  const p = districtPhotos[name]
  if (!p) return ''
  return `<a href="${escapePhotoText(p.source)}" target="_blank" rel="noopener noreferrer">${escapePhotoText(p.author)}</a> · <a href="${escapePhotoText(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapePhotoText(p.license)}</a><br>拍摄：${escapePhotoText(p.date)} · 封面裁切；非实时影像`
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
  const densityText = '—'
  const gdpPerCapitaText = getVerifiedDistrictMetrics(name).gdp !== null && getVerifiedDistrictMetrics(name).population !== null && realPop > 0 ? `${((realGdp / realPop) * 10000).toFixed(0)}元` : '—'

  return `
    <div style="padding:16px;color:var(--text);font-family:'Segoe UI','PingFang SC',sans-serif">
      ${districtPhotos[name] ? `<figure class="district-map"><img src="${districtPhotos[name].src}" alt="${escapePhotoText(districtPhotos[name].caption)}" loading="lazy" decoding="async" width="960" height="640" style="aspect-ratio:3/2;object-fit:cover"><figcaption>${escapePhotoText(districtPhotos[name].caption)}<br>${photoCredit(name)}</figcaption></figure>` : ''}
      <figure class="district-map"><img src="/images/districts/${encodeURIComponent(name)}.svg" alt="${name}在苏州市域中的区位示意" width="640" height="400"><figcaption>市域区位示意 · 边界来源待追溯；园区为示意点位</figcaption></figure>
      <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;text-align:right">统计指标年份与来源待逐项核验；当前数值请勿直接用于同年比较</div>
      ${getVerifiedDistrictMetrics(name).populationSource ? `<p><a href="${getVerifiedDistrictMetrics(name).populationSource}" target="_blank" rel="noopener noreferrer">2025年常住人口原文 ↗</a></p>` : ''}
      ${districtSource ? `<div style="font-size:11px;margin-bottom:12px"><a href="${districtSource.url}" target="_blank" rel="noopener noreferrer">${districtSource.label}（${districtSource.gdp ? 'GDP' : ''}${districtSource.gdp && districtSource.population ? '、' : ''}${districtSource.population ? '常住人口' : ''}已核）↗</a></div>` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="detail-card">
            <div class="detail-label">常住人口（2025年末）</div>
          <div class="detail-value" style="color:${d.color}">${getVerifiedDistrictMetrics(name).population !== null ? `${realPop}万` : '最新值待核'}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">GDP（${gdpYear}年）</div>
          <div class="detail-value" style="color:${d.color}">${realGdp}亿</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">面积</div>
          <div class="detail-value">最新值待核</div>
        </div>
        <div class="detail-card">
            <div class="detail-label">人口密度（人口已核、面积待核的估算）</div>
          <div class="detail-value">${densityText}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">人均可支配收入（待核验）</div>
          <div class="detail-value">最新值待核</div>
        </div>
        <div class="detail-card">
            <div class="detail-label">GDP/年末人口（非官方人均GDP）</div>
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





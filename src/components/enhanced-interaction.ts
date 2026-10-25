// 增强交互模块 - 基于 Raycaster 精确多边形拾取 + 区县点击下钻弹窗 + 相机飞行联动
import * as THREE from 'three'
import { areaData, districtDetails, gdpData, getDistrictDetail, populationData, type DistrictDetailInfo } from '../data/official-stats'
import { CANONICAL_DISTRICTS, geoTo3D, getDistrictCoords, normalizeDistrictName } from '../utils/geo'
import { flyCameraTo, resetCameraView, wasCanvasDragged } from '../scene'
import { highlightDistrictBoundary } from './boundary'

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
  modal.style.display = 'flex' // 保持 Flex 居中，避免贴在左上角

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

    const boundaryGroup = scene.getObjectByName('boundary-group')
    if (boundaryGroup && boundaryGroup.visible) {
      const hits = raycaster.intersectObjects(boundaryGroup.children, false)
      for (const hit of hits) {
        const dName = hit.object.userData?.districtName
        if (dName && hit.object.visible) return normalizeDistrictName(dName)
      }
    }

    // 回退：与 y=0 平面相交后找最近区县中心
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const target = new THREE.Vector3()
    if (!raycaster.ray.intersectPlane(plane, target)) return null

    let nearest: string | null = null
    let minDist = Infinity
    for (const [name, center] of Object.entries(districtCenters)) {
      const dist = Math.hypot(target.x - center.x, target.z - center.z)
      if (dist < minDist) {
        minDist = dist
        nearest = name
      }
    }
    return nearest && minDist < 16 ? nearest : null
  }

  // 悬浮提示 + 3D 边界高亮
  canvas.addEventListener('mousemove', (event) => {
    const pickedName = pickDistrict(event)
    if (pickedName) {
      const detail = districtDetails[pickedName]
      if (detail) {
        const realPop = populationData[pickedName] || detail.population
        const realGdp = gdpData[pickedName] || detail.gdp
        const realArea = areaData[pickedName] || detail.area
        infoEl.innerHTML = `
          <strong style="color:${detail.color};font-size:13px">${pickedName}</strong><br>
          常住人口: <b>${realPop}万</b> | GDP: <b>${realGdp}亿</b> | 面积: <b>${realArea}km²</b><br>
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
  const subDistrictsHtml = d.subDistricts?.map(sd => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
      <span>${sd.name}</span>
      <span>${sd.population}万人 | ${sd.gdp}亿</span>
    </div>
  `).join('') || ''

  const highlightsHtml = d.highlights?.map(h => `
    <span style="display:inline-block;background:rgba(0,212,255,0.12);border:1px solid var(--border);border-radius:12px;padding:3px 10px;font-size:11px;margin:2px">${h}</span>
  `).join('') || ''

  const realPop = populationData[name] || d.population
  const realGdp = gdpData[name] || d.gdp
  const realArea = areaData[name] || d.area
  const realDensity = realArea > 0 ? Math.round((realPop * 10000) / realArea) : d.density

  return `
    <div style="padding:16px;color:var(--text);font-family:'Segoe UI','PingFang SC',sans-serif">
      <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;text-align:right">数据来源：苏州市统计局 · 官方统计公报</div>

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
          <div class="detail-label">人均可支配收入</div>
          <div class="detail-value">${(d.income / 10000).toFixed(2)}万</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">人均GDP</div>
          <div class="detail-value">${realPop > 0 ? ((realGdp / realPop) * 10000).toFixed(0) : 0}元</div>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:6px">${d.desc}</div>
      </div>

      ${d.subDistricts ? `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;color:var(--accent);margin-bottom:8px">📍 重点下辖板块 / 镇街</div>
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

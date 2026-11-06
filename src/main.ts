import { initNetworkAnalysis } from "./components/network-analysis"
import * as THREE from "three"
import { initScene, resetCameraView, setMapViewDistance, startEntranceAnimation, updateSceneTheme } from "./scene"
import { initCharts, resizeAllCharts, updateChartsTheme } from "./components/charts"
import { addHeatmap, toggleHeatmap } from "./components/heatmap"
import { addBoundary, highlightDistrictBoundary, toggleBoundary } from "./components/boundary"
import { openDistrictModal, setupEnhancedInteraction } from "./components/enhanced-interaction"
import { initSearch } from "./components/search"
import { initExport } from "./components/export"
import { animateNumbers } from "./components/animation"
import { initTimeline } from "./components/timeline"
import { initComparison } from "./components/comparison"
import { initFilter } from "./components/filter"
import { initRuralUrban } from "./components/rural-urban"
import { initDataStory } from "./components/data-story"
import { fetchWeather, fetchAirQuality, renderWeatherPanel } from "./components/realtime"
import { initDataAnnotations } from "./components/data-annotation"
import { initRuralUrbanIndex } from "./components/rural-urban-index"
import { exportPDF } from "./components/pdf-export"
import { addLandcover } from "./components/landcover"
import { addRoadNight, setRoadNightVisible } from "./components/road-night"
import "./measure.css"
import "./style.css"
import "./print.css"

async function main() {
  const scene = await initScene()
  addHeatmap(scene)
  toggleHeatmap(scene)

  // 并行加载地图图层；建筑白膜待数据重建后再接入。
  await Promise.all([
    addBoundary(scene),
    addLandcover(scene).catch(err => console.warn('[Landcover] 加载失败:', err)),
    addRoadNight(scene).catch(err => {
      document.querySelector('[data-layer="roads"]')?.classList.remove('active')
      document.getElementById('night-map-note')?.setAttribute('hidden', '')
      console.warn('[Road night] 道路纹理加载失败:', err)
    })
  ])
  setRoadNightVisible(scene, Boolean(scene.getObjectByName('road-night-group')))

  initCharts()
  initSearch()
  initNetworkAnalysis(scene)
  document.querySelectorAll<HTMLButtonElement>('.district-nav-item').forEach(button => {
    button.addEventListener('click', () => {
      const district = button.dataset.district
      if (!district) return
      document.querySelectorAll('.district-nav-item').forEach(item => item.classList.toggle('active', item === button))
      openDistrictModal(district)
    })
  })
  document.getElementById('featured-district')?.addEventListener('click', () => openDistrictModal(document.getElementById('featured-district')?.dataset.district || '姑苏区'))
  initExport()
  initTimeline()
  initComparison()
  initFilter()
  initRuralUrban()
  initDataStory(scene)
  initDataAnnotations()
  initRuralUrbanIndex()

  // 先渲染默认实时气象占位，后台拉取完成后平滑刷新
  const weatherPanel = document.getElementById("weather-panel")
  if (weatherPanel) {
    renderWeatherPanel(weatherPanel)
    Promise.all([fetchWeather(), fetchAirQuality()]).then(() => {
      renderWeatherPanel(weatherPanel)
    })
  }

  const canvas = document.getElementById("canvas") as HTMLCanvasElement
  const camera = scene.getObjectByProperty("type", "PerspectiveCamera") as THREE.PerspectiveCamera
  if (camera && canvas) {
    setupEnhancedInteraction(camera, canvas, scene)
  }

  document.querySelectorAll<HTMLButtonElement>('#map-scale button[data-view-level]').forEach(button => {
    button.addEventListener('click', () => {
      const distance = { city: 118, region: 85, near: 55 }[button.dataset.viewLevel || 'city']
      if (distance) setMapViewDistance(distance)
    })
  })

  // 底部工具栏 - 4个图层切换（地形、行政边界、人口热力、3D建筑）
  const controls = document.getElementById('map-controls') as HTMLDetailsElement | null
  controls?.addEventListener('toggle', () => controls.setAttribute('aria-label', controls.open ? '地图工具，点击标题收起' : '地图工具，点击标题展开'))
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && controls?.open) { controls.open = false; controls.querySelector('summary')?.focus() }
  })
  const toolbar = document.getElementById("toolbar")
  const legendEl = document.getElementById('legend')
  const syncLegendVisibility = () => {
    if (!legendEl) return
    const visible = ['heatmap-group', 'kernel-density', 'accessibility-group'].some(name => scene.getObjectByName(name)?.visible)
    legendEl.style.display = visible ? '' : 'none'
  }
  syncLegendVisibility()
  if (toolbar) {
    toolbar.querySelectorAll("button[data-layer]").forEach(btn => {
      btn.setAttribute("aria-pressed", String(btn.classList.contains("active")))
      const objectName = { landcover: "landcover", roads: "road-night-group" }[btn.getAttribute("data-layer") || ""]
      if (objectName && !scene.getObjectByName(objectName)) {
        (btn as HTMLButtonElement).disabled = true
        btn.classList.remove("active")
        btn.setAttribute("aria-pressed", "false")
        btn.setAttribute("title", "图层加载失败，请刷新重试")
      }
      btn.addEventListener("click", () => {
        const layer = btn.getAttribute("data-layer")
        if (layer === "terrain") {
          const isActive = btn.classList.toggle("active")
          const terrain = scene.getObjectByName("terrain")
          const grid = scene.getObjectByName("grid-helper")
          const landcover = scene.getObjectByName("landcover")
          const roadNight = scene.getObjectByName("road-night-group")
          if (terrain) terrain.visible = isActive
          if (grid) grid.visible = isActive
          if (landcover) landcover.visible = isActive && !!toolbar.querySelector('[data-layer="landcover"]')?.classList.contains('active')
          setRoadNightVisible(scene, isActive && !!toolbar.querySelector('[data-layer="roads"]')?.classList.contains('active'))
          document.getElementById('night-map-note')?.toggleAttribute('hidden', !roadNight?.visible)
        } else if (layer === "boundary") {
          const visible = toggleBoundary(scene)
          btn.classList.toggle("active", visible)
        } else if (layer === "heatmap") {
          const visible = toggleHeatmap(scene)
          btn.classList.toggle("active", visible)
          syncLegendVisibility()
        } else if (layer === "roads") {
          const active = btn.classList.toggle('active')
          const visible = setRoadNightVisible(scene, active && scene.getObjectByName('terrain')?.visible !== false)
          btn.setAttribute('aria-pressed', String(active))
          document.getElementById('night-map-note')?.toggleAttribute('hidden', !visible)
        } else if (layer === "landcover") {
          const landcover = scene.getObjectByName('landcover')
          if (landcover) {
            const enabled = btn.classList.toggle('active')
            landcover.visible = enabled && scene.getObjectByName('terrain')?.visible !== false
          }
        }
      })
    })
  }

  toolbar?.addEventListener("click", () => {
    toolbar.querySelectorAll("button[data-layer]").forEach(button => button.setAttribute("aria-pressed", String(button.classList.contains("active"))))
  })

  // 视角复位按钮
  document.getElementById("btn-reset-view")?.addEventListener("click", () => {
    highlightDistrictBoundary(scene, null)
    resetCameraView()
  })

  // 底部综合分析抽屉（历年时间轴 / 区县对比 / 数据筛选）
  const drawer = document.getElementById("analysis-drawer")
  const drawerCloseBtn = document.getElementById("drawer-close")
  const drawerTabs = document.querySelectorAll<HTMLButtonElement>(".drawer-tab-btn")
  const drawerPanes: Record<string, HTMLElement | null> = {
    timeline: document.getElementById("timeline-container"),
    comparison: document.getElementById("comparison-container"),
    filter: document.getElementById("filter-container"),
  }

  drawerTabs.forEach(tabBtn => {
    tabBtn.addEventListener("click", () => {
      const targetKey = tabBtn.getAttribute("data-drawer") || ""
      const isAlreadyActive = tabBtn.classList.contains("active") && !drawer?.classList.contains("hidden")

      if (isAlreadyActive) {
        drawer?.classList.add("hidden")
        drawerTabs.forEach(b => b.classList.remove("active"))
        return
      }

      drawerTabs.forEach(b => b.classList.toggle("active", b === tabBtn))
      Object.entries(drawerPanes).forEach(([key, pane]) => {
        if (pane) pane.style.display = key === targetKey ? "block" : "none"
      })
      drawer?.classList.remove("hidden")
      setTimeout(() => resizeAllCharts(), 80)
    })
  })

  drawerCloseBtn?.addEventListener("click", () => {
    drawer?.classList.add("hidden")
    drawerTabs.forEach(b => b.classList.remove("active"))
  })

  // 主题与投影模式切换（同步驱动 3D 场景背景与 ECharts 图表主题色）
  const themeBtn = document.getElementById("theme-toggle")
  const projBtn = document.getElementById("projection-toggle")
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme")
      const nextTheme = currentTheme === "light" ? "" : "light"
      document.documentElement.setAttribute("data-theme", nextTheme)
      themeBtn.textContent = nextTheme === "light" ? "☀️" : "🌙"
      if (projBtn) projBtn.textContent = "📽️"
      updateSceneTheme(scene, nextTheme)
      updateChartsTheme(nextTheme)
    })
  }

  if (projBtn) {
    projBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme")
      const nextTheme = currentTheme === "projection" ? "" : "projection"
      document.documentElement.setAttribute("data-theme", nextTheme)
      projBtn.textContent = nextTheme === "projection" ? "🔆" : "📽️"
      if (themeBtn) themeBtn.textContent = "🌙"
      updateSceneTheme(scene, nextTheme)
      updateChartsTheme(nextTheme)
    })
  }

  const pdfBtn = document.getElementById("export-pdf")
  if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {
      pdfBtn.textContent = "⏳ 正在导出..."
      exportPDF().finally(() => {
        pdfBtn.textContent = "📄 PDF报告"
      })
    })
  }

  // 移除加载遮罩后再启动相机入场动画与数字跳动
  const loading = document.getElementById("loading")
  if (loading) {
    loading.classList.add("hidden")
    setTimeout(() => loading.remove(), 500)
  }

  startEntranceAnimation()
  setTimeout(animateNumbers, 200)
}

main().catch(error => {
  console.error('地图初始化失败', error)
  const loading = document.getElementById('loading')
  if (loading) loading.textContent = '地图加载失败，请刷新重试。'
})

import * as THREE from "three"
import { initScene, resetCameraView, setMapViewDistance, startEntranceAnimation, updateSceneTheme } from "./scene"
import { initCharts, resizeAllCharts, updateChartsTheme } from "./components/charts"
import { addHeatmap, toggleHeatmap } from "./components/heatmap"
import { addFlyingLines, switchFlyingLineSystem } from "./components/flying-lines"
import { addBoundary, highlightDistrictBoundary, toggleBoundary } from "./components/boundary"
import { setupEnhancedInteraction } from "./components/enhanced-interaction"
import { initSearch } from "./components/search"
import { initExport } from "./components/export"
import { animateNumbers } from "./components/animation"
import { initTimeline } from "./components/timeline"
import { initComparison } from "./components/comparison"
import { addKernelDensity, addStandardDeviationalEllipse, addAccessibilityAnalysis } from "./components/spatial-analysis"
import { addBuildings, toggleBuildings } from "./components/buildings"
import { initFilter } from "./components/filter"
import { initRuralUrban } from "./components/rural-urban"
import { initDataStory } from "./components/data-story"
import { fetchWeather, fetchAirQuality, renderWeatherPanel } from "./components/realtime"
import { initDataAnnotations } from "./components/data-annotation"
import { initRuralUrbanIndex } from "./components/rural-urban-index"
import { exportPDF } from "./components/pdf-export"
import { resolveTerrainMode } from "./utils/terrain-mode"
import { addLandcover } from "./components/landcover"
import "./style.css"
import "./print.css"

async function main() {
  const scene = await initScene()
  addHeatmap(scene)
  addFlyingLines(scene)

  // 并行加载行政边界与3D建筑数据，缩短首屏等待时间
  await Promise.all([
    addBoundary(scene),
    addBuildings(scene),
    addLandcover(scene).catch(err => console.warn('[Landcover] 加载失败:', err))
  ])

  initCharts()
  initSearch()
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
      const distance = { city: 210, region: 110, near: 55 }[button.dataset.viewLevel || 'city']
      if (distance) setMapViewDistance(distance)
    })
  })

  // 底部工具栏 - 4个图层切换（地形、行政边界、人口热力、3D建筑）
  const toolbar = document.getElementById("toolbar")
  if (toolbar) {
    if (resolveTerrainMode() === "registration") toolbar.querySelector('[data-layer="buildings"]')?.classList.remove("active")
    toolbar.querySelectorAll("button[data-layer]").forEach(btn => {
      btn.addEventListener("click", () => {
        const layer = btn.getAttribute("data-layer")
        if (layer === "terrain") {
          const isActive = btn.classList.toggle("active")
          const terrain = scene.getObjectByName("terrain")
          const grid = scene.getObjectByName("grid-helper")
          const landcover = scene.getObjectByName("landcover")
          if (terrain) terrain.visible = isActive
          if (grid) grid.visible = isActive
          if (landcover) landcover.visible = isActive && !!toolbar.querySelector('[data-layer="landcover"]')?.classList.contains('active')
        } else if (layer === "boundary") {
          const visible = toggleBoundary(scene)
          btn.classList.toggle("active", visible)
        } else if (layer === "heatmap") {
          const visible = toggleHeatmap(scene)
          btn.classList.toggle("active", visible)
        } else if (layer === "buildings") {
          const visible = toggleBuildings(scene)
          btn.classList.toggle("active", visible)
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

  // 飞线系统切换
  const flyingSystemMap: Record<string, number> = {
    population: 0,
    transport: 1,
    logistics: 2,
    economic: 3,
  }
  toolbar?.querySelectorAll("button[data-flying]").forEach(btn => {
    btn.addEventListener("click", () => {
      const systemName = btn.getAttribute("data-flying")!
      const index = flyingSystemMap[systemName]
      if (index !== undefined) {
        switchFlyingLineSystem(scene, index)
        toolbar?.querySelectorAll("button[data-flying]").forEach(b => b.classList.remove("active"))
        btn.classList.add("active")
      }
    })
  })

  // 视角复位按钮
  document.getElementById("btn-reset-view")?.addEventListener("click", () => {
    highlightDistrictBoundary(scene, null)
    resetCameraView()
  })

  // 空间分析按钮（复用缓存图层，避免重复创建/销毁导致显存泄漏）
  const legendTitleEl = document.querySelector("#legend .legend-title")

  document.getElementById("btn-kernel-density")?.addEventListener("click", () => {
    const btn = document.getElementById("btn-kernel-density")!
    const existing = scene.getObjectByName("kernel-density")
    if (existing && existing.visible) {
      existing.visible = false
      btn.classList.remove("active")
      if (legendTitleEl) legendTitleEl.textContent = "人口密度热力"
    } else {
      addKernelDensity(scene)
      btn.classList.add("active")
      if (legendTitleEl) legendTitleEl.textContent = "A级景区核密度"
    }
  })

  document.getElementById("btn-ellipse")?.addEventListener("click", () => {
    const btn = document.getElementById("btn-ellipse")!
    const existing = scene.getObjectByName("std-ellipse-group")
    if (existing && existing.visible) {
      existing.visible = false
      btn.classList.remove("active")
    } else {
      addStandardDeviationalEllipse(scene)
      btn.classList.add("active")
    }
  })

  document.getElementById("btn-accessibility")?.addEventListener("click", () => {
    const btn = document.getElementById("btn-accessibility")!
    const existing = scene.getObjectByName("accessibility-group")
    if (existing && existing.visible) {
      existing.visible = false
      btn.classList.remove("active")
      if (legendTitleEl) legendTitleEl.textContent = "人口密度热力"
    } else {
      addAccessibilityAnalysis(scene)
      btn.classList.add("active")
      if (legendTitleEl) legendTitleEl.textContent = "中心枢纽交通等时圈 (10~60min)"
    }
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

main()


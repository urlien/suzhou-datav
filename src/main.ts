import * as THREE from "three"
import { initScene } from "./scene"
import { initCharts } from "./components/charts"
import { addHeatmap, toggleHeatmap } from "./components/heatmap"
import { addBoundary, toggleBoundary } from "./components/boundary"
import { setupEnhancedInteraction } from "./components/enhanced-interaction"
import { initSearch } from "./components/search"
import { initExport } from "./components/export"
import { animateNumbers, animateCharts } from "./components/animation"
import { initTimeline } from "./components/timeline"
import { initComparison } from "./components/comparison"
import { addKernelDensity, addStandardDeviationalEllipse, addAccessibilityAnalysis } from "./components/spatial-analysis"
import { addBuildings } from "./components/buildings"
import { initFilter } from "./components/filter"
import { initRuralUrban } from "./components/rural-urban"
import { initDataStory } from "./components/data-story"
import { fetchWeather, fetchAirQuality, renderWeatherPanel } from "./components/realtime"
import { initDataAnnotations } from "./components/data-annotation"
import { initRuralUrbanIndex } from "./components/rural-urban-index"
import { exportPDF } from "./components/pdf-export"
import "./style.css"
import "./print.css"

async function main() {
  const scene = await initScene()
  addHeatmap(scene)
  addBoundary(scene)
  await addBuildings(scene)
  initCharts()
  initSearch()
  initExport()
  initTimeline()
  initComparison()
  initFilter()
  initRuralUrban()
  initDataStory()
  initDataAnnotations()
  initRuralUrbanIndex()

  const weatherPanel = document.getElementById("weather-panel")
  if (weatherPanel) {
    fetchWeather().then(() => fetchAirQuality()).then(() => {
      renderWeatherPanel(weatherPanel)
    })
  }
  
  const canvas = document.getElementById("canvas") as HTMLCanvasElement
  const camera = scene.children.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera
  if (camera && canvas) {
    setupEnhancedInteraction(camera, canvas, scene)
  }
  
  // 底部工具栏 - 图层切换
  const toolbar = document.getElementById("toolbar")
  if (toolbar) {
    toolbar.querySelectorAll("button[data-layer]").forEach(btn => {
      btn.addEventListener("click", () => {
        const layer = btn.getAttribute("data-layer")
        btn.classList.toggle("active")

        if (layer === "terrain") {
          scene.children.forEach(c => {
            if (c.type === "Mesh" && c.name !== "buildings") c.visible = btn.classList.contains("active")
          })
        } else if (layer === "heatmap") {
          toggleHeatmap(scene)
        } else if (layer === "boundary") {
          toggleBoundary(scene)
        }
      })
    })
  }

  // 空间分析按钮
  let kernelDensityMesh: THREE.Mesh | null = null

  document.getElementById("btn-kernel-density")?.addEventListener("click", () => {
    const btn = document.getElementById("btn-kernel-density")!
    if (kernelDensityMesh) {
      scene.remove(kernelDensityMesh)
      kernelDensityMesh = null
      btn.classList.remove("active")
    } else {
      kernelDensityMesh = addKernelDensity(scene)
      btn.classList.add("active")
    }
  })

  document.getElementById("btn-ellipse")?.addEventListener("click", () => {
    const btn = document.getElementById("btn-ellipse")!
    const existing = scene.getObjectByName("std-ellipse")
    if (existing) {
      scene.remove(existing)
      const center = scene.getObjectByName("ellipse-center")
      if (center) scene.remove(center)
      btn.classList.remove("active")
    } else {
      addStandardDeviationalEllipse(scene)
      btn.classList.add("active")
    }
  })

  document.getElementById("btn-accessibility")?.addEventListener("click", () => {
    const btn = document.getElementById("btn-accessibility")!
    const existing = scene.getObjectByName("accessibility-10min")
    if (existing) {
      scene.children.filter(c => c.name?.startsWith("accessibility")).forEach(c => scene.remove(c))
      btn.classList.remove("active")
    } else {
      addAccessibilityAnalysis(scene)
      btn.classList.add("active")
    }
  })
  
  const themeBtn = document.getElementById("theme-toggle")
  if (themeBtn) {
    let isDark = true
    themeBtn.addEventListener("click", () => {
      isDark = !isDark
      document.documentElement.setAttribute("data-theme", isDark ? "" : "light")
      themeBtn.textContent = isDark ? "🌙" : "☀️"
    })
  }
  
  const pdfBtn = document.getElementById("export-pdf")
  if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {
      pdfBtn.textContent = "⏳ Generating..."
      exportPDF().finally(() => {
        pdfBtn.textContent = "📄 PDF"
      })
    })
  }

  const projBtn = document.getElementById("projection-toggle")
  if (projBtn) {
    projBtn.addEventListener("click", () => {
      const isProjection = document.documentElement.getAttribute("data-theme") === "projection"
      document.documentElement.setAttribute("data-theme", isProjection ? "" : "projection")
      projBtn.textContent = isProjection ? "📽️" : "🌙"
    })
  }

  const loading = document.getElementById("loading")
  if (loading) {
    loading.classList.add("hidden")
    setTimeout(() => loading.remove(), 500)
  }
  
  setTimeout(animateNumbers, 600)
  animateCharts()
}

main()

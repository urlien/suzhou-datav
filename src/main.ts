import * as THREE from 'three'
import { initScene } from './scene'
import { initCharts } from './components/charts'
import { addHeatmap } from './components/heatmap'
import { addBoundary } from './components/boundary'
import { setupInteraction } from './components/interaction'
import { initSearch } from './components/search'
import { initExport } from './components/export'
import { animateNumbers, animateCharts } from './components/animation'
import { initTimeline } from './components/timeline'
import { initComparison } from './components/comparison'
import { addKernelDensity, addStandardDeviationalEllipse, addAccessibilityAnalysis } from './components/spatial-analysis'
import './style.css'

async function main() {
  const scene = await initScene()
  addHeatmap(scene)
  addBoundary(scene)
  initCharts()
  initSearch()
  initExport()
  initTimeline()
  initComparison()
  
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const camera = scene.children.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera
  if (camera && canvas) {
    setupInteraction(camera, canvas)
  }
  
  // 空间分析按钮
  let kernelDensityMesh: THREE.Mesh | null = null
  let ellipseMesh: THREE.Line | null = null
  let accessibilityMeshes: THREE.Mesh[] = []

  document.getElementById('btn-kernel-density')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-kernel-density')!
    if (kernelDensityMesh) {
      scene.remove(kernelDensityMesh)
      kernelDensityMesh = null
      btn.classList.remove('active')
    } else {
      kernelDensityMesh = addKernelDensity(scene)
      btn.classList.add('active')
    }
  })

  document.getElementById('btn-ellipse')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-ellipse')!
    const existing = scene.getObjectByName('std-ellipse')
    const existingCenter = scene.getObjectByName('ellipse-center')
    if (existing) {
      scene.remove(existing)
      if (existingCenter) scene.remove(existingCenter)
      btn.classList.remove('active')
    } else {
      addStandardDeviationalEllipse(scene)
      btn.classList.add('active')
    }
  })

  document.getElementById('btn-accessibility')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-accessibility')!
    const existing = scene.getObjectByName('accessibility-10min')
    if (existing) {
      // 移除所有可达性相关对象
      scene.children.filter(c => c.name?.startsWith('accessibility')).forEach(c => scene.remove(c))
      btn.classList.remove('active')
    } else {
      addAccessibilityAnalysis(scene)
      btn.classList.add('active')
    }
  })
  
  // 主题切换
  const themeBtn = document.getElementById('theme-toggle')
  if (themeBtn) {
    let isDark = true
    themeBtn.addEventListener('click', () => {
      isDark = !isDark
      document.documentElement.setAttribute('data-theme', isDark ? '' : 'light')
      themeBtn.textContent = isDark ? '🌙' : '☀️'
    })
  }
  
  // 隐藏加载动画
  const loading = document.getElementById('loading')
  if (loading) {
    loading.classList.add('hidden')
    setTimeout(() => loading.remove(), 500)
  }
  
  // 启动数字动画
  setTimeout(animateNumbers, 600)
  animateCharts()
}

main()

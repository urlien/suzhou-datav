import * as THREE from 'three'
import { initScene } from './scene'
import { initCharts } from './components/charts'
import { addHeatmap } from './components/heatmap'
import { addBoundary } from './components/boundary'
import { setupInteraction } from './components/interaction'
import { initSearch } from './components/search'
import { initExport } from './components/export'
import { animateNumbers, animateCharts } from './components/animation'
import './style.css'

async function main() {
  const scene = await initScene()
  addHeatmap(scene)
  addBoundary(scene)
  initCharts()
  initSearch()
  initExport()
  
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const camera = scene.children.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera
  if (camera && canvas) {
    setupInteraction(camera, canvas)
  }
  
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

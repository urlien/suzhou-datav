import { initScene } from './scene'
import { initCharts } from './components/charts'
import { addHeatmap } from './components/heatmap'
import { addBoundary } from './components/boundary'
import './style.css'

// 初始化场景并添加热力图和边界
async function main() {
  const scene = await initScene()
  addHeatmap(scene)
  addBoundary(scene)
  initCharts()
}

main()

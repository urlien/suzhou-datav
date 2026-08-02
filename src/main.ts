import * as THREE from "three"
import { initScene } from './scene'
import { initCharts } from './components/charts'
import { addHeatmap } from './components/heatmap'
import { addBoundary } from './components/boundary'
import { setupInteraction } from './components/interaction'
import './style.css'

async function main() {
  const scene = await initScene()
  addHeatmap(scene)
  addBoundary(scene)
  initCharts()
  
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const camera = scene.children.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera
  if (camera && canvas) {
    setupInteraction(camera, canvas)
  }
}

main()

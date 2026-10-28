import * as THREE from 'three'
import { BOUNDS } from '../utils/geo'

type Feature = { properties: { kind: string }; geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] } }

export async function addLandcover(scene: THREE.Scene) {
  const response = await fetch('/suzhou-landcover-osm.geojson')
  if (!response.ok) throw new Error(`land cover: ${response.status}`)
  const data = await response.json() as { features: Feature[] }
  const terrain = scene.getObjectByName('terrain') as THREE.Mesh | undefined
  if (!terrain) return
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 2048
  const ctx = canvas.getContext('2d')!
  for (const feature of data.features) {
    const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates as number[][][][] : [feature.geometry.coordinates as number[][][]]
    ctx.fillStyle = feature.properties.kind === 'water' ? 'rgba(32,132,171,0.66)' : 'rgba(38,124,74,0.46)'
    for (const polygon of polygons) {
      ctx.beginPath()
      for (const ring of polygon) {
        ring.forEach(([lon, lat], i) => {
          const x = (lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon) * canvas.width
          const y = (BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat) * canvas.height
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        })
        ctx.closePath()
      }
      ctx.fill('evenodd')
    }
  }
  const geometry = terrain.geometry.clone()
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < positions.count; i++) positions.setZ(i, positions.getZ(i) + 0.08)
  const material = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, side: THREE.DoubleSide })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'landcover'
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = 1
  scene.add(mesh)
}

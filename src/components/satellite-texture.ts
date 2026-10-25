import * as THREE from "three"
import { BOUNDS } from "../utils/geo"

const TIANDITU_KEY = "fd24393715ec5f392e2356018732ab9d"
const TILE_SIZE = 256

function lonLatToMercatorPixel(lon: number, lat: number, zoom: number) {
  const n = Math.pow(2, zoom) * TILE_SIZE
  const x = ((lon + 180) / 360) * n
  const latRad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  return { x, y }
}

function loadTile(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * 卫星纹理生成（紧凑市域高清方案）：
 * 1. 使用与 BOUNDS 严格对齐的苏州市域裁剪框，zoom=11（约121个瓦片，多子域并发加载，清晰度提升4x）
 * 2. 将所有瓦片绘制到 Mercator canvas 并按纬度重采样至地形 UV
 */
export async function generateSatelliteTexture(
  _bounds?: { minLat: number; maxLat: number; minLon: number; maxLon: number }
): Promise<THREE.Texture | null> {
  const minLon = BOUNDS.minLon
  const maxLon = BOUNDS.maxLon
  const minLat = BOUNDS.minLat
  const maxLat = BOUNDS.maxLat
  const zoom = 11

  // Mercator 像素范围
  const mercTL = lonLatToMercatorPixel(minLon, maxLat, zoom)
  const mercBR = lonLatToMercatorPixel(maxLon, minLat, zoom)

  const startTileX = Math.floor(mercTL.x / TILE_SIZE)
  const startTileY = Math.floor(mercTL.y / TILE_SIZE)
  const endTileX = Math.floor(mercBR.x / TILE_SIZE)
  const endTileY = Math.floor(mercBR.y / TILE_SIZE)

  // 步骤1：将所有瓦片绘制到大 canvas（Mercator 投影）
  const gridW = (endTileX - startTileX + 1) * TILE_SIZE
  const gridH = (endTileY - startTileY + 1) * TILE_SIZE
  const mercCanvas = document.createElement("canvas")
  mercCanvas.width = gridW
  mercCanvas.height = gridH
  const mercCtx = mercCanvas.getContext("2d")!
  mercCtx.fillStyle = "#1a2a3a"
  mercCtx.fillRect(0, 0, gridW, gridH)

  let loaded = 0
  const tilePromises: Promise<void>[] = []

  for (let tx = startTileX; tx <= endTileX; tx++) {
    for (let ty = startTileY; ty <= endTileY; ty++) {
      const sub = (tx + ty) & 7
      const url = `https://t${sub}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL=${tx}&TILEROW=${ty}&TILEMATRIX=${zoom}&tk=${TIANDITU_KEY}`
      const dx = (tx - startTileX) * TILE_SIZE
      const dy = (ty - startTileY) * TILE_SIZE

      tilePromises.push(
        loadTile(url).then(img => {
          mercCtx.drawImage(img, dx, dy)
          loaded++
        }).catch(() => {})
      )
    }
  }

  await Promise.all(tilePromises)
  console.log(`[Satellite] 加载了 ${loaded} 个瓦片 (zoom=${zoom})`)
  if (loaded === 0) {
    console.warn("[Satellite] 瓦片未加载成功，保留高程设色地形")
    return null
  }

  // 步骤2：从 Mercator canvas 裁剪到地形精确范围
  const cropX = mercTL.x - startTileX * TILE_SIZE
  const cropW = mercBR.x - mercTL.x
  const cropH = mercBR.y - mercTL.y

  const canvasW = 1024
  const canvasH = 1024
  const canvas = document.createElement("canvas")
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#1a2a3a"
  ctx.fillRect(0, 0, canvasW, canvasH)

  // 逐行重采样：每行对应一个 lat，从 Mercator canvas 读取该 lat 对应的 Y 像素行
  for (let py = 0; py < canvasH; py++) {
    const lat = maxLat - (py / canvasH) * (maxLat - minLat)
    const merc = lonLatToMercatorPixel(minLon, lat, zoom)
    const srcY = merc.y - startTileY * TILE_SIZE
    const srcH = Math.max(1, cropH / canvasH)

    ctx.drawImage(
      mercCanvas,
      cropX, srcY, cropW, Math.max(srcH, 1),
      0, py, canvasW, 1
    )
  }

  console.log(`[Satellite] 重采样完成 (${canvasW}x${canvasH})`)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

export function applySatelliteTexture(terrainMesh: THREE.Mesh, texture: THREE.Texture) {
  const material = terrainMesh.material as THREE.MeshPhongMaterial
  if (material) {
    material.map = texture
    material.vertexColors = false
    material.needsUpdate = true
    material.emissive = new THREE.Color(0x080808)
    material.emissiveIntensity = 0.3
  }
}

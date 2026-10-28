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
  if (loaded !== tilePromises.length) {
    console.warn(`[Satellite] 瓦片不完整 (${loaded}/${tilePromises.length})，保留本地地形纹理`)
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

/** Diagnostic only: request an EPSG:4326 image for the exact terrain bounds. */
export async function generateRegistrationReferenceTexture(grid: number[][]): Promise<THREE.Texture> {
  const bbox = [BOUNDS.minLon, BOUNDS.minLat, BOUNDS.maxLon, BOUNDS.maxLat].join(",")
  const url = new URL("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export")
  url.searchParams.set("bbox", bbox)
  url.searchParams.set("bboxSR", "4326")
  url.searchParams.set("imageSR", "4326")
  // 1.74° : 1.48° = 87 : 74. Matching this ratio prevents ArcGIS
  // from expanding the requested bounding box to fit a square image.
  url.searchParams.set("size", "1740,1480")
  url.searchParams.set("format", "jpg")
  url.searchParams.set("f", "image")

  const source = await new THREE.TextureLoader().loadAsync(url.toString())
  const image = source.image as HTMLImageElement
  const canvas = document.createElement("canvas")
  canvas.width = 1740
  canvas.height = 1740
  const context = canvas.getContext("2d", { willReadFrequently: true })!
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = pixels.data
  const last = grid.length - 1

  const sample = (x: number, y: number): number => {
    const gx = Math.max(0, Math.min(last, x))
    const gy = Math.max(0, Math.min(last, y))
    const x0 = Math.floor(gx), y0 = Math.floor(gy)
    const x1 = Math.min(last, x0 + 1), y1 = Math.min(last, y0 + 1)
    const tx = gx - x0, ty = gy - y0
    const top = grid[y0][x0] * (1 - tx) + grid[y0][x1] * tx
    const bottom = grid[y1][x0] * (1 - tx) + grid[y1][x1] * tx
    return top * (1 - ty) + bottom * ty
  }

  for (let y = 0; y < canvas.height; y++) {
    const gy = y / (canvas.height - 1) * last
    for (let x = 0; x < canvas.width; x++) {
      const gx = x / (canvas.width - 1) * last
      const left = sample(gx - 1.5, gy)
      const right = sample(gx + 1.5, gy)
      const above = sample(gx, gy - 1.5)
      const below = sample(gx, gy + 1.5)
      const shade = Math.max(0.7, Math.min(1.18, 0.98 + (left - right) * 0.004 + (above - below) * 0.006))
      const offset = (y * canvas.width + x) * 4
      for (let channel = 0; channel < 3; channel++) {
        data[offset + channel] = Math.max(0, Math.min(255, data[offset + channel] * shade))
      }
    }
  }
  context.putImageData(pixels, 0, 0)
  source.dispose()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

export function applySatelliteTexture(terrainMesh: THREE.Mesh, texture: THREE.Texture) {
  const material = terrainMesh.material as THREE.MeshBasicMaterial | THREE.MeshPhongMaterial
  if (material) {
    material.map = texture
    material.vertexColors = false
    material.needsUpdate = true
    if (material instanceof THREE.MeshPhongMaterial) {
      material.emissive = new THREE.Color(0x080808)
      material.emissiveIntensity = 0.3
    }
  }
}

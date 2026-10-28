import * as THREE from "three"
import { BOUNDS } from "../utils/geo"

type Rgb = readonly [number, number, number]

// Visual styling only: colours and fine grain do not represent land cover.
const ELEVATION_STOPS: ReadonlyArray<readonly [number, Rgb]> = [
  [0, [24, 50, 42]],
  [6, [34, 66, 50]],
  [15, [54, 94, 66]],
  [35, [83, 119, 84]],
  [90, [123, 139, 103]],
  [220, [170, 158, 111]],
  [500, [207, 190, 150]],
  [800, [226, 215, 191]],
]

function colourAtElevation(height: number): Rgb {
  for (let i = 1; i < ELEVATION_STOPS.length; i++) {
    const [upperHeight, upper] = ELEVATION_STOPS[i]
    if (height <= upperHeight) {
      const [lowerHeight, lower] = ELEVATION_STOPS[i - 1]
      const t = Math.max(0, Math.min(1, (height - lowerHeight) / (upperHeight - lowerHeight)))
      return [
        lower[0] + (upper[0] - lower[0]) * t,
        lower[1] + (upper[1] - lower[1]) * t,
        lower[2] + (upper[2] - lower[2]) * t,
      ]
    }
  }
  return ELEVATION_STOPS[ELEVATION_STOPS.length - 1][1]
}

function noise(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value) - 0.5
}

type Geometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] }

async function cityMask(size: number): Promise<Uint8ClampedArray | null> {
  try {
    const response = await fetch("/suzhou_districts.geojson")
    if (!response.ok) return null
    const data = await response.json() as { features: Array<{ geometry: Geometry }> }
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext("2d")!
    context.fillStyle = "#ffffff"
    for (const feature of data.features) {
      const geometry = feature.geometry
      const polygons = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates]
      for (const polygon of polygons) {
        const ring = polygon[0]
        if (!ring?.length) continue
        context.beginPath()
        ring.forEach(([lon, lat], index) => {
          const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * size
          const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * size
          if (index === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        })
        context.closePath()
        context.fill()
      }
    }
    return context.getImageData(0, 0, size, size).data
  } catch {
    return null
  }
}

/** A stable offline cartographic texture derived from the project's Suzhou DEM. */
export async function createTerrainAtlasTexture(grid: number[][], clipToCity = true): Promise<THREE.CanvasTexture> {
  const size = 1024
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d", { willReadFrequently: false })!
  const image = context.createImageData(size, size)
  const pixels = image.data
  const last = grid.length - 1
  const mask = clipToCity ? await cityMask(size) : null

  const sample = (x: number, y: number): number => {
    const gx = Math.max(0, Math.min(last, x))
    const gy = Math.max(0, Math.min(last, y))
    const x0 = Math.floor(gx)
    const y0 = Math.floor(gy)
    const x1 = Math.min(last, x0 + 1)
    const y1 = Math.min(last, y0 + 1)
    const tx = gx - x0
    const ty = gy - y0
    const top = grid[y0][x0] * (1 - tx) + grid[y0][x1] * tx
    const bottom = grid[y1][x0] * (1 - tx) + grid[y1][x1] * tx
    return top * (1 - ty) + bottom * ty
  }

  for (let y = 0; y < size; y++) {
    const gy = (y / (size - 1)) * last
    for (let x = 0; x < size; x++) {
      const gx = (x / (size - 1)) * last
      const elevation = sample(gx, gy)
      const left = sample(gx - 1.5, gy)
      const right = sample(gx + 1.5, gy)
      const above = sample(gx, gy - 1.5)
      const below = sample(gx, gy + 1.5)
      const slope = Math.hypot(right - left, below - above)
      const hillshade = Math.max(0.68, Math.min(1.16, 0.98 + (left - right) * 0.004 + (above - below) * 0.006))
      const grain = noise(x, y) * 4 + Math.sin(x * 0.06) * Math.cos(y * 0.07) * 2
      const contourDistance = Math.abs(elevation / 20 - Math.round(elevation / 20)) * 20
      const contour = elevation > 20 && slope > 1.5 && contourDistance < 0.65 ? 0.16 : 0
      const base = colourAtElevation(elevation)
      const index = (y * size + x) * 4
      for (let channel = 0; channel < 3; channel++) {
        const shaded = base[channel] * hillshade + grain
        pixels[index + channel] = Math.max(0, Math.min(255, shaded * (1 - contour) + [221, 197, 143][channel] * contour))
      }
      pixels[index + 3] = mask ? mask[index + 3] : 255
    }
  }

  context.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

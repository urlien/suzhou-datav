// 公共地理坐标转换与地形高程采样工具模块

export const BOUNDS = {
  minLat: 30,
  maxLat: 33,
  minLon: 119,
  maxLon: 122,
} as const

// 区县名称标准化映射（兼容简称、别名与全称）
const ALIAS_MAP: Record<string, string> = {
  '昆山': '昆山市',
  '昆山市': '昆山市',
  '工业园区': '苏州工业园区',
  '园区': '苏州工业园区',
  '苏州工业园区': '苏州工业园区',
  '张家港': '张家港市',
  '张家港市': '张家港市',
  '常熟': '常熟市',
  '常熟市': '常熟市',
  '吴江': '吴江区',
  '吴江区': '吴江区',
  '虎丘': '虎丘区',
  '高新区': '虎丘区',
  '虎丘区': '虎丘区',
  '太仓': '太仓市',
  '太仓市': '太仓市',
  '吴中': '吴中区',
  '吴中区': '吴中区',
  '相城': '相城区',
  '相城区': '相城区',
  '姑苏': '姑苏区',
  '姑苏区': '姑苏区',
}

export function normalizeDistrictName(name: string): string {
  const trimmed = name.trim()
  return ALIAS_MAP[trimmed] || trimmed
}

// 苏州 10 个区县（含工业园区）标准中心坐标
export const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  '昆山市': { lat: 31.39, lon: 120.98 },
  '苏州工业园区': { lat: 31.32, lon: 120.72 },
  '工业园区': { lat: 31.32, lon: 120.72 },
  '张家港市': { lat: 31.87, lon: 120.55 },
  '常熟市': { lat: 31.65, lon: 120.74 },
  '吴江区': { lat: 31.16, lon: 120.65 },
  '虎丘区': { lat: 31.30, lon: 120.57 },
  '太仓市': { lat: 31.45, lon: 121.10 },
  '吴中区': { lat: 31.26, lon: 120.62 },
  '相城区': { lat: 31.37, lon: 120.62 },
  '姑苏区': { lat: 31.30, lon: 120.63 },
}

export const CANONICAL_DISTRICTS = [
  '昆山市',
  '苏州工业园区',
  '张家港市',
  '常熟市',
  '吴江区',
  '吴中区',
  '虎丘区',
  '太仓市',
  '相城区',
  '姑苏区',
] as const

export function getDistrictCoords(name: string): { lat: number; lon: number } | undefined {
  return DISTRICT_COORDS[normalizeDistrictName(name)] || DISTRICT_COORDS[name]
}

/**
 * 将 (纬度 lat, 经度 lon) 转换为 3D 场景平面坐标 (x, z)
 * 场景平面范围：x ∈ [-100, 100], z ∈ [-100, 100]
 */
export function geoTo3D(lat: number, lon: number): { x: number; z: number } {
  const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * 200 - 100
  const z = 100 - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 200
  return { x, z }
}

/**
 * 将 GeoJSON 标准顺序 (经度 lon, 纬度 lat) 转换为 3D 场景平面坐标 (x, z)
 */
export function lonLatTo3D(lon: number, lat: number): { x: number; z: number } {
  return geoTo3D(lat, lon)
}

// 地形高程采样缓存（由 scene.ts 初始化）
let cachedGrid: number[][] | null = null
let cachedGridSize = 0
let cachedMaxElev = 1

export function setTerrainHeightGrid(grid: number[][], maxElev: number) {
  cachedGrid = grid
  cachedGridSize = grid.length
  cachedMaxElev = maxElev || 1
}

/**
 * 查询场景坐标 (x, z) 对应的地形表面 Y 高度
 */
export function getTerrainHeightAtXZ(x: number, z: number): number {
  if (!cachedGrid || cachedGridSize === 0) return 0.15
  const gx = Math.floor(((x + 100) / 200) * (cachedGridSize - 1))
  const gy = Math.floor(((z + 100) / 200) * (cachedGridSize - 1))
  if (gx < 0 || gx >= cachedGridSize || gy < 0 || gy >= cachedGridSize) return 0.15
  return (cachedGrid[gy][gx] / cachedMaxElev) * 6
}

export function getTerrainHeightAtGeo(lat: number, lon: number): number {
  const { x, z } = geoTo3D(lat, lon)
  return getTerrainHeightAtXZ(x, z)
}

import * as THREE from 'three'

async function loadRoadTexture(): Promise<THREE.CanvasTexture> {
  const edges = [0, 1365, 2730, 4096]
  const tiles = await Promise.all(Array.from({ length: 9 }, (_, index) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const col = index % 3
    const row = Math.floor(index / 3)
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Road tile ${col}-${row} failed`))
    image.src = `/road-night/road-${col}-${row}.png`
  })))
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 4096
  const context = canvas.getContext('2d')!
  tiles.forEach((tile, index) => context.drawImage(tile, edges[index % 3], edges[Math.floor(index / 3)]))
  return new THREE.CanvasTexture(canvas)
}

/** Draped OSM road texture with an illustrative night treatment. */
export async function addRoadNight(scene: THREE.Scene): Promise<void> {
  const terrain = scene.getObjectByName('terrain') as THREE.Mesh | undefined
  if (!terrain) return

  // Load the derived texture first so a failed request never leaves a dark map.
  const texture = await loadRoadTexture()
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  const group = new THREE.Group()
  group.name = 'road-night-group'

  const shadeGeometry = terrain.geometry.clone()
  const shadePositions = shadeGeometry.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < shadePositions.count; i++) shadePositions.setZ(i, shadePositions.getZ(i) + 0.04)
  const shade = new THREE.Mesh(shadeGeometry, new THREE.MeshBasicMaterial({
    color: 0x06111e,
    opacity: 0.64,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }))
  shade.rotation.x = -Math.PI / 2
  shade.renderOrder = 1
  group.add(shade)

  const roadGeometry = terrain.geometry.clone()
  const roadPositions = roadGeometry.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < roadPositions.count; i++) roadPositions.setZ(i, roadPositions.getZ(i) + 0.16)
  const roads = new THREE.Mesh(roadGeometry, new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }))
  roads.rotation.x = -Math.PI / 2
  roads.renderOrder = 3
  group.add(roads)

  scene.add(group)
  setRoadNightVisible(scene, true)
}

export function setRoadNightVisible(scene: THREE.Scene, requested: boolean): boolean {
  const group = scene.getObjectByName('road-night-group')
  const visible = requested && scene.getObjectByName('terrain')?.visible !== false
  if (group) group.visible = visible
  const landcover = scene.getObjectByName('landcover') as THREE.Mesh | undefined
  const material = landcover?.material as THREE.MeshBasicMaterial | undefined
  if (material) material.color.set(visible ? 0x527e94 : 0xffffff)
  return Boolean(group && visible)
}

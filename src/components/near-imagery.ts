import * as THREE from 'three'
import { BOUNDS, getTerrainHeightAtXZ } from '../utils/geo'

/** Local inspection detail patch. Uses the same geographic frame as the terrain. */
export function createNearImagery(scene: THREE.Scene) {
  const half = 18
  let patch: THREE.Mesh | null = null
  let centerX = Infinity, centerZ = Infinity
  let pending = false, lastAttempt = 0

  return (target: THREE.Vector3, distance: number, now: number) => {
    const terrainVisible = scene.getObjectByName('terrain')?.visible !== false
    if (patch) patch.visible = distance < 115 && terrainVisible
    if (!terrainVisible || distance >= 105 || pending || now - lastAttempt < 3000) return
    const x = Math.max(-100 + half, Math.min(100 - half, Math.round(target.x / 4) * 4))
    const z = Math.max(-100 + half, Math.min(100 - half, Math.round(target.z / 4) * 4))
    if (Math.hypot(x - centerX, z - centerZ) < 8) return
    lastAttempt = now
    pending = true
    const lon = (v: number) => BOUNDS.minLon + (v + 100) / 200 * (BOUNDS.maxLon - BOUNDS.minLon)
    const lat = (v: number) => BOUNDS.maxLat - (v + 100) / 200 * (BOUNDS.maxLat - BOUNDS.minLat)
    const url = new URL('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export')
    url.searchParams.set('bbox', [lon(x - half), lat(z + half), lon(x + half), lat(z - half)].join(','))
    url.searchParams.set('bboxSR', '4326')
    url.searchParams.set('imageSR', '4326')
    url.searchParams.set('size', '1740,1480')
    url.searchParams.set('format', 'jpg')
    url.searchParams.set('f', 'image')
    new THREE.TextureLoader().loadAsync(url.toString()).then(source => {
      const canvas = document.createElement('canvas')
      canvas.width = 1740; canvas.height = 1480
      const context = canvas.getContext('2d')!
      context.drawImage(source.image as HTMLImageElement, 0, 0, canvas.width, canvas.height)
      context.globalCompositeOperation = 'destination-in'
      for (const [x0, y0, x1, y1] of [[0, 0, canvas.width, 0], [0, 0, 0, canvas.height]]) {
        const gradient = context.createLinearGradient(x0, y0, x1, y1)
        gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(0.12, 'rgba(0,0,0,1)')
        gradient.addColorStop(0.88, 'rgba(0,0,0,1)'); gradient.addColorStop(1, 'rgba(0,0,0,0)')
        context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height)
      }
      source.dispose()
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 8
      const geometry = new THREE.PlaneGeometry(half * 2, half * 2, 100, 100)
      const positions = geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < positions.count; i++) {
        positions.setZ(i, getTerrainHeightAtXZ(x + positions.getX(i), z - positions.getY(i)) + 0.04)
      }
      geometry.computeVertexNormals()
      const material = new THREE.MeshPhongMaterial({ map: texture, color: 0xd5d5d5, shininess: 4, specular: 0x101010, side: THREE.DoubleSide, transparent: true, depthWrite: false })
      const next = new THREE.Mesh(geometry, material)
      next.rotation.x = -Math.PI / 2
      next.position.set(x, 0, z)
      next.name = 'near-imagery'
      scene.add(next)
      if (patch) {
        scene.remove(patch)
        patch.geometry.dispose()
        const old = patch.material as THREE.MeshPhongMaterial
        old.map?.dispose()
        old.dispose()
      }
      patch = next
      centerX = x
      centerZ = z
    }).catch(() => {
      console.warn('[Near imagery] 近景影像未加载，保留全域影像')
    }).finally(() => { pending = false })
  }
}

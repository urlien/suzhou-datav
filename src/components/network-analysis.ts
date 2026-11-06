import * as THREE from 'three'
import { flyCameraTo, resetCameraView, wasCanvasDragged } from '../scene'
import { BOUNDS, geoTo3D, getDistrictCoords, getTerrainHeightAtXZ } from '../utils/geo'

type Coordinate = [number, number]
type Drive = { name: string; destination: string; minutes: number; km: number; queriedAt: string }
type Facility = { name: string; category: string; coordinates: Coordinate; minutes: number }
type Walk = { segments: {coordinates: Coordinate[]}[]; facilities: Facility[]; fetchedAt?: string }
const station: Coordinate = [120.6065, 31.3284]
const motion = matchMedia('(prefers-reduced-motion: reduce)')

async function readJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {signal})
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || '查询失败')
  return result
}

function point([lon, lat]: Coordinate, lift = .65) {
  const {x, z} = geoTo3D(lat, lon)
  return new THREE.Vector3(x, getTerrainHeightAtXZ(x, z) + lift, z)
}

function clear(group: THREE.Group) {
  for (const child of [...group.children]) {
    if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
      child.geometry.dispose()
      child.material.dispose()
    }
    group.remove(child)
  }
}

export function initNetworkAnalysis(scene: THREE.Scene) {
  const container = document.getElementById('canvas-container')
  const canvas = container?.querySelector('canvas')
  const camera = scene.children.find((object): object is THREE.Camera => object instanceof THREE.Camera)
  if (!container || !canvas || !camera) return

  const drive = new THREE.Group()
  const walk = new THREE.Group()
  scene.add(drive, walk)
  const tools = document.createElement('div')
  tools.className = 'explore-map'
  tools.innerHTML = `
    <div class="explore-switch" role="group" aria-label="地图专题">
      <button type="button" data-mode="drive" aria-pressed="true">驾车联系</button>
      <button type="button" data-mode="walk" aria-pressed="false">步行生活圈</button>
    </div>
    <div class="explore-card" data-drive>
      <strong>从苏州站出发</strong>
      <p data-drive-status role="status">正在读取驾车耗时…</p>
      <div data-drive-result hidden></div>
    </div>
    <div class="explore-card" data-walk hidden>
      <strong>步行能到哪些设施？</strong>
      <p>点地图换起点，默认从苏州站附近出发。</p>
      <div class="explore-options">
        <select aria-label="设施类别"><option value="health">医疗</option><option value="education">教育</option></select>
        <select aria-label="步行时间"><option value="5">5 分钟</option><option value="10">10 分钟</option><option value="15" selected>15 分钟</option></select>
      </div>
      <p data-walk-status role="status"></p>
      <ul data-facilities></ul>
      <small>OpenStreetMap · 设施按就近路网估算</small>
    </div>`
  container.append(tools)
  const driveCard = tools.querySelector<HTMLElement>('[data-drive]')!
  const walkCard = tools.querySelector<HTMLElement>('[data-walk]')!
  const driveStatus = tools.querySelector<HTMLElement>('[data-drive-status]')!
  const driveResult = tools.querySelector<HTMLElement>('[data-drive-result]')!
  const walkStatus = tools.querySelector<HTMLElement>('[data-walk-status]')!
  const facilities = tools.querySelector<HTMLElement>('[data-facilities]')!
  const category = walkCard.querySelector<HTMLSelectElement>('select[aria-label="设施类别"]')!
  const minutes = walkCard.querySelector<HTMLSelectElement>('select[aria-label="步行时间"]')!
  let mode: 'drive' | 'walk' | null = 'drive'
  let origin = station
  let walking: Walk | undefined
  let stationWalk: Record<string, Walk> | undefined
  let walkingRequest: AbortController | undefined
  let routeRequest: AbortController | undefined
  const ray = new THREE.Raycaster()
  const endpoints = new Map<THREE.Object3D, Drive>()

  function arrive(element: HTMLElement) {
    if (!motion.matches) element.animate([{opacity:.55, transform:'translateY(5px)'}, {opacity:1, transform:'none'}], {duration:220,easing:'cubic-bezier(.2,.8,.2,1)'})
  }

  function mark(group: THREE.Group, where: Coordinate, color: number, size: number) {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 8), new THREE.MeshBasicMaterial({color}))
    marker.position.copy(point(where, size + .45))
    group.add(marker)
    return marker
  }

  function renderWalk() {
    clear(walk)
    mark(walk, origin, 0xffda8a, .45)
    facilities.replaceChildren()
    if (!walking) return
    const coordinates = walking.segments.flatMap(segment => segment.coordinates.map(value => point(value)))
    if (coordinates.length) walk.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(coordinates),
      new THREE.LineBasicMaterial({color:0x51ddbe, transparent:true, opacity:.85}),
    ))
    const matches = walking.facilities.filter(place => place.category === category.value)
    walkStatus.textContent = matches.length ? `约 ${minutes.value} 分钟内 · ${matches.length} 处已标注设施` : '这个范围内暂无匹配的已标注设施。'
    for (const place of matches) {
      mark(walk, place.coordinates, 0xffd074, .27)
      const item = document.createElement('li')
      item.textContent = `${place.name} · 约 ${place.minutes} 分钟`
      facilities.append(item)
    }
    if (origin === station && walking.fetchedAt) walkStatus.textContent += ' · 示例'
    arrive(walkStatus)
  }

  async function loadWalk() {
    walkingRequest?.abort()
    const request = new AbortController()
    walkingRequest = request
    walking = undefined
    renderWalk()
    walkStatus.textContent = '正在计算步行范围…'
    try {
      const query = new URLSearchParams({lon:String(origin[0]), lat:String(origin[1]), minutes:minutes.value})
      if (origin === station && !stationWalk) {
        stationWalk = await readJson<Record<string, Walk>>('/station-walk.json', request.signal)
      }
      const result = origin === station && stationWalk
        ? stationWalk[minutes.value]
        : await readJson<Walk>('/api/isochrone?' + query, request.signal)
      if (request.signal.aborted) return
      walking = result
      renderWalk()
    } catch {
      if (!request.signal.aborted) walkStatus.textContent = '暂时无法读取步行路网，点地图重试。'
    }
  }

  function setMode(next: typeof mode) {
    if (mode === 'walk' && next !== 'walk') resetCameraView()
    mode = next
    drive.visible = next === 'drive'
    walk.visible = next === 'walk'
    driveCard.hidden = !drive.visible
    walkCard.hidden = !walk.visible
    canvas?.classList.toggle('is-picking-origin', walk.visible)
    for (const button of tools.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === next))
    }
    if (next === 'walk') {
      if (walking) renderWalk()
      else if (!walkingRequest || walkingRequest.signal.aborted) void loadWalk()
      const center = point(origin)
      flyCameraTo(center.x, center.z, 30)
      arrive(walkCard)
    } else {
      walkingRequest?.abort()
      if (next === 'drive') arrive(driveCard)
    }
  }

  async function selectRoute(row: Drive) {
    routeRequest?.abort()
    const request = new AbortController()
    routeRequest = request
    driveResult.hidden = false
    driveResult.replaceChildren()
    const headline = document.createElement('strong')
    headline.textContent = `${row.name} · 约 ${row.minutes} 分钟`
    const caption = document.createElement('p')
    caption.textContent = '正在读取道路路线…'
    driveResult.append(headline, caption)
    arrive(driveResult)
    try {
      const query = new URLSearchParams({origin:'苏州站', destination:row.destination})
      const result = await readJson<{distance:string; duration:string; steps:{polyline:string}[]}>('/api/route?' + query, request.signal)
      if (request.signal.aborted) return
      caption.textContent = `当前估算 ${Math.round(Number(result.duration)/60)} 分钟 · ${(Number(result.distance)/1000).toFixed(1)} 公里 · 高德`
      const points = result.steps.flatMap(step => (step.polyline || '').split(';').map(pair => pair.split(',').map(Number)))
        .filter(pair => pair.length === 2 && pair.every(Number.isFinite))
      if (points.length < 2) return
      const x0 = Math.min(...points.map(pair => pair[0])), y0 = Math.min(...points.map(pair => pair[1]))
      const width = Math.max(...points.map(pair => pair[0])) - x0
      const height = Math.max(...points.map(pair => pair[1])) - y0
      const scale = Math.min(232 / Math.max(.854 * width, .00001), 85 / Math.max(height, .00001))
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '0 0 248 101')
      svg.setAttribute('role', 'img')
      svg.setAttribute('aria-label', '高德驾车路线形状')
      const path = document.createElementNS(svg.namespaceURI, 'polyline')
      path.setAttribute('points', points.map(([x,y]) => `${8+(x-x0)*.854*scale},${93-(y-y0)*scale}`).join(' '))
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', '#f9c782')
      path.setAttribute('stroke-width', '2')
      svg.append(path)
      driveResult.append(svg)
    } catch {
      if (!request.signal.aborted) caption.textContent = `快照 ${row.km} 公里 · 当前道路路线暂不可用`
    }
  }

  async function loadDrive() {
    try {
      const rows = await readJson<Drive[]>('/station-drive.json')
      const date = rows[0]?.queriedAt.slice(0,10)
      driveStatus.textContent = `点飞线终点查看路线 · 高德 ${date ?? ''} 快照`
      mark(drive, station, 0xffe1a3, .78)
      for (const row of rows) {
        const destination = getDistrictCoords(row.name)
        if (!destination) continue
        const where: Coordinate = [destination.lon, destination.lat]
        const start = point(station, 1.1)
        const end = point(where, 1.1)
        const control = start.clone().lerp(end,.5)
        control.y += Math.max(3, start.distanceTo(end)*.21)
        const tint = row.minutes < 30 ? 0x6be4cc : row.minutes < 60 ? 0xf5d486 : 0xffa184
        const vertices = new THREE.QuadraticBezierCurve3(start, control, end).getPoints(32)
        const geometry = new THREE.BufferGeometry().setFromPoints(vertices)
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color:tint,transparent:true,opacity:.85}))
        drive.add(line)
        if (!motion.matches) {
          const started = performance.now()
          const reveal = (now: number) => {
            const ratio = Math.min(1,(now-started)/650)
            geometry.setDrawRange(0, Math.ceil(33*ratio))
            if (ratio < 1) requestAnimationFrame(reveal)
          }
          geometry.setDrawRange(0,0)
          requestAnimationFrame(reveal)
        }
        endpoints.set(mark(drive, where, tint, .74), row)
        endpoints.set(line, row)
      }
      const choices = document.createElement('select')
      choices.setAttribute('aria-label','查看目的地路线')
      choices.append(new Option('选择目的地查看路线',''))
      for (const row of rows) choices.append(new Option(`${row.name} · ${row.minutes} 分钟`,row.name))
      choices.addEventListener('change', () => {
        const row = rows.find(item => item.name === choices.value)
        if (row) void selectRoute(row)
      })
      const key = document.createElement('small')
      key.textContent = '青色 <30 分 · 金色 30–59 分 · 橙色 ≥60 分'
      driveStatus.after(choices,key)
    } catch {
      driveStatus.textContent = '驾车耗时快照暂不可用。'
    }
  }

  tools.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.mode as 'drive' | 'walk'
    setMode(mode === next ? null : next)
  }))
  minutes.addEventListener('change', () => void loadWalk())
  category.addEventListener('change', renderWalk)
  canvas.addEventListener('click', event => {
    if (!mode || wasCanvasDragged()) return
    const bounds = canvas.getBoundingClientRect()
    ray.setFromCamera(new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1, 1-(event.clientY-bounds.top)/bounds.height*2),camera)
    if (mode === 'drive') {
      ray.params.Line = {threshold:.7}
      const selected = ray.intersectObjects([...endpoints.keys()])[0]
      const row = selected && endpoints.get(selected.object)
      if (row) {
        event.stopImmediatePropagation()
        void selectRoute(row)
      }
      return
    }
    event.stopImmediatePropagation()
    const terrain = scene.getObjectByName('terrain')
    const hit = terrain?.visible && ray.intersectObject(terrain)[0]
    if (!hit) {
      walkStatus.textContent = '请开启地形并点击苏州市域地图。'
      return
    }
    origin = [
      BOUNDS.minLon + (hit.point.x + 100) / 200 * (BOUNDS.maxLon - BOUNDS.minLon),
      BOUNDS.minLat + (100 - hit.point.z) / 200 * (BOUNDS.maxLat - BOUNDS.minLat),
    ]
    void loadWalk()
  }, true)
  void loadDrive()
}

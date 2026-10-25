import * as THREE from "three"
import { areaData, gdpData, gdpHistoryData, populationData } from "../data/official-stats"
import { CANONICAL_DISTRICTS, geoTo3D, getDistrictCoords, getTerrainHeightAtXZ, normalizeDistrictName } from "../utils/geo"
import { registerFrameCallback } from "../scene"
import { filterState } from "./filter"

let heatmapVisible = true

const heatmapVertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform float uIntensity;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    float dist = length(uv - vec2(0.5));
    float bump = exp(-dist * dist * 8.0) * uIntensity * 2.0;
    
    float pulse = 1.0 + sin(uTime * 1.5) * 0.05;
    bump *= pulse;
    
    pos.z += bump;
    vHeight = bump;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const heatmapFragmentShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  uniform float uOpacity;
  uniform float uIntensity;

  void main() {
    float dist = length(vUv - vec2(0.5));
    float alpha = exp(-dist * dist * 6.0) * uOpacity;
    
    float t = clamp(vHeight / 2.0 + uIntensity * 0.4, 0.0, 1.0);
    vec3 color;
    if (t < 0.25) {
      color = mix(vec3(0.0, 0.2, 0.8), vec3(0.0, 0.8, 1.0), t * 4.0);
    } else if (t < 0.5) {
      color = mix(vec3(0.0, 0.8, 1.0), vec3(0.0, 1.0, 0.4), (t - 0.25) * 4.0);
    } else if (t < 0.75) {
      color = mix(vec3(0.0, 1.0, 0.4), vec3(1.0, 0.9, 0.0), (t - 0.5) * 4.0);
    } else {
      color = mix(vec3(1.0, 0.9, 0.0), vec3(1.0, 0.2, 0.0), (t - 0.75) * 4.0);
    }
    
    if (dist > 0.48) {
      alpha *= (0.5 - dist) / 0.02;
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`

interface DistrictHeatNodes {
  groundY: number
  shaderMat: THREE.ShaderMaterial
  pillar: THREE.Mesh
  pillarMat: THREE.MeshBasicMaterial
  ringMat: THREE.MeshBasicMaterial
}

const metricTitles: Record<string, string> = {
  gdp: "GDP总量热力",
  population: "常住人口热力",
  area: "行政面积热力",
  gdpPerCapita: "人均GDP热力",
  density: "人口密度热力",
}

function getMetricValue(name: string, metricKey: string): number {
  const pop = populationData[name] || 0
  const area = areaData[name] || 1
  const gdp = gdpData[name] || 0
  switch (metricKey) {
    case "gdp":
      return gdp
    case "population":
      return pop
    case "area":
      return area
    case "gdpPerCapita":
      return pop > 0 ? gdp / pop : 0
    case "density":
    default:
      return pop / area
  }
}

export function addHeatmap(scene: THREE.Scene) {
  const group = new THREE.Group()
  group.name = "heatmap-group"

  const nodeMap = new Map<string, DistrictHeatNodes>()

  const densities: { name: string; density: number }[] = []
  for (const name of CANONICAL_DISTRICTS) {
    const pop = populationData[name] || 0
    const area = areaData[name] || 1
    densities.push({ name, density: pop / area })
  }
  const maxDensity = Math.max(...densities.map(d => d.density))

  for (const { name, density } of densities) {
    const coords = getDistrictCoords(name)
    if (!coords) continue

    const { x, z } = geoTo3D(coords.lat, coords.lon)
    const groundY = getTerrainHeightAtXZ(x, z)
    const intensity = density / maxDensity
    const radius = 5 + intensity * 8

    const material = new THREE.ShaderMaterial({
      vertexShader: heatmapVertexShader,
      fragmentShader: heatmapFragmentShader,
      uniforms: {
        uIntensity: { value: intensity },
        uTime: { value: 0 },
        uColorLow: { value: new THREE.Color(0.0, 0.1, 0.3) },
        uColorHigh: { value: new THREE.Color(1.0, 0.3, 0.1) },
        uOpacity: { value: 0.45 + intensity * 0.35 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })

    const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2, 32, 32)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(x, groundY + 0.48, z)
    mesh.userData = { districtName: name, type: "heatmap" }
    group.add(mesh)

    // 垂直数据柱（基准高度设为 1，通过 scale.y 动态驱动高度变化）
    const pillarHeight = 3.5 + intensity * 9
    const pillarGeo = new THREE.CylinderGeometry(0.28, 0.28, 1, 14)
    const pillarMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.55 - intensity * 0.5, 0.95, 0.55),
      transparent: true,
      opacity: 0.82,
    })
    const pillar = new THREE.Mesh(pillarGeo, pillarMat)
    pillar.scale.set(1, pillarHeight, 1)
    pillar.position.set(x, groundY + pillarHeight / 2 + 0.4, z)
    pillar.userData = { districtName: name, type: "heatmap" }
    group.add(pillar)

    // 底部光环
    const ringGeo = new THREE.RingGeometry(radius * 0.28, radius * 0.34, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.5 - intensity * 0.4, 0.9, 0.5),
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, groundY + 0.46, z)
    ring.userData = { districtName: name, type: "heatmap" }
    group.add(ring)

    nodeMap.set(name, {
      groundY,
      shaderMat: material,
      pillar,
      pillarMat,
      ringMat,
    })
  }

  scene.add(group)

  function applyIntensities(intensityByDistrict: Record<string, number>, legendLabel?: string) {
    for (const [name, node] of nodeMap.entries()) {
      const intensity = Math.max(0.08, Math.min(1, intensityByDistrict[name] ?? 0.2))
      const pillarHeight = 3.2 + intensity * 10.5
      node.pillar.scale.set(1, pillarHeight, 1)
      node.pillar.position.y = node.groundY + pillarHeight / 2 + 0.4
      node.pillarMat.color.setHSL(0.55 - intensity * 0.5, 0.95, 0.55)
      node.ringMat.color.setHSL(0.5 - intensity * 0.4, 0.9, 0.5)
      node.shaderMat.uniforms.uIntensity.value = intensity
      node.shaderMat.uniforms.uOpacity.value = 0.42 + intensity * 0.38
    }

    if (legendLabel) {
      const legendTitleEl = document.querySelector("#legend .legend-title")
      if (legendTitleEl) legendTitleEl.textContent = legendLabel
    }
  }

  // 响应区县与关注指标筛选事件
  document.addEventListener("filter-changed", () => {
    const selectedSet = new Set(filterState.selectedDistricts.map(normalizeDistrictName))
    group.children.forEach(child => {
      const dName = child.userData?.districtName
      if (dName) {
        child.visible = selectedSet.has(normalizeDistrictName(dName))
      }
    })

    const primaryMetric = filterState.selectedIndicators[0] || "density"
    const values = CANONICAL_DISTRICTS.map(name => ({
      name,
      val: getMetricValue(name, primaryMetric),
    }))
    const maxVal = Math.max(...values.map(v => v.val), 1)
    const map: Record<string, number> = {}
    for (const v of values) {
      map[v.name] = v.val / maxVal
    }
    applyIntensities(map, metricTitles[primaryMetric] || "人口密度热力")
  })

  // 响应时间轴年份演进事件（2019–2025 3D 柱体实时联动）
  document.addEventListener("timeline-year-changed", ((e: CustomEvent<{ yearIndex: number; year: number }>) => {
    const { yearIndex, year } = e.detail
    const values = CANONICAL_DISTRICTS.map(name => ({
      name,
      val: gdpHistoryData[name]?.[yearIndex] || 0,
    }))
    const maxVal = 5615 // 以 2025 年昆山峰值作为统一比例尺，直观体现历年增长
    const map: Record<string, number> = {}
    for (const v of values) {
      map[v.name] = v.val / maxVal
    }
    applyIntensities(map, `${year}年 GDP 热力`)
  }) as EventListener)

  // 注册到主渲染循环统一更新 uTime
  registerFrameCallback((time) => {
    if (!heatmapVisible) return
    group.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        if (child.material.uniforms.uTime) {
          child.material.uniforms.uTime.value = time
        }
      }
    })
  })
}

export function toggleHeatmap(scene: THREE.Scene): boolean {
  const group = scene.getObjectByName("heatmap-group")
  if (group) {
    heatmapVisible = !group.visible
    group.visible = heatmapVisible
  }
  return heatmapVisible
}

export function isHeatmapVisible(): boolean {
  return heatmapVisible
}

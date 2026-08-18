import * as THREE from "three"
import { areaData, populationData, gdpData } from "../data/official-stats"

// 苏州各区县坐标（基于GeoJSON中心点）
const districtCoords: Record<string, { lat: number; lon: number }> = {
  '昆山市': { lat: 31.39, lon: 120.98 },
  '苏州工业园区': { lat: 31.32, lon: 120.72 },
  '张家港市': { lat: 31.87, lon: 120.55 },
  '常熟市': { lat: 31.65, lon: 120.74 },
  '吴江区': { lat: 31.16, lon: 120.65 },
  '虎丘区': { lat: 31.30, lon: 120.57 },
  '太仓市': { lat: 31.45, lon: 121.10 },
  '吴中区': { lat: 31.26, lon: 120.62 },
  '相城区': { lat: 31.37, lon: 120.62 },
  '姑苏区': { lat: 31.30, lon: 120.63 },
}

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200
  return { x, z }
}

let heatmapVisible = true

// Shader for heatmap - 扁平化，贴合地形
const heatmapVertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform float uIntensity;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // 减小隆起高度，让热力图更扁平
    float dist = length(uv - vec2(0.5));
    float bump = exp(-dist * dist * 8.0) * uIntensity * 2.0;
    
    // 轻微脉冲动画
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
    
    // 更紧凑的颜色渐变
    float t = 1.0 - smoothstep(0.0, 0.4, dist);
    t = pow(t, 1.8);
    
    vec3 color;
    if (t < 0.2) {
      color = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.4, 0.8), t * 5.0);
    } else if (t < 0.4) {
      color = mix(vec3(0.0, 0.4, 0.8), vec3(0.0, 0.8, 0.9), (t - 0.2) * 5.0);
    } else if (t < 0.6) {
      color = mix(vec3(0.0, 0.8, 0.9), vec3(0.2, 0.9, 0.4), (t - 0.4) * 5.0);
    } else if (t < 0.8) {
      color = mix(vec3(0.2, 0.9, 0.4), vec3(1.0, 0.85, 0.0), (t - 0.6) * 5.0);
    } else {
      color = mix(vec3(1.0, 0.85, 0.0), vec3(1.0, 0.3, 0.1), (t - 0.8) * 5.0);
    }
    
    // 减弱glow效果
    float glow = exp(-dist * dist * 6.0) * 0.15;
    color += glow * vec3(0.2, 0.5, 0.8);
    
    // 更柔和的alpha衰减
    float alpha = t * uOpacity * 0.7;
    alpha *= smoothstep(0.4, 0.25, dist);
    alpha *= (0.4 + uIntensity * 0.4);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export function addHeatmap(scene: THREE.Scene) {
  const group = new THREE.Group()
  group.name = "heatmap-group"
  
  // 使用人口密度（人口/面积）作为热力图强度
  const densities: { name: string; density: number }[] = []
  for (const name of Object.keys(districtCoords)) {
    const pop = populationData[name] || 0
    const area = areaData[name] || 1
    densities.push({ name, density: pop / area })
  }
  const maxDensity = Math.max(...densities.map(d => d.density))
  
  for (const { name, density } of densities) {
    const coords = districtCoords[name]
    if (!coords) continue
    
    const { x, z } = geoTo3D(coords.lat, coords.lon)
    const intensity = density / maxDensity
    // 缩小半径：从 10 + intensity * 20 改为 5 + intensity * 8
    const radius = 5 + intensity * 8
    
    // Shader-based heatmap - 更扁平
    const material = new THREE.ShaderMaterial({
      vertexShader: heatmapVertexShader,
      fragmentShader: heatmapFragmentShader,
      uniforms: {
        uIntensity: { value: intensity },
        uTime: { value: 0 },
        uColorLow: { value: new THREE.Color(0.0, 0.1, 0.3) },
        uColorHigh: { value: new THREE.Color(1.0, 0.3, 0.1) },
        uOpacity: { value: 0.4 + intensity * 0.3 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    
    const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2, 32, 32)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    // 贴近地形表面
    mesh.position.set(x, 0.15, z)
    mesh.userData = { districtName: name, type: 'heatmap' }
    group.add(mesh)
    
    // 垂直数据柱（更细更矮）
    const pillarHeight = 3 + intensity * 8
    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, pillarHeight, 8)
    const pillarMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.55 - intensity * 0.5, 0.9, 0.55),
      transparent: true,
      opacity: 0.7,
    })
    const pillar = new THREE.Mesh(pillarGeo, pillarMat)
    pillar.position.set(x, pillarHeight / 2, z)
    pillar.userData = { districtName: name, type: 'heatmap' }
    group.add(pillar)
    
    // 底部圆环（更小）
    const ringGeo = new THREE.RingGeometry(radius * 0.3, radius * 0.35, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.5 - intensity * 0.4, 0.9, 0.5),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, 0.1, z)
    ring.userData = { districtName: name, type: 'heatmap' }
    group.add(ring)
  }
  
  scene.add(group)
  
  // 动画循环
  function animateHeatmap() {
    requestAnimationFrame(animateHeatmap)
    if (!heatmapVisible) return
    const time = performance.now() * 0.001
    group.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        if (child.material.uniforms.uTime) {
          child.material.uniforms.uTime.value = time
        }
      }
    })
  }
  animateHeatmap()
}

export function toggleHeatmap(scene: THREE.Scene): boolean {
  const group = scene.getObjectByName("heatmap-group")
  if (group) {
    heatmapVisible = !heatmapVisible
    group.visible = heatmapVisible
  }
  return heatmapVisible
}

export function isHeatmapVisible(): boolean { return heatmapVisible }

import * as THREE from 'three'

// 苏州主要建筑坐标+高度数据（手动标注）
const buildings = [
  // 姑苏区 - 古建筑
  { name: '北寺塔', lat: 31.3247, lon: 120.6203, height: 76, type: 'tower', color: 0xff9f43 },
  { name: '虎丘塔', lat: 31.3253, lon: 120.5769, height: 47, type: 'tower', color: 0xff9f43 },
  { name: '瑞光塔', lat: 31.3028, lon: 120.6203, height: 43, type: 'tower', color: 0xff9f43 },
  
  // 工业园区 - 现代建筑
  { name: '苏州中心', lat: 31.3194, lon: 120.7053, height: 358, type: 'skyscraper', color: 0x00d4ff },
  { name: '东方之门', lat: 31.3194, lon: 120.7003, height: 301, type: 'skyscraper', color: 0x00d4ff },
  { name: '苏州国际金融中心', lat: 31.3250, lon: 120.7053, height: 450, type: 'skyscraper', color: 0x00d4ff },
  { name: '环球188', lat: 31.3139, lon: 120.7003, height: 188, type: 'skyscraper', color: 0x00d4ff },
  
  // 高新区
  { name: '狮山广场', lat: 31.3083, lon: 120.5847, height: 200, type: 'skyscraper', color: 0x00ff88 },
  
  // 吴中区
  { name: '太湖新城CBD', lat: 31.2583, lon: 120.6203, height: 180, type: 'skyscraper', color: 0x00ff88 },
]

const bounds = { minLat: 30, maxLat: 33, minLon: 119, maxLon: 122 }

function geoTo3D(lat: number, lon: number) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200 - 100
  const z = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 200 - 100
  return { x, z }
}

export function addBuildings(scene: THREE.Scene) {
  for (const building of buildings) {
    const { x, z } = geoTo3D(building.lat, building.lon)
    const heightScale = building.height / 50 // 缩放高度

    let geometry: THREE.BufferGeometry
    let material: THREE.Material

    if (building.type === 'tower') {
      // 古塔：细长圆柱
      geometry = new THREE.CylinderGeometry(0.3, 0.5, heightScale, 8)
      material = new THREE.MeshPhongMaterial({
        color: building.color,
        transparent: true,
        opacity: 0.9,
        emissive: building.color,
        emissiveIntensity: 0.2,
      })
    } else {
      // 现代建筑：方柱
      geometry = new THREE.BoxGeometry(1.5, heightScale, 1.5)
      material = new THREE.MeshPhongMaterial({
        color: building.color,
        transparent: true,
        opacity: 0.8,
        emissive: building.color,
        emissiveIntensity: 0.15,
      })
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, heightScale / 2 + 1, z)
    mesh.name = `building-${building.name}`
    scene.add(mesh)

    // 建筑顶部光点
    const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8)
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    })
    const light = new THREE.Mesh(lightGeometry, lightMaterial)
    light.position.set(x, heightScale + 1, z)
    light.name = `building-light-${building.name}`
    scene.add(light)
  }
}

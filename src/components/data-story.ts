import * as THREE from 'three'
import { flyCameraTo, resetCameraView } from '../scene'
import { geoTo3D, getDistrictCoords, normalizeDistrictName } from '../utils/geo'
import { highlightDistrictBoundary } from './boundary'

interface StoryStep {
  title: string
  content: string
  highlight?: string[]
  chartFocus?: string
}

const storySteps: StoryStep[] = [
  {
    title: '苏州：千年古城的现代化蝶变',
    content: '苏州，一座拥有2500年历史的文化名城，2025年GDP达到2.77万亿元，位居全国第六。常住人口1297万，城镇化率超过75%。这座城市的魅力在于，它既保留了古典园林的精致，又拥有现代都市的活力。',
    highlight: ['姑苏区'],
    chartFocus: 'population',
  },
  {
    title: '房价梯度：从3万到8千的城市断面',
    content: '苏州房价呈现明显的圈层分化。工业园区以30279元/㎡领跑全市，是张家港8764元/㎡的3.5倍。核心区（工业园区、姑苏区）均价2.5-3.5万元/㎡，新兴板块（吴中区、高新区）1.6-2.3万元/㎡，远郊区域（吴江区、相城区）1.2-1.5万元/㎡。',
    highlight: ['苏州工业园区'],
    chartFocus: 'housing',
  },
  {
    title: '就业引擎：549万人的劳动大军',
    content: '2025年苏州城镇新增就业41.52万人，连续6年荣获中国年度最佳促进就业城市。年末有效用工备案人数达549.35万人，失业保险参保553.21万人。创业带动就业13.24万人，展现出强大的经济韧性。',
    highlight: ['昆山市'],
    chartFocus: 'employment',
  },
  {
    title: '生态答卷：PM2.5降至28μg/m³',
    content: '2025年苏州生态环境质量稳中向好。市区PM2.5年均浓度降至28微克/立方米，连续5年达到国家二级标准。太湖连续三年水质稳定达到Ⅲ类。全市完成造林绿化6552亩，生态保护修复面积720.79公顷。',
    highlight: ['吴中区'],
    chartFocus: 'environment',
  },
  {
    title: '城乡融合：从二元到一体的探索',
    content: '苏州是全国城乡融合发展先行区。侯爱敏教授的研究表明，苏州通过城乡要素流动、集体经济引领、共建共享机制等七个维度探索高水平共同富裕路径。吴江入选国家乡村振兴示范县，114个重点项目总投资269亿元。',
    highlight: ['吴江区'],
    chartFocus: 'rural-urban-index',
  },
]

let currentStep = 0
let boundScene: THREE.Scene | null = null

export function initDataStory(scene?: THREE.Scene) {
  if (scene) boundScene = scene
  const btn = document.getElementById('story-btn')
  const container = document.getElementById('story-container')
  const closeBtn = document.getElementById('story-close')
  const prevBtn = document.getElementById('story-prev')
  const nextBtn = document.getElementById('story-next')

  if (!btn || !container) return

  btn.addEventListener('click', () => {
    container.style.display = 'block'
    currentStep = 0
    renderStep()
  })

  closeBtn?.addEventListener('click', () => {
    container.style.display = 'none'
    clearHighlights()
    if (boundScene) highlightDistrictBoundary(boundScene, null)
    resetCameraView()
  })

  prevBtn?.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--
      renderStep()
    }
  })

  nextBtn?.addEventListener('click', () => {
    if (currentStep < storySteps.length - 1) {
      currentStep++
      renderStep()
    }
  })
}

function renderStep() {
  const step = storySteps[currentStep]
  const title = document.getElementById('story-title')
  const content = document.getElementById('story-content')
  const progress = document.getElementById('story-progress')

  if (content) {
    content.style.opacity = '0'
    content.style.transform = 'translateY(10px)'
    setTimeout(() => {
      if (title) title.textContent = step.title
      content.innerHTML = `<p>${step.content}</p>`
      content.style.opacity = '1'
      content.style.transform = 'translateY(0)'
    }, 150)
  }

  if (progress) progress.textContent = `${currentStep + 1}/${storySteps.length}`

  clearHighlights()

  // 联动 3D 场景相机飞行与区县高亮
  if (step.highlight && step.highlight.length > 0) {
    const primary = normalizeDistrictName(step.highlight[0])
    if (boundScene) {
      highlightDistrictBoundary(boundScene, primary)
    }
    const coords = getDistrictCoords(primary)
    if (coords) {
      const { x, z } = geoTo3D(coords.lat, coords.lon)
      flyCameraTo(x, z, 150)
    }
  } else {
    if (boundScene) highlightDistrictBoundary(boundScene, null)
    resetCameraView()
  }

  if (step.chartFocus) {
    const chartEl = document.getElementById(`chart-${step.chartFocus}`)
    if (chartEl) {
      chartEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      chartEl.classList.add('chart-focus')
      chartEl.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.35)'
      setTimeout(() => {
        chartEl.style.boxShadow = ''
      }, 2200)
    }
  }
}

function clearHighlights() {
  document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'))
  document.querySelectorAll('.chart-focus').forEach(el => el.classList.remove('chart-focus'))
}

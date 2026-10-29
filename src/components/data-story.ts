import * as THREE from 'three'
import { flyCameraTo, resetCameraView } from '../scene'
import { geoTo3D, getDistrictCoords, normalizeDistrictName } from '../utils/geo'
import { highlightDistrictBoundary } from './boundary'

interface StoryStep {
  title: string
  content: string
  sourceTitle: string
  sourceUrl: string
  highlight?: string[]
  chartFocus?: string
}

const storySteps: StoryStep[] = [
  {
    title: '从全市看苏州：发展与保护同时展开',
    content: '苏州市国土空间总体规划（2021—2035年）统筹安排市域的空间开发与保护。国务院批复强调，苏州要发挥先进制造业、科技创新、现代物流和江南水乡旅游等方面的功能，同时保护自然资源与历史文化。这张地图从全市尺度开始：先看太湖、长江与城镇分布，再沿区县边界走进不同地区。地图上的高亮是浏览入口，并不代表规划用地边界或项目选址结论。',
    sourceTitle: '苏州市国土空间总体规划获批｜苏州市人民政府',
    sourceUrl: 'https://www.suzhou.gov.cn/szsrmzf/szyw/202501/e438f80458b94cd1b5f6123d89128f17.shtml',
    highlight: ['姑苏区'],
  },
  {
    title: '江南水网：在生态约束中理解城市',
    content: '苏州的水网和湖荡是理解城市空间的起点。规划文本将自然资源保护、生态空间和城乡建设放在同一张市域图上讨论。浏览水系图层时，可以观察太湖周边、沿江地区与城市建设空间之间的关系；但当前图层取自 OpenStreetMap 提取数据，不能把它当作官方河湖划界或土地调查成果。后续可叠加经核验的湿地、河道与生态保护资料，形成可比较的专题。',
    sourceTitle: '苏州市国土空间总体规划（2021—2035年）｜苏州市人民政府',
    sourceUrl: 'https://www.suzhou.gov.cn/2024ndzt/szsgskjgh/202510/6eb6ca459e6c4a02a969ddb7d33ef946.shtml',
    highlight: ['吴中区'],
  },
  {
    title: '各地的角色：一座城市，多种空间路径',
    content: '区县总体规划批复给不同地区提出了不同定位：吴江侧重长三角生态绿色一体化发展示范区，昆山强调临沪对台与产业科创，太仓强调港产城一体化，苏州工业园区强调开放创新。点击区县可以从这些官方定位进入地方故事，继续查找对应的产业、人口、交通和生态材料。这里展示的是规划定位，不等同于已经实现的结果；不同统计口径的区县指标也不宜直接排名。',
    sourceTitle: '苏州相关县级市（区）总规获批｜苏州市人民政府',
    sourceUrl: 'https://www.suzhou.gov.cn/szsrmzf/szyw/202502/103bfa7f0f2c4e0a9d0e603835c4cdfa.shtml',
    highlight: ['昆山市'],
  },
  {
    title: '用统计公报读变化，也读清统计口径',
    content: '2024年苏州市统计公报记录了经济、人口、交通、环境、公共服务等多方面情况，也在注释中交代了部分指标的数据来源与口径变化。例如公路客运统计自2024年起调整范围，因此跨年比较需要先读注释。地图中的每项数字应当保留年份、单位、统计范围和原始出处；在区县数据尚未统一到同一年之前，图表更适合用于查阅，不适合直接推断同年高低。',
    sourceTitle: '2024年苏州市国民经济和社会发展统计公报｜苏州市统计局',
    sourceUrl: 'https://tjj.suzhou.gov.cn/sztjj/tjgb/202504/c77512c90a144784beba4870a6b5cc0d.shtml',
    highlight: ['相城区'],
  },
  {
    title: '一张城市账本：产业与服务如何并存',
    content: '2025年苏州地区生产总值为27695.1亿元，三次产业结构为0.7∶46.4∶52.9。第二产业增加值12844.4亿元，第三产业增加值14641.8亿元；高新技术产业产值占规模以上工业总产值的56.2%。这些指标说明全市经济结构，不能直接投影为某个区县的空间分布。若要回答制造业集中在哪里、服务业与居住区如何联系，还需要统一年份的企业、就业、土地利用与通勤数据，并说明统计单位与地图单元能否对应。',
    sourceTitle: '2025年苏州市国民经济和社会发展统计公报｜苏州市统计局',
    sourceUrl: 'https://tjj.suzhou.gov.cn/sztjj/tjgb/202604/3dc4b574cabd4e86b36ec5d3280e927c.shtml',
  },
  {
    title: '乡村指标：从全市变化走向地方问题',
    content: '2025年苏州新建省级特色田园乡村9个，累计87个；新增省级宜居宜业和美乡村92个，累计231个。它们来自统计公报的全市汇总，尚不能在地图上精确定位或证明每个村庄的建设效果。下一步可按村庄名称和认定批次建立来源表，再叠加人口、公共服务、河湖与交通可达性，比较不同类型地区的变化。未来加入论文时，应保留原始统计、政策文本与研究解释三种证据各自的出处。',
    sourceTitle: '2025年苏州市国民经济和社会发展统计公报｜苏州市统计局',
    sourceUrl: 'https://tjj.suzhou.gov.cn/sztjj/tjgb/202604/3dc4b574cabd4e86b36ec5d3280e927c.shtml',
  },
  {
    title: '从城市走向乡村：把建设放回具体地方',
    content: '《苏州市乡村建设条例》要求乡村建设符合国土空间规划、村庄规划及相关用途管制，并将乡村建设纳入地方发展规划与年度计划。未来的城乡专题可以围绕村庄、公共服务、产业和交通联系逐层展开，但每个图层都需要明确空间范围与资料年份。论文材料加入后，可在这里增加研究视角和争议，而不是用论文替代法规或把概念图误称为政策实施成效。',
    sourceTitle: '苏州市乡村建设条例｜苏州市人民政府',
    sourceUrl: 'https://www.suzhou.gov.cn/szsrmzf/gbdfxfg/202403/3b495796eac04e53b82b1cc8ebc6cbfe.shtml',
    highlight: ['吴江区'],
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
      content.replaceChildren()
      const paragraph = document.createElement('p')
      paragraph.textContent = step.content
      const source = document.createElement('a')
      source.href = step.sourceUrl
      source.target = '_blank'
      source.rel = 'noopener noreferrer'
      source.textContent = `资料来源：${step.sourceTitle} ↗`
      content.append(paragraph, source)
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


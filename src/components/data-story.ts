import * as echarts from 'echarts'

interface StoryStep {
  title: string
  content: string
  highlight?: string[] // 要高亮的区县
  chartFocus?: string  // 要聚焦的图表ID
}

const storySteps: StoryStep[] = [
  {
    title: '苏州：千年古城的现代化蝶变',
    content: '苏州，一座拥有2500年历史的文化名城，2025年GDP达到2.77万亿元，位居全国第六。常住人口1297万，城镇化率超过75%。这座城市的魅力在于，它既保留了古典园林的精致，又拥有现代都市的活力。',
  },
  {
    title: '房价梯度：从3万到8千的城市断面',
    content: '苏州房价呈现明显的圈层分化。工业园区以30279元/㎡领跑全市，是张家港8764元/㎡的3.5倍。核心区（工业园区、姑苏区）均价2.5-3.5万元/㎡，新兴板块（吴中区、高新区）1.6-2.2万元/㎡，远郊区域（吴江区、相城区）1.3-1.5万元/㎡。这种梯度反映了城市发展的空间不均衡。',
    highlight: ['工业园区', '姑苏', '张家港'],
    chartFocus: 'housing',
  },
  {
    title: '就业引擎：549万人的劳动大军',
    content: '2025年苏州城镇新增就业41.52万人，连续6年荣获中国年度最佳促进就业城市。年末有效用工备案人数达549.35万人，失业保险参保553.21万人。创业带动就业13.24万人，技能培训13.01万人次。苏州的就业市场展现出强大的韧性和活力。',
    chartFocus: 'employment',
  },
  {
    title: '生态答卷：PM2.5降至28μg/m³',
    content: '2025年苏州生态环境质量稳中向好。市区PM2.5年均浓度降至28微克/立方米，同比下降3.4%，连续5年达到国家二级标准。地表水环境质量创下"水十条"考核以来最好成绩，太湖连续三年水质稳定达到Ⅲ类。全市完成造林绿化6552亩，生态保护修复面积720.79公顷。',
    chartFocus: 'environment',
  },
  {
    title: '城乡融合：从二元到一体的探索',
    content: '苏州是全国城乡融合发展先行区。导师侯爱敏教授的研究表明，苏州通过城乡要素流动、集体经济引领、共建共享机制等七个方面，探索出了一条高水平共同富裕的路径。吴江入选国家乡村振兴示范县，114个重点项目总投资269亿元。这座城市的城乡差距正在逐步缩小。',
  },
]

let currentStep = 0

export function initDataStory() {
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

  if (title) title.textContent = step.title
  if (content) content.innerHTML = `<p>${step.content}</p>`
  if (progress) progress.textContent = `${currentStep + 1}/${storySteps.length}`

  clearHighlights()

  // 高亮区县
  if (step.highlight) {
    step.highlight.forEach(name => {
      document.querySelectorAll(`[data-name="${name}"]`).forEach(el => {
        (el as HTMLElement).classList.add('highlight')
      })
    })
  }

  // 聚焦图表
  if (step.chartFocus) {
    const chartEl = document.getElementById(`chart-${step.chartFocus}`)
    if (chartEl) {
      chartEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      chartEl.classList.add('chart-focus')
    }
  }
}

function clearHighlights() {
  document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'))
  document.querySelectorAll('.chart-focus').forEach(el => el.classList.remove('chart-focus'))
}

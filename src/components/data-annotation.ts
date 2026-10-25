// 数据校验标注模块 - 在图表下方标注数据来源和年份

interface DataSource {
  chartId: string
  source: string
  year: string
  url?: string
  reliability: 'official' | 'research' | 'media' | 'estimated'
}

const dataSources: DataSource[] = [
  { chartId: 'population', source: '苏州市统计局', year: '2024-2025', reliability: 'official' },
  { chartId: 'industry', source: '苏州市统计局', year: '2025', reliability: 'official' },
  { chartId: 'traffic', source: '苏州市交通运输局', year: '2025', reliability: 'official' },
  { chartId: 'landuse', source: '苏州市自然资源和规划局', year: '2024', reliability: 'official' },
  { chartId: 'education', source: '苏州市教育局', year: '2025', reliability: 'official' },
  { chartId: 'medical', source: '苏州市卫生健康委', year: '2025', reliability: 'official' },
  { chartId: 'tech', source: '苏州市科技局', year: '2025', reliability: 'official' },
  { chartId: 'housing', source: '安居客/苏州楼盘网', year: '2025', reliability: 'media' },
  { chartId: 'environment', source: '苏州市生态环境局', year: '2025', reliability: 'official' },
  { chartId: 'employment', source: '苏州市人社局', year: '2025', reliability: 'official' },
  { chartId: 'urban-rural', source: '苏州市统计局/城乡融合课题组', year: '2025', reliability: 'research' },
  { chartId: 'factor-flow', source: '城乡要素流动模型', year: '2025', reliability: 'research' },
  { chartId: 'industry-dist', source: '苏州市工信局', year: '2025', reliability: 'official' },
]

const reliabilityColors: Record<string, string> = {
  official: '#00ff88',
  research: '#00d4ff',
  media: '#ff9f43',
  estimated: '#6b7a99',
}

const reliabilityLabels: Record<string, string> = {
  official: '官方数据',
  research: '研究数据',
  media: '媒体数据',
  estimated: '估算数据',
}

export function initDataAnnotations() {
  dataSources.forEach(ds => {
    const chartEl = document.getElementById(`chart-${ds.chartId}`)
    if (!chartEl) return

    // 避免重复插入
    if (chartEl.nextElementSibling?.classList.contains('data-annotation')) return

    const annotation = document.createElement('div')
    annotation.className = 'data-annotation'
    annotation.innerHTML = `
      <span class="annotation-dot" style="background:${reliabilityColors[ds.reliability]}"></span>
      <span class="annotation-text">${ds.source} · ${ds.year} · ${reliabilityLabels[ds.reliability]}</span>
    `
    // 插入在 .chart 容器外部正下方，避免撑破 ECharts 内部画布或与下一标题重叠
    chartEl.insertAdjacentElement('afterend', annotation)
  })
}

export function getDataSources() {
  return dataSources
}

// 数据校验标注模块 - 在图表下方标注数据来源和年份

interface DataSource {
  chartId: string
  source: string
  year: string
  url?: string
  reliability: 'official' | 'research' | 'media' | 'estimated' | 'unverified'
}

const dataSources: DataSource[] = [
  { chartId: 'population', source: '区县统计资料', year: '2023/2025 混合', reliability: 'unverified' },
  { chartId: 'industry', source: '苏州市统计局', year: '2025', reliability: 'unverified' },
  { chartId: 'traffic', source: '示意曲线', year: '未接入实测客流', reliability: 'unverified' },
  { chartId: 'landuse', source: '示意分类', year: '待接入核实数据', reliability: 'unverified' },
  { chartId: 'education', source: '苏州市教育局', year: '2025', reliability: 'unverified' },
  { chartId: 'medical', source: '苏州市卫健委/公立医院年报', year: '2024-2025', reliability: 'unverified' },
  { chartId: 'tech', source: '苏州市科技局/统计年鉴', year: '2024-2025', reliability: 'unverified' },
  { chartId: 'housing', source: '安居客/苏州楼盘网', year: '2025', reliability: 'unverified' },
  { chartId: 'environment', source: '苏州市生态环境局', year: '2025', reliability: 'unverified' },
  { chartId: 'employment', source: '苏州市人社局', year: '2025', reliability: 'unverified' },
  { chartId: 'urban-rural', source: '苏州市统计局/城乡融合课题组', year: '2025', reliability: 'unverified' },
  { chartId: 'factor-flow', source: '城乡要素流动模型', year: '2025', reliability: 'unverified' },
  { chartId: 'industry-dist', source: '苏州市工信局', year: '2025', reliability: 'unverified' },
]

const reliabilityColors: Record<string, string> = {
  official: '#00ff88',
  research: '#00d4ff',
  media: '#ff9f43',
  estimated: '#6b7a99',
  unverified: '#ff9f43',
}

const reliabilityLabels: Record<string, string> = {
  official: '官方数据',
  research: '研究数据',
  media: '媒体数据',
  estimated: '估算数据',
  unverified: '示意／待核验',
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




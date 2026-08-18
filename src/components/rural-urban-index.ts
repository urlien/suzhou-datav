// 城乡融合指标体系模块
// 参考：侯爱敏《城乡融合：高水平共同富裕的苏州实践》
// 指标体系基于导师论文方法论，涵盖7个维度

import * as echarts from 'echarts'

interface IndexDimension {
  name: string
  weight: number
  urban: number
  rural: number
  unit: string
  description: string
}

// 苏州城乡融合指标体系（7个维度）
const dimensions: IndexDimension[] = [
  { name: '经济发展', weight: 0.20, urban: 92, rural: 68, unit: '分', description: '人均GDP、财政收入、产业结构' },
  { name: '居民收入', weight: 0.18, urban: 88, rural: 72, unit: '分', description: '城乡收入比、消费水平、恩格尔系数' },
  { name: '公共服务', weight: 0.16, urban: 90, rural: 75, unit: '分', description: '教育、医疗、社保覆盖率' },
  { name: '基础设施', weight: 0.14, urban: 95, rural: 80, unit: '分', description: '交通、通信、供水供电' },
  { name: '生态环境', weight: 0.12, urban: 78, rural: 88, unit: '分', description: '绿化覆盖率、水质、空气质量' },
  { name: '要素流动', weight: 0.12, urban: 85, rural: 65, unit: '分', description: '人才、资金、技术流动' },
  { name: '治理能力', weight: 0.08, urban: 86, rural: 70, unit: '分', description: '基层治理、数字化水平' },
]

export function initRuralUrbanIndex() {
  const el = document.getElementById('chart-rural-urban-index')
  if (!el) return

  const chart = echarts.init(el)

  // 计算综合指数
  const urbanTotal = dimensions.reduce((sum, d) => sum + d.urban * d.weight, 0)
  const ruralTotal = dimensions.reduce((sum, d) => sum + d.rural * d.weight, 0)
  const fusionIndex = ((urbanTotal + ruralTotal) / 2).toFixed(1)

  // 更新综合指数显示
  const indexEl = document.getElementById('fusion-index')
  if (indexEl) {
    indexEl.textContent = fusionIndex
  }

  chart.setOption({
    backgroundColor: 'transparent',
    textStyle: { color: '#e0e6f0', fontSize: 11 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const dim = dimensions.find(d => d.name === params[0].name)
        let html = `<strong>${params[0].name}</strong>（权重${(dim?.weight || 0) * 100}%）<br/>`
        html += `<span style="font-size:11px;color:#6b7a99">${dim?.description}</span><br/>`
        params.forEach((p: any) => {
          html += `${p.marker} ${p.seriesName}: ${p.value}分<br/>`
        })
        return html
      },
    },
    legend: {
      data: ['城区', '乡村'],
      textStyle: { color: '#6b7a99' },
      top: 0,
    },
    radar: {
      indicator: dimensions.map(d => ({ name: d.name, max: 100 })),
      axisName: { color: '#6b7a99', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a2744' } },
      splitArea: { areaStyle: { color: ['transparent'] } },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: dimensions.map(d => d.urban),
          name: '城区',
          areaStyle: { color: 'rgba(0, 212, 255, 0.15)' },
          lineStyle: { color: '#00d4ff', width: 2 },
          itemStyle: { color: '#00d4ff' },
        },
        {
          value: dimensions.map(d => d.rural),
          name: '乡村',
          areaStyle: { color: 'rgba(0, 255, 136, 0.15)' },
          lineStyle: { color: '#00ff88', width: 2 },
          itemStyle: { color: '#00ff88' },
        },
      ],
    }],
  })
}

export function getDimensions() { return dimensions }
export function getFusionIndex(): number {
  const urbanTotal = dimensions.reduce((sum, d) => sum + d.urban * d.weight, 0)
  const ruralTotal = dimensions.reduce((sum, d) => sum + d.rural * d.weight, 0)
  return parseFloat(((urbanTotal + ruralTotal) / 2).toFixed(1))
}

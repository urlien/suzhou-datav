import * as echarts from 'echarts'

const darkTheme = {
  backgroundColor: 'transparent',
  textStyle: { color: '#e0e6f0', fontSize: 11 },
  legend: { textStyle: { color: '#6b7a99' } },
}

export function initRuralUrban() {
  initUrbanRuralChart()
  initFactorFlowChart()
  initIndustryDistChart()
}

// 城乡数据对比
function initUrbanRuralChart() {
  const el = document.getElementById('chart-urban-rural')
  if (!el) return
  const chart = echarts.init(el)
  
  // 2025年苏州城乡数据（来源：统计公报）
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['城区', '乡村'],
      textStyle: { color: '#6b7a99' },
    },
    xAxis: {
      type: 'category',
      data: ['人口密度', '人均收入', '医疗资源', '教育资源', '绿化覆盖率'],
      axisLabel: { color: '#6b7a99', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7a99' },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [
      {
        name: '城区',
        type: 'bar',
        data: [1108, 65000, 95, 98, 35],
        itemStyle: { color: '#00d4ff' },
        barWidth: '30%',
      },
      {
        name: '乡村',
        type: 'bar',
        data: [350, 38000, 45, 60, 65],
        itemStyle: { color: '#00ff88' },
        barWidth: '30%',
      },
    ],
  })
}

// 要素流动可视化
function initFactorFlowChart() {
  const el = document.getElementById('chart-factor-flow')
  if (!el) return
  const chart = echarts.init(el)
  
  // 城乡要素流动数据
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item' },
    series: [{
      type: 'graph',
      layout: 'force',
      data: [
        { name: '城区', symbolSize: 50, itemStyle: { color: '#00d4ff' } },
        { name: '乡村', symbolSize: 40, itemStyle: { color: '#00ff88' } },
        { name: '产业', symbolSize: 30, itemStyle: { color: '#ff9f43' } },
        { name: '人才', symbolSize: 30, itemStyle: { color: '#ff4757' } },
        { name: '资金', symbolSize: 30, itemStyle: { color: '#ffd700' } },
        { name: '技术', symbolSize: 30, itemStyle: { color: '#9b59b6' } },
      ],
      links: [
        { source: '城区', target: '产业', value: 80 },
        { source: '城区', target: '人才', value: 60 },
        { source: '城区', target: '资金', value: 90 },
        { source: '城区', target: '技术', value: 70 },
        { source: '产业', target: '乡村', value: 50 },
        { source: '人才', target: '乡村', value: 30 },
        { source: '资金', target: '乡村', value: 40 },
        { source: '技术', target: '乡村', value: 35 },
      ],
      lineStyle: {
        color: 'source',
        curveness: 0.3,
      },
      emphasis: {
        focus: 'adjacency',
      },
    }],
  })
}

// 产业分布
function initIndustryDistChart() {
  const el = document.getElementById('chart-industry-dist')
  if (!el) return
  const chart = echarts.init(el)
  
  // 苏州产业分布数据
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 42, name: '电子信息', itemStyle: { color: '#00d4ff' } },
        { value: 25, name: '装备制造', itemStyle: { color: '#00ff88' } },
        { value: 15, name: '生物医药', itemStyle: { color: '#ff9f43' } },
        { value: 10, name: '新材料', itemStyle: { color: '#ff4757' } },
        { value: 8, name: '新能源', itemStyle: { color: '#9b59b6' } },
      ],
      label: { color: '#e0e6f0', fontSize: 10 },
    }],
  })
}

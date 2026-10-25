import * as echarts from 'echarts'
import { registerChart } from './charts'

const darkTheme = {
  backgroundColor: 'transparent',
  textStyle: { color: '#e0e6f0', fontSize: 11 },
  legend: { textStyle: { color: '#8a9ab8', fontSize: 10 } },
}

const baseGrid = {
  top: 28,
  right: 10,
  bottom: 8,
  left: 6,
  containLabel: true,
}

export function initRuralUrban() {
  initUrbanRuralChart()
  initFactorFlowChart()
  initIndustryDistChart()
}

// 城乡数据对比（归一化指数对比，0-100分）
function initUrbanRuralChart() {
  const el = document.getElementById('chart-urban-rural')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('urban-rural', chart)

  chart.setOption({
    ...darkTheme,
    grid: baseGrid,
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      data: ['城区', '乡村'],
      textStyle: { color: '#8a9ab8', fontSize: 10 },
    },
    xAxis: {
      type: 'category',
      data: ['人口集聚', '收入水平', '医疗配置', '教育配置', '生态绿化'],
      axisLabel: { color: '#8a9ab8', fontSize: 9, interval: 0 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#8a9ab8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [
      {
        name: '城区',
        type: 'bar',
        data: [92, 90, 95, 96, 78],
        itemStyle: { color: '#00d4ff', borderRadius: [2, 2, 0, 0] },
        barWidth: '28%',
      },
      {
        name: '乡村',
        type: 'bar',
        data: [54, 68, 74, 78, 92],
        itemStyle: { color: '#00ff88', borderRadius: [2, 2, 0, 0] },
        barWidth: '28%',
      },
    ],
  })
}

// 要素流动可视化
function initFactorFlowChart() {
  const el = document.getElementById('chart-factor-flow')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('factor-flow', chart)

  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item' },
    series: [{
      type: 'graph',
      layout: 'force',
      roam: false,
      label: { show: true, color: '#e0e6f0', fontSize: 10 },
      force: { repulsion: 120, edgeLength: [40, 75] },
      data: [
        { name: '城区', symbolSize: 42, itemStyle: { color: '#00d4ff' } },
        { name: '乡村', symbolSize: 36, itemStyle: { color: '#00ff88' } },
        { name: '产业', symbolSize: 26, itemStyle: { color: '#ff9f43' } },
        { name: '人才', symbolSize: 26, itemStyle: { color: '#ff4757' } },
        { name: '资金', symbolSize: 26, itemStyle: { color: '#ffd700' } },
        { name: '技术', symbolSize: 26, itemStyle: { color: '#9b59b6' } },
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
        curveness: 0.25,
        width: 1.5,
      },
      emphasis: {
        focus: 'adjacency',
      },
    }],
  })
}

// 重点产业集群分布
function initIndustryDistChart() {
  const el = document.getElementById('chart-industry-dist')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('industry-dist', chart)

  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    legend: {
      top: 2,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#8a9ab8', fontSize: 10 },
    },
    series: [{
      type: 'pie',
      center: ['50%', '58%'],
      radius: ['35%', '60%'],
      data: [
        { value: 38, name: '电子信息', itemStyle: { color: '#00d4ff' } },
        { value: 27, name: '装备制造', itemStyle: { color: '#00ff88' } },
        { value: 16, name: '生物医药', itemStyle: { color: '#ff9f43' } },
        { value: 11, name: '先进材料', itemStyle: { color: '#ff4757' } },
        { value: 8, name: '新能源', itemStyle: { color: '#a855f7' } },
      ],
      label: { color: '#e0e6f0', fontSize: 10, formatter: '{b} {d}%' },
      labelLine: { length: 6, length2: 6 },
    }],
  })
}

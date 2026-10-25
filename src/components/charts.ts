import * as echarts from 'echarts'
import { populationData } from '../data/official-stats'
import { CANONICAL_DISTRICTS, normalizeDistrictName } from '../utils/geo'
import { openDistrictModal } from './enhanced-interaction'
import { filterState } from './filter'

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

// 全局图表注册表（统一管理联动与窗口缩放自适应）
const chartInstances: Map<string, echarts.ECharts> = new Map()
let resizeBound = false

export function registerChart(id: string, chart: echarts.ECharts) {
  chartInstances.set(id, chart)
  if (!resizeBound) {
    resizeBound = true
    window.addEventListener('resize', () => {
      chartInstances.forEach(c => {
        c.resize()
      })
    })
  }
}

export function resizeAllCharts() {
  chartInstances.forEach(c => c.resize())
}

// 响应深色/浅色/投影主题切换，动态更新所有 ECharts 实例的文字、图例、坐标轴与网格颜色
export function updateChartsTheme(theme: string) {
  const isLight = theme === 'light'
  const textColor = isLight ? '#1a2233' : '#e0e6f0'
  const subTextColor = isLight ? '#334155' : '#8a9ab8'
  const splitColor = isLight ? '#d8e0ec' : '#1a2744'

  chartInstances.forEach((chart, id) => {
    const opt = chart.getOption() as any
    const patch: any = {
      textStyle: { color: textColor },
    }

    if (opt.legend && opt.legend.length > 0) {
      patch.legend = opt.legend.map(() => ({
        textStyle: { color: subTextColor },
      }))
    }

    if (opt.xAxis && opt.xAxis.length > 0) {
      patch.xAxis = opt.xAxis.map(() => ({
        axisLabel: { color: subTextColor },
        axisLine: { lineStyle: { color: splitColor } },
        nameTextStyle: { color: subTextColor },
      }))
    }

    if (opt.yAxis && opt.yAxis.length > 0) {
      patch.yAxis = opt.yAxis.map(() => ({
        axisLabel: { color: subTextColor },
        splitLine: { lineStyle: { color: splitColor } },
        nameTextStyle: { color: subTextColor },
      }))
    }

    if (opt.radar && opt.radar.length > 0) {
      patch.radar = opt.radar.map(() => ({
        axisName: { color: subTextColor },
        splitLine: { lineStyle: { color: splitColor } },
        axisLine: { lineStyle: { color: splitColor } },
      }))
    }

    if (opt.series && opt.series.length > 0) {
      patch.series = opt.series.map((s: any) => {
        if (s.type === 'pie' || s.type === 'graph') {
          return { label: { color: textColor } }
        }
        if (id === 'timeline') {
          return { label: { color: subTextColor } }
        }
        return {}
      })
    }

    chart.setOption(patch)
  })
}

const shortName = (name: string) =>
  name === '苏州工业园区' ? '工业园区' : name.replace(/[市区]$/, '')

const housingRaw: { name: string; price: number }[] = [
  { name: '苏州工业园区', price: 30279 },
  { name: '姑苏区', price: 25000 },
  { name: '虎丘区', price: 23000 },
  { name: '吴中区', price: 18000 },
  { name: '昆山市', price: 16966 },
  { name: '相城区', price: 14783 },
  { name: '常熟市', price: 12200 },
  { name: '吴江区', price: 12034 },
  { name: '太仓市', price: 11319 },
  { name: '张家港市', price: 8764 },
]

export function initCharts() {
  initPopulationChart()
  initIndustryChart()
  initTrafficChart()
  initLanduseChart()
  initEducationChart()
  initMedicalChart()
  initTechChart()
  initHousingChart()
  initEnvironmentChart()
  initEmploymentChart()
  initChartLinking()
}

function initChartLinking() {
  chartInstances.forEach((chart, id) => {
    chart.on('mouseover', (params: any) => {
      if (params.name) {
        chartInstances.forEach((otherChart, otherId) => {
          if (otherId !== id) {
            otherChart.dispatchAction({ type: 'highlight', name: params.name })
          }
        })
      }
    })
    chart.on('mouseout', (params: any) => {
      if (params.name) {
        chartInstances.forEach((otherChart, otherId) => {
          if (otherId !== id) {
            otherChart.dispatchAction({ type: 'downplay', name: params.name })
          }
        })
      }
    })
    chart.on('click', (params: any) => {
      if (params.name && (id === 'population' || id === 'housing')) {
        openDistrictModal(params.name)
      }
    })
  })
}

function initPopulationChart() {
  const el = document.getElementById('chart-population')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('population', chart)

  const render = (districts: readonly string[]) => {
    const sorted = [...districts].sort((a, b) => (populationData[b] || 0) - (populationData[a] || 0))
    chart.setOption({
      ...darkTheme,
      grid: baseGrid,
      tooltip: { trigger: 'axis', formatter: '{b}: {c}万人（点击下钻）' },
      xAxis: {
        type: 'category',
        data: sorted.map(shortName),
        axisLabel: { color: '#8a9ab8', fontSize: 9, rotate: 30, interval: 0 },
        axisLine: { lineStyle: { color: '#1a2744' } },
      },
      yAxis: {
        type: 'value',
        name: '万人',
        nameTextStyle: { color: '#6b7a99', fontSize: 10 },
        axisLabel: { color: '#8a9ab8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1a2744' } },
      },
      series: [{
        type: 'bar',
        data: sorted.map(d => populationData[d] || 0),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00d4ff' },
            { offset: 1, color: '#0066aa' },
          ]),
          borderRadius: [3, 3, 0, 0],
        },
        barWidth: '58%',
      }],
    })
  }

  render(CANONICAL_DISTRICTS)

  document.addEventListener('filter-changed', () => {
    const active = filterState.selectedDistricts.map(normalizeDistrictName)
    render(active.length > 0 ? active : CANONICAL_DISTRICTS)
  })
}

function initIndustryChart() {
  const el = document.getElementById('chart-industry')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('industry', chart)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
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
      radius: ['36%', '62%'],
      data: [
        { value: 52.9, name: '第三产业', itemStyle: { color: '#00d4ff' } },
        { value: 46.4, name: '第二产业', itemStyle: { color: '#00ff88' } },
        { value: 0.7, name: '第一产业', itemStyle: { color: '#ff9f43' } },
      ],
      label: {
        color: '#e0e6f0',
        fontSize: 10,
        formatter: '{b}\n{c}%',
      },
      labelLine: { length: 8, length2: 6 },
    }],
  })
}

function initTrafficChart() {
  const el = document.getElementById('chart-traffic')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('traffic', chart)
  chart.setOption({
    ...darkTheme,
    grid: baseGrid,
    tooltip: { trigger: 'axis', formatter: '{b}<br/>客流指数: {c}万人次' },
    xAxis: {
      type: 'category',
      data: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      axisLabel: { color: '#8a9ab8', fontSize: 9 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      name: '万人次',
      nameTextStyle: { color: '#6b7a99', fontSize: 10 },
      axisLabel: { color: '#8a9ab8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'line',
      data: [120, 890, 650, 420, 380, 720, 950, 580, 210],
      smooth: true,
      lineStyle: { color: '#00d4ff', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0,212,255,0.32)' },
          { offset: 1, color: 'rgba(0,212,255,0)' },
        ]),
      },
      symbol: 'circle',
      symbolSize: 4,
      itemStyle: { color: '#00d4ff' },
    }],
  })
}

function initLanduseChart() {
  const el = document.getElementById('chart-landuse')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('landuse', chart)
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
        { value: 35, name: '建设用地', itemStyle: { color: '#ff4757' } },
        { value: 25, name: '耕地', itemStyle: { color: '#00ff88' } },
        { value: 20, name: '水域', itemStyle: { color: '#00d4ff' } },
        { value: 15, name: '林地', itemStyle: { color: '#2ed573' } },
        { value: 5, name: '其他', itemStyle: { color: '#6b7a99' } },
      ],
      label: { color: '#e0e6f0', fontSize: 10, formatter: '{b} {d}%' },
      labelLine: { length: 6, length2: 6 },
    }],
  })
}

function initEducationChart() {
  const el = document.getElementById('chart-education')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('education', chart)
  chart.setOption({
    ...darkTheme,
    grid: baseGrid,
    tooltip: { trigger: 'axis', formatter: '{b}: {c}所' },
    xAxis: {
      type: 'category',
      data: ['幼儿园', '小学', '初中', '高中', '高校'],
      axisLabel: { color: '#8a9ab8', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      name: '所',
      nameTextStyle: { color: '#6b7a99', fontSize: 10 },
      axisLabel: { color: '#8a9ab8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'bar',
      data: [1020, 450, 280, 138, 27],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#00ff88' },
          { offset: 1, color: '#006644' },
        ]),
        borderRadius: [3, 3, 0, 0],
      },
      barWidth: '55%',
    }],
  })
}

function initMedicalChart() {
  const el = document.getElementById('chart-medical')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('medical', chart)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item', formatter: '{b}: {c}家' },
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
        { value: 288, name: '医院', itemStyle: { color: '#ff4757' } },
        { value: 37, name: '三级医院', itemStyle: { color: '#00d4ff' } },
        { value: 17, name: '三甲医院', itemStyle: { color: '#00ff88' } },
        { value: 4702, name: '基层医疗', itemStyle: { color: '#6b7a99' } },
      ],
      label: { color: '#e0e6f0', fontSize: 10, formatter: '{b}\n{c}' },
      labelLine: { length: 6, length2: 6 },
    }],
  })
}

function initTechChart() {
  const el = document.getElementById('chart-tech')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('tech', chart)
  chart.setOption({
    ...darkTheme,
    grid: baseGrid,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['高新企业', '专精特新', '专利(万件)', '研发人员(万)'],
      axisLabel: { color: '#8a9ab8', fontSize: 9, interval: 0 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#8a9ab8',
        fontSize: 9,
        formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'bar',
      data: [18500, 848, 18.4, 47],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#ff9f43' },
          { offset: 1, color: '#aa6600' },
        ]),
        borderRadius: [3, 3, 0, 0],
      },
      barWidth: '55%',
    }],
  })
}

function initHousingChart() {
  const el = document.getElementById('chart-housing')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('housing', chart)

  const render = (selected: readonly string[]) => {
    const set = new Set(selected.map(normalizeDistrictName))
    const filtered = housingRaw.filter(item => set.size === 0 || set.has(item.name))
    chart.setOption({
      ...darkTheme,
      grid: baseGrid,
      tooltip: { trigger: 'axis', formatter: '{b}: {c}元/㎡（点击下钻）' },
      xAxis: {
        type: 'category',
        data: filtered.map(i => shortName(i.name)),
        axisLabel: { color: '#8a9ab8', fontSize: 9, rotate: 30, interval: 0 },
        axisLine: { lineStyle: { color: '#1a2744' } },
      },
      yAxis: {
        type: 'value',
        name: '元/㎡',
        nameTextStyle: { color: '#6b7a99', fontSize: 10 },
        axisLabel: { color: '#8a9ab8', fontSize: 9, formatter: (v: number) => (v / 10000).toFixed(1) + '万' },
        splitLine: { lineStyle: { color: '#1a2744' } },
      },
      series: [{
        type: 'bar',
        data: filtered.map(i => i.price),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ff6b6b' },
            { offset: 1, color: '#aa3333' },
          ]),
          borderRadius: [3, 3, 0, 0],
        },
        barWidth: '58%',
      }],
    })
  }

  render(CANONICAL_DISTRICTS)

  document.addEventListener('filter-changed', () => {
    render(filterState.selectedDistricts)
  })
}

function initEnvironmentChart() {
  const el = document.getElementById('chart-environment')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('environment', chart)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item' },
    radar: {
      radius: '62%',
      indicator: [
        { name: 'PM2.5\n(28μg/m³)', max: 50 },
        { name: '水质优Ⅲ\n(96.7%)', max: 100 },
        { name: '优良天数\n(85%)', max: 100 },
        { name: '造林绿化\n(6552亩)', max: 10000 },
        { name: '生态修复\n(720公顷)', max: 1000 },
        { name: '可再生能源\n(905万kW)', max: 1500 },
      ],
      axisName: { color: '#8a9ab8', fontSize: 9 },
      splitLine: { lineStyle: { color: '#1a2744' } },
      splitArea: { areaStyle: { color: ['transparent'] } },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: [28, 96.7, 85, 6552, 720, 905],
        name: '2025年生态环境指标',
        areaStyle: { color: 'rgba(0, 255, 136, 0.2)' },
        lineStyle: { color: '#00ff88' },
        itemStyle: { color: '#00ff88' },
      }],
    }],
  })
}

function initEmploymentChart() {
  const el = document.getElementById('chart-employment')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('employment', chart)
  chart.setOption({
    ...darkTheme,
    grid: baseGrid,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['人均收入\n(万元)', '人均消费\n(万元)', '城镇收入\n(万元)', '农村收入\n(万元)', '新增就业\n(万人)', '创业带动\n(万人)'],
      axisLabel: { color: '#8a9ab8', fontSize: 8, interval: 0 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8a9ab8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'bar',
      data: [8.08, 5.02, 9.01, 5.13, 41.52, 13.24],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#a855f7' },
          { offset: 1, color: '#6633aa' },
        ]),
        borderRadius: [3, 3, 0, 0],
      },
      barWidth: '55%',
    }],
  })
}

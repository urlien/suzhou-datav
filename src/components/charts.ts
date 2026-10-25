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
        if (id === 'timeline' || id === 'tech' || id === 'medical') {
          return { label: { color: textColor } }
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

  const medicalData = [
    {
      name: '基层医疗',
      value: 4702,
      unit: '家',
      desc: '社区服务中心/门诊/卫生室，构筑15分钟健康圈',
      gradient: ['#636e72', '#2d3436'],
      pctOfParent: '全市全域覆盖',
    },
    {
      name: '医院总量',
      value: 288,
      unit: '所',
      desc: '全域综合医院、中医院及各类专科医疗机构',
      gradient: ['#74b9ff', '#0984e3'],
      pctOfParent: '区域核心力量',
    },
    {
      name: '三级医院',
      value: 37,
      unit: '所',
      desc: '高水平骨干医院（含三甲与三乙），占医院总量 12.8%',
      gradient: ['#00cec9', '#00b894'],
      pctOfParent: '占医院 12.8%',
    },
    {
      name: '三甲龙头',
      value: 17,
      unit: '所',
      desc: '顶尖三级甲等综合/专科医院，占三级医院 45.9%',
      gradient: ['#55efc4', '#00b894'],
      pctOfParent: '占三级 45.9%',
    },
  ]

  chart.setOption({
    ...darkTheme,
    grid: {
      top: 14,
      right: 50,
      bottom: 22,
      left: 60,
      containLabel: false,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(13, 18, 37, 0.95)',
      borderColor: '#00d4ff',
      textStyle: { color: '#e0e6f0', fontSize: 11 },
      formatter: (params: any) => {
        const item = medicalData[params.dataIndex]
        if (!item) return ''
        return `<strong>${item.name}</strong>: ${item.value} ${item.unit}<br/>` +
               `<span style="color:#00ff88;font-size:10px">${item.pctOfParent}</span><br/>` +
               `<span style="color:#8a9ab8;font-size:10px">${item.desc}</span>`
      },
    },
    xAxis: {
      type: 'log',
      logBase: 10,
      min: 1,
      max: 10000,
      splitLine: { lineStyle: { color: '#1a2744' } },
      axisLabel: {
        color: '#8a9ab8',
        fontSize: 9,
        formatter: (v: number) => (v === 1 ? '1' : v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'category',
      data: medicalData.map(d => d.name),
      axisLabel: { color: '#8a9ab8', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1a2744' } },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: medicalData.map((d) => ({
        value: d.value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: d.gradient[0] },
            { offset: 1, color: d.gradient[1] },
          ]),
          borderRadius: [0, 4, 4, 0],
        },
      })),
      barWidth: 14,
      label: {
        show: true,
        position: 'right',
        formatter: (params: any) => {
          const item = medicalData[params.dataIndex]
          return `${item.value}${item.unit}`
        },
        color: '#e0e6f0',
        fontSize: 10,
        offset: [4, 0],
      },
    }],
  })
}

function initTechChart() {
  const el = document.getElementById('chart-tech')
  if (!el) return
  const chart = echarts.init(el)
  registerChart('tech', chart)

  const techMetrics = [
    {
      name: '研发人员',
      actual: '47.0 万人',
      targetLabel: '参考基准 50 万人',
      progress: 94.0,
      badge: '全省第一',
      color: ['#00d4ff', '#0984e3'],
    },
    {
      name: '发明专利',
      actual: '18.4 件/万人',
      targetLabel: '参考基准 20 件/万人',
      progress: 92.0,
      badge: '超全国均值',
      color: ['#00ff88', '#00a35c'],
    },
    {
      name: '专精特新',
      actual: '848 家',
      targetLabel: '参考基准 1000 家',
      progress: 84.8,
      badge: '国家+省级',
      color: ['#ff9f43', '#e67e22'],
    },
    {
      name: '高新企业',
      actual: '1.85 万家',
      targetLabel: '参考基准 2 万家',
      progress: 92.5,
      badge: '全国第四',
      color: ['#ff6b81', '#ee5253'],
    },
  ]

  chart.setOption({
    ...darkTheme,
    grid: {
      top: 14,
      right: 76,
      bottom: 22,
      left: 60,
      containLabel: false,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(13, 18, 37, 0.95)',
      borderColor: '#00d4ff',
      textStyle: { color: '#e0e6f0', fontSize: 11 },
      formatter: (params: any) => {
        const item = techMetrics[params.dataIndex]
        if (!item) return ''
        return `<strong>${item.name}</strong><br/>` +
               `当前实绩: <span style="color:#00ff88;font-weight:bold">${item.actual}</span><br/>` +
               `${item.targetLabel} (达成率 ${item.progress}%)<br/>` +
               `<span style="color:#ff9f43;font-size:10px">${item.badge}</span>`
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: '#1a2744' } },
      axisLabel: {
        color: '#8a9ab8',
        fontSize: 9,
        formatter: '{value}%',
      },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'category',
      data: techMetrics.map(d => d.name),
      axisLabel: { color: '#8a9ab8', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1a2744' } },
      axisTick: { show: false },
    },
    series: [
      // 背景槽底条 (100% 槽位)
      {
        type: 'bar',
        barWidth: 12,
        barGap: '-100%',
        data: techMetrics.map(() => 100),
        itemStyle: {
          color: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 4,
        },
        silent: true,
        z: 1,
      },
      // 实绩进度条 (0~100% 归一化)
      {
        type: 'bar',
        barWidth: 12,
        data: techMetrics.map(d => ({
          value: d.progress,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: d.color[0] },
              { offset: 1, color: d.color[1] },
            ]),
            borderRadius: 4,
          },
        })),
        z: 2,
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            const item = techMetrics[params.dataIndex]
            return `${item.actual}`
          },
          color: '#e0e6f0',
          fontSize: 10,
          offset: [6, 0],
        },
      },
    ],
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

import * as echarts from 'echarts'

const darkTheme = {
  backgroundColor: 'transparent',
  textStyle: { color: '#e0e6f0', fontSize: 11 },
  legend: { textStyle: { color: '#6b7a99' } },
}

export function initCharts() {
  initPopulationChart()
  initIndustryChart()
  initTrafficChart()
  initLanduseChart()
  initEducationChart()
  initMedicalChart()
  initMedicalChart()
}

function initPopulationChart() {
  const el = document.getElementById('chart-population')
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['姑苏区', '虎丘区', '吴中区', '相城区', '吴江区', '昆山', '太仓', '常熟', '张家港'],
      axisLabel: { color: '#6b7a99', fontSize: 9, rotate: 30 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7a99' },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'bar',
      data: [92, 39, 112, 73, 90, 210, 51, 106, 88],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#00d4ff' },
          { offset: 1, color: '#0066aa' },
        ]),
      },
      barWidth: '60%',
    }],
  })
}

function initIndustryChart() {
  const el = document.getElementById('chart-industry')
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 42, name: '第三产业', itemStyle: { color: '#00d4ff' } },
        { value: 48, name: '第二产业', itemStyle: { color: '#00ff88' } },
        { value: 10, name: '第一产业', itemStyle: { color: '#ff9f43' } },
      ],
      label: { color: '#e0e6f0', fontSize: 10 },
    }],
  })
}

function initTrafficChart() {
  const el = document.getElementById('chart-traffic')
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      axisLabel: { color: '#6b7a99', fontSize: 9 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7a99' },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'line',
      data: [120, 890, 650, 420, 380, 720, 950, 580, 210],
      smooth: true,
      lineStyle: { color: '#00d4ff', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0,212,255,0.3)' },
          { offset: 1, color: 'rgba(0,212,255,0)' },
        ]),
      },
      symbol: 'none',
    }],
  })
}

function initLanduseChart() {
  const el = document.getElementById('chart-landuse')
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 35, name: '建设用地', itemStyle: { color: '#ff4757' } },
        { value: 25, name: '耕地', itemStyle: { color: '#00ff88' } },
        { value: 20, name: '水域', itemStyle: { color: '#00d4ff' } },
        { value: 15, name: '林地', itemStyle: { color: '#2ed573' } },
        { value: 5, name: '其他', itemStyle: { color: '#6b7a99' } },
      ],
      label: { color: '#e0e6f0', fontSize: 10 },
    }],
  })
}

function initEducationChart() {
  const el = document.getElementById('chart-education')
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['姑苏', '虎丘', '吴中', '相城', '吴江', '昆山', '太仓', '常熟', '张家港'],
      axisLabel: { color: '#6b7a99', fontSize: 9, rotate: 30 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7a99' },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'bar',
      data: [45, 22, 38, 28, 35, 68, 25, 52, 42],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#00ff88' },
          { offset: 1, color: '#006644' },
        ]),
      },
      barWidth: '60%',
    }],
  })
}

function initMedicalChart() {
  const el = document.getElementById('chart-medical')
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['姑苏', '虎丘', '吴中', '相城', '吴江', '昆山', '太仓', '常熟', '张家港'],
      axisLabel: { color: '#6b7a99', fontSize: 9, rotate: 30 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7a99' },
      splitLine: { lineStyle: { color: '#1a2744' } },
    },
    series: [{
      type: 'line',
      data: [320, 150, 280, 180, 220, 450, 160, 380, 280],
      smooth: true,
      lineStyle: { color: '#ff9f43', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,159,67,0.3)' },
          { offset: 1, color: 'rgba(255,159,67,0)' },
        ]),
      },
      symbol: 'none',
    }],
  })
}

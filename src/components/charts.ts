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
  initTechChart()
}

function initPopulationChart() {
  const el = document.getElementById('chart-population')
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'axis', formatter: '{b}: {c}万人' },
    xAxis: {
      type: 'category',
      data: ['昆山', '工业园区', '常熟', '张家港', '姑苏', '吴中', '吴江', '虎丘', '太仓', '相城'],
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
      data: [216, 137, 106, 88, 92, 112, 90, 86, 51, 92],
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
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 52.9, name: '第三产业 52.9%', itemStyle: { color: '#00d4ff' } },
        { value: 46.4, name: '第二产业 46.4%', itemStyle: { color: '#00ff88' } },
        { value: 0.7, name: '第一产业 0.7%', itemStyle: { color: '#ff9f43' } },
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
      name: '万人次',
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
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
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
  // 2025年数据：全市868所学校（不含幼儿园），在校学生197.9万人
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['幼儿园', '小学', '初中', '高中', '高校'],
      axisLabel: { color: '#6b7a99', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      name: '所',
      axisLabel: { color: '#6b7a99' },
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
      },
      barWidth: '60%',
    }],
  })
}

function initMedicalChart() {
  const el = document.getElementById('chart-medical')
  if (!el) return
  const chart = echarts.init(el)
  // 2025年数据：5027家医疗机构，288家医院，37家三级医院，17家三甲
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'item', formatter: '{b}: {c}家' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 288, name: '医院 288', itemStyle: { color: '#ff4757' } },
        { value: 37, name: '三级医院 37', itemStyle: { color: '#00d4ff' } },
        { value: 17, name: '三甲医院 17', itemStyle: { color: '#00ff88' } },
        { value: 4702, name: '基层医疗 4702', itemStyle: { color: '#6b7a99' } },
      ],
      label: { color: '#e0e6f0', fontSize: 10 },
    }],
  })
}

function initTechChart() {
  const el = document.getElementById('chart-tech')
  if (!el) return
  const chart = echarts.init(el)
  // 2025年苏州科技创新数据
  chart.setOption({
    ...darkTheme,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['高新企业', '专精特新', '专利(万件)', '研发人员(万)'],
      axisLabel: { color: '#6b7a99', fontSize: 9 },
      axisLine: { lineStyle: { color: '#1a2744' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7a99' },
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
      },
      barWidth: '60%',
    }],
  })
}

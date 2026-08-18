import * as echarts from 'echarts'
import { areaData, populationData, gdpData } from '../data/official-stats'

// 合并官方数据
const districts = Object.keys(areaData).map(name => {
  const pop = populationData[name] || 0
  const area = areaData[name] || 0
  const gdp = gdpData[name] || 0
  
  return {
    name,
    population: pop,
    gdp: gdp,
    area: area,
    gdpPerCapita: area > 0 ? Math.round(gdp * 10000 / pop) : 0, // 人均GDP（元）
    density: area > 0 ? Math.round(pop * 10000 / area) : 0, // 人口密度（人/km²）
  }
})

const indicators = [
  { key: 'population', label: '常住人口', unit: '万人' },
  { key: 'gdp', label: 'GDP', unit: '亿元' },
  { key: 'area', label: '面积', unit: 'km²' },
  { key: 'gdpPerCapita', label: '人均GDP', unit: '元' },
  { key: 'density', label: '人口密度', unit: '人/km²' },
]

export function initComparison() {
  const container = document.getElementById('comparison-container')
  if (!container) return

  container.innerHTML = `
    <div class="comparison-header">
      <div class="comparison-title">📊 区域数据对比</div>
      <div class="comparison-selects">
        <select id="compare-left" class="compare-select">
          ${districts.map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
        </select>
        <span class="compare-vs">VS</span>
        <select id="compare-right" class="compare-select">
          ${districts.map((d, i) => `<option value="${d.name}" ${i === 1 ? 'selected' : ''}>${d.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="comparison-chart" style="height:300px"></div>
    <div id="comparison-table" class="comparison-table"></div>
  `

  const chart = echarts.init(document.getElementById('comparison-chart')!)

  function updateComparison() {
    const leftName = (document.getElementById('compare-left') as HTMLSelectElement).value
    const rightName = (document.getElementById('compare-right') as HTMLSelectElement).value
    const left = districts.find(d => d.name === leftName)!
    const right = districts.find(d => d.name === rightName)!

    // 更新图表
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: {
        data: [leftName, rightName],
        textStyle: { color: '#e0e6f0' },
      },
      xAxis: {
        type: 'category',
        data: indicators.map(i => i.label),
        axisLabel: { color: '#6b7a99', fontSize: 10, rotate: 15 },
        axisLine: { lineStyle: { color: '#1a2744' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#6b7a99' },
        splitLine: { lineStyle: { color: '#1a2744' } },
      },
      series: [
        {
          name: leftName,
          type: 'bar',
          data: indicators.map(i => (left as any)[i.key]),
          itemStyle: { color: '#00d4ff' },
          barWidth: '30%',
        },
        {
          name: rightName,
          type: 'bar',
          data: indicators.map(i => (right as any)[i.key]),
          itemStyle: { color: '#00ff88' },
          barWidth: '30%',
        },
      ],
    })

    // 更新表格
    const tableEl = document.getElementById('comparison-table')!
    let tableHtml = '<table class="compare-table"><thead><tr><th>指标</th><th>' + leftName + '</th><th>' + rightName + '</th></tr></thead><tbody>'
    for (const ind of indicators) {
      const leftVal = (left as any)[ind.key]
      const rightVal = (right as any)[ind.key]
      tableHtml += `<tr><td>${ind.label}</td><td>${leftVal.toLocaleString()} ${ind.unit}</td><td>${rightVal.toLocaleString()} ${ind.unit}</td></tr>`
    }
    tableHtml += '</tbody></table>'
    tableHtml += '<div style="text-align:center;padding:10px;color:#6b7a99;font-size:12px;">数据来源：苏州市统计局、各区县政府官网</div>'
    tableEl.innerHTML = tableHtml
  }

  // 事件监听
  document.getElementById('compare-left')!.addEventListener('change', updateComparison)
  document.getElementById('compare-right')!.addEventListener('change', updateComparison)

  // 初始化
  updateComparison()
}

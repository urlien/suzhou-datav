import * as echarts from 'echarts'
import { areaData, gdpData, populationData } from '../data/official-stats'
import { CANONICAL_DISTRICTS } from '../utils/geo'
import { registerChart } from './charts'
import { filterState } from './filter'

const districts = CANONICAL_DISTRICTS.map(name => {
  const pop = populationData[name] || 0
  const area = areaData[name] || 0
  const gdp = gdpData[name] || 0

  return {
    name,
    population: pop,
    gdp,
    area,
    gdpPerCapita: pop > 0 ? +(gdp / pop).toFixed(2) : 0, // 人均GDP(万元)
    density: area > 0 ? Math.round((pop * 10000) / area) : 0, // 人口密度(人/km²)
  }
})

const allIndicators = [
  { key: 'population', label: '常住人口', unit: '万人' },
  { key: 'gdp', label: 'GDP总量', unit: '亿元' },
  { key: 'area', label: '行政面积', unit: 'km²' },
  { key: 'gdpPerCapita', label: '人均GDP', unit: '万元' },
  { key: 'density', label: '人口密度', unit: '人/km²' },
] as const

export function initComparison() {
  const container = document.getElementById('comparison-container')
  if (!container) return

  container.innerHTML = `
    <div class="comparison-header">
      <div class="comparison-title">⚖️ 区县多维指标双城对比（受筛选器指标与区县实时联动）</div>
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
    <div class="comparison-body">
      <div id="comparison-chart" style="height:220px;flex:1;min-width:260px"></div>
      <div id="comparison-table" class="comparison-table" style="flex:1;min-width:280px"></div>
    </div>
  `

  const chart = echarts.init(document.getElementById('comparison-chart')!)
  registerChart('comparison', chart)

  // 计算各指标最大值用于归一化对比柱状图（避免不同量纲相互挤压）
  const maxByKey: Record<string, number> = {}
  for (const ind of allIndicators) {
    maxByKey[ind.key] = Math.max(...districts.map(d => d[ind.key])) || 1
  }

  function updateComparison() {
    const leftName = (document.getElementById('compare-left') as HTMLSelectElement).value
    const rightName = (document.getElementById('compare-right') as HTMLSelectElement).value
    const left = districts.find(d => d.name === leftName)!
    const right = districts.find(d => d.name === rightName)!

    const activeIndicators = allIndicators.filter(ind =>
      filterState.selectedIndicators.length === 0 || filterState.selectedIndicators.includes(ind.key)
    )
    const indicators = activeIndicators.length > 0 ? activeIndicators : allIndicators

    const isLight = document.documentElement.getAttribute('data-theme') === 'light'
    const labelColor = isLight ? '#334155' : '#8a9ab8'
    const textColor = isLight ? '#1a2233' : '#e0e6f0'
    const splitColor = isLight ? '#d8e0ec' : '#1a2744'

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 28, right: 12, bottom: 8, left: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const idx = params[0].dataIndex
          const ind = indicators[idx]
          return `<b>${ind.label}</b><br/>` +
            `${leftName}: ${(left as any)[ind.key]} ${ind.unit}<br/>` +
            `${rightName}: ${(right as any)[ind.key]} ${ind.unit}`
        },
      },
      legend: {
        top: 0,
        data: [leftName, rightName],
        textStyle: { color: textColor, fontSize: 11 },
      },
      xAxis: {
        type: 'category',
        data: indicators.map(i => i.label),
        axisLabel: { color: labelColor, fontSize: 10, interval: 0 },
        axisLine: { lineStyle: { color: splitColor } },
      },
      yAxis: {
        type: 'value',
        max: 100,
        name: '相对全市峰值(%)',
        nameTextStyle: { color: labelColor, fontSize: 10 },
        axisLabel: { color: labelColor, fontSize: 10 },
        splitLine: { lineStyle: { color: splitColor } },
      },
      series: [
        {
          name: leftName,
          type: 'bar',
          data: indicators.map(i => Math.round(((left as any)[i.key] / maxByKey[i.key]) * 100)),
          itemStyle: { color: '#00d4ff', borderRadius: [3, 3, 0, 0] },
          barWidth: '28%',
        },
        {
          name: rightName,
          type: 'bar',
          data: indicators.map(i => Math.round(((right as any)[i.key] / maxByKey[i.key]) * 100)),
          itemStyle: { color: '#00ff88', borderRadius: [3, 3, 0, 0] },
          barWidth: '28%',
        },
      ],
    }, true)

    const tableEl = document.getElementById('comparison-table')!
    let tableHtml = `<table class="compare-table"><thead><tr><th>指标</th><th>${leftName}</th><th>${rightName}</th></tr></thead><tbody>`
    for (const ind of indicators) {
      const leftVal = (left as any)[ind.key]
      const rightVal = (right as any)[ind.key]
      const leftWin = leftVal >= rightVal
      tableHtml += `<tr>
        <td>${ind.label}</td>
        <td class="${leftWin ? 'positive' : ''}">${leftVal.toLocaleString()} ${ind.unit}</td>
        <td class="${!leftWin ? 'positive' : ''}">${rightVal.toLocaleString()} ${ind.unit}</td>
      </tr>`
    }
    tableHtml += '</tbody></table>'
    tableEl.innerHTML = tableHtml
  }

  document.getElementById('compare-left')!.addEventListener('change', updateComparison)
  document.getElementById('compare-right')!.addEventListener('change', updateComparison)
  document.addEventListener('filter-changed', updateComparison)

  updateComparison()
}

import * as echarts from 'echarts'

const districts = [
  { name: '昆山市', population: 216, gdp: 5615, area: 931, gdpPerCapita: 26.0, density: 232, schools: 128, hospitals: 45 },
  { name: '工业园区', population: 137, gdp: 4163, area: 278, gdpPerCapita: 30.4, density: 493, schools: 85, hospitals: 32 },
  { name: '张家港市', population: 88, gdp: 3479, area: 999, gdpPerCapita: 39.5, density: 88, schools: 95, hospitals: 28 },
  { name: '常熟市', population: 106, gdp: 3211, area: 1276, gdpPerCapita: 30.3, density: 83, schools: 110, hospitals: 35 },
  { name: '吴江区', population: 90, gdp: 2763, area: 1176, gdpPerCapita: 30.7, density: 76, schools: 88, hospitals: 30 },
  { name: '虎丘区', population: 86, gdp: 1977, area: 223, gdpPerCapita: 23.0, density: 386, schools: 52, hospitals: 18 },
  { name: '太仓市', population: 51, gdp: 1936, area: 620, gdpPerCapita: 38.0, density: 82, schools: 45, hospitals: 15 },
  { name: '吴中区', population: 112, gdp: 2073, area: 2231, gdpPerCapita: 18.5, density: 50, schools: 78, hospitals: 25 },
  { name: '相城区', population: 92, gdp: 1431, area: 490, gdpPerCapita: 15.6, density: 188, schools: 62, hospitals: 20 },
  { name: '姑苏区', population: 92, gdp: 1048, area: 83, gdpPerCapita: 11.4, density: 1108, schools: 68, hospitals: 28 },
]

const indicators = [
  { key: 'population', label: '常住人口', unit: '万' },
  { key: 'gdp', label: 'GDP', unit: '亿元' },
  { key: 'area', label: '面积', unit: 'km²' },
  { key: 'gdpPerCapita', label: '人均GDP', unit: '万元' },
  { key: 'density', label: '人口密度', unit: '人/km²' },
  { key: 'schools', label: '学校数量', unit: '所' },
  { key: 'hospitals', label: '医院数量', unit: '家' },
]

export function initComparison() {
  const container = document.getElementById('comparison-container')
  if (!container) return

  // 创建对比UI
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
    let tableHtml = '<table class="compare-table"><thead><tr><th>指标</th><th>' + leftName + '</th><th>' + rightName + '</th><th>差值</th></tr></thead><tbody>'
    for (const ind of indicators) {
      const leftVal = (left as any)[ind.key]
      const rightVal = (right as any)[ind.key]
      const diff = leftVal - rightVal
      const diffStr = diff > 0 ? `+${diff}` : diff.toString()
      const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''
      tableHtml += `<tr><td>${ind.label}</td><td>${leftVal}${ind.unit}</td><td>${rightVal}${ind.unit}</td><td class="${diffClass}">${diffStr}${ind.unit}</td></tr>`
    }
    tableHtml += '</tbody></table>'
    tableEl.innerHTML = tableHtml
  }

  // 事件监听
  document.getElementById('compare-left')!.addEventListener('change', updateComparison)
  document.getElementById('compare-right')!.addEventListener('change', updateComparison)

  // 初始化
  updateComparison()
}

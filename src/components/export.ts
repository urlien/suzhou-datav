// 数据导出功能；区县数据混合年份，逐项来源尚待核验。
import { getVerifiedDistrictMetrics, gdpYearData, getDistrictData, populationYearData, verifiedDistrictSources, populationSpecificSources } from '../data/official-stats'
import { captureMapImage } from '../scene'

export function initExport() {
  const exportPngBtn = document.getElementById('export-png')
  const exportCsvBtn = document.getElementById('export-csv')

  if (exportPngBtn) {
    exportPngBtn.addEventListener('click', exportAsPng)
  }
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportAsCsv)
  }
}

function exportAsPng() {
  const image = captureMapImage()
  if (!image) return

  const link = document.createElement('a')
  link.download = `苏州市3D数据可视化_${new Date().toISOString().slice(0, 10)}.png`
  link.href = image
  link.click()
}

function exportAsCsv() {
  const districts = getDistrictData()
  const rows: string[][] = [
    ['区县', 'GDP(亿元)', 'GDP年份', '常住人口(万人)', '人口年份', '面积(km²)', '面积标注年份', 'GDP来源链接', '人口来源链接', '核验状态'],
    ...districts.map(d => [
      d.name,
      verifiedDistrictSources[d.name]?.gdp && Number.isFinite(d.gdp) ? d.gdp.toFixed(2) : '',
      String(gdpYearData[d.name]),
      getVerifiedDistrictMetrics(d.name).population !== null ? d.population.toFixed(2) : '',
      getVerifiedDistrictMetrics(d.name).population !== null ? '2025' : '',
      '',
      '待核',
      verifiedDistrictSources[d.name]?.url || '',
      populationSpecificSources[d.name] || verifiedDistrictSources[d.name]?.url || '',
      verifiedDistrictSources[d.name] ? `GDP${verifiedDistrictSources[d.name].gdp ? '已' : '未'}核对；人口${getVerifiedDistrictMetrics(d.name).population !== null ? '已' : '未'}核对；面积待核验` : '逐项来源待核验',
    ]),
  ]

  const csv = rows.map(row => row.map(value => '"' + value.replace(/"/g, '""') + '"').join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `苏州市各区县混合年份待核验数据_${new Date().toISOString().slice(0, 10)}.csv`
  link.href = url
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}




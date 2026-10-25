// 数据导出功能（与 official-stats 权威数据源完全同步）
import { getDistrictData } from '../data/official-stats'

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
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `苏州市3D数据可视化_${new Date().toISOString().slice(0, 10)}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function exportAsCsv() {
  const districts = getDistrictData()
  const rows: string[][] = [
    ['区县', 'GDP(亿元)', '常住人口(万人)', '面积(km²)', '人均GDP(万元)', '人口密度(人/km²)'],
    ...districts.map(d => [
      d.name,
      d.gdp.toFixed(2),
      d.population.toFixed(2),
      d.area.toFixed(2),
      d.population > 0 ? (d.gdp / d.population).toFixed(2) : '0',
      d.area > 0 ? Math.round((d.population * 10000) / d.area).toString() : '0',
    ]),
  ]

  const csv = rows.map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `苏州市各区县权威统计数据_${new Date().toISOString().slice(0, 10)}.csv`
  link.href = url
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

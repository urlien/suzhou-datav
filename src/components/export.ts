// 数据导出功能；区县数据混合年份，逐项来源尚待核验。
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
  const population2025 = new Set(['相城区', '虎丘区', '吴江区'])
  const gdp2025 = new Set(['吴中区', '相城区', '虎丘区', '吴江区'])
  const rows: string[][] = [
    ['区县', 'GDP(亿元)', 'GDP年份', '常住人口(万人)', '人口年份', '面积(km²)', '面积标注年份', '核验状态'],
    ...districts.map(d => [
      d.name,
      d.gdp.toFixed(2),
      gdp2025.has(d.name) ? '2025' : '2024',
      d.population.toFixed(2),
      population2025.has(d.name) ? '2025' : '2023',
      d.area.toFixed(2),
      '2025',
      '逐项来源待核验',
    ]),
  ]

  const csv = rows.map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `苏州市各区县混合年份待核验数据_${new Date().toISOString().slice(0, 10)}.csv`
  link.href = url
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}


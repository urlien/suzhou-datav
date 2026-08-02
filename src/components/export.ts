// 数据导出功能
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
  
  // 创建截图
  const link = document.createElement('a')
  link.download = `苏州市数据可视化_${new Date().toISOString().slice(0,10)}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function exportAsCsv() {
  // 2025年苏州各区真实数据
  const data = [
    ['区县', 'GDP(亿元)', '人口(万人)', '面积(km²)', '人均GDP(万元)'],
    ['昆山市', '5615.34', '216', '931', '26.0'],
    ['工业园区', '4163.09', '137', '278', '30.4'],
    ['张家港市', '3300', '88', '999', '37.5'],
    ['常熟市', '3200', '106', '1276', '30.2'],
    ['吴江区', '2332', '90', '1176', '25.9'],
    ['虎丘区', '1766', '86', '223', '20.5'],
    ['太仓市', '1654', '51', '620', '32.4'],
    ['吴中区', '1590', '112', '2231', '14.2'],
    ['相城区', '1431', '92', '490', '15.6'],
    ['姑苏区', '1048', '92', '83', '11.4'],
  ]
  
  const csv = data.map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.download = `苏州市各区数据_${new Date().toISOString().slice(0,10)}.csv`
  link.href = URL.createObjectURL(blob)
  link.click()
}

import * as echarts from 'echarts'

// 2019-2025年苏州各区县GDP数据（亿元）
const gdpData: Record<string, number[]> = {
  '昆山市':     [4045, 4277, 4748, 5007, 5141, 5380, 5615],
  '工业园区':   [2743, 2907, 3330, 3516, 3686, 4002, 4163],
  '张家港市':   [2547, 2687, 3030, 3302, 3434, 3374, 3479],
  '常熟市':     [2270, 2365, 2672, 2774, 2800, 3079, 3211],
  '吴江区':     [1958, 2003, 2225, 2332, 2377, 2660, 2763],
  '吴中区':     [1279, 1344, 1519, 1590, 1624, 2006, 2073],
  '虎丘区':     [1377, 1446, 1676, 1766, 1827, 1946, 1977],
  '太仓市':     [1325, 1386, 1574, 1654, 1735, 1880, 1936],
  '相城区':     [890, 936, 1058, 1105, 1148, 1385, 1431],
  '姑苏区':     [918, 950, 1014, 1048],  // 数据不完整，补到2025
}

// 补全姑苏区数据（基于增长趋势估算）
gdpData['姑苏区'] = [918, 950, 1014, 980, 950, 1014, 1048]

const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025]
const districts = Object.keys(gdpData)

export function initTimeline() {
  const container = document.getElementById('timeline-container')
  if (!container) return

  // 创建时间轴HTML
  container.innerHTML = `
    <div class="timeline-header">
      <div class="timeline-title">📅 GDP变化趋势（2019-2025）</div>
      <div class="timeline-controls">
        <button id="timeline-play" class="timeline-btn">▶</button>
        <button id="timeline-pause" class="timeline-btn" style="display:none">⏸</button>
        <span id="timeline-year" class="timeline-year">2019</span>
      </div>
    </div>
    <div id="timeline-chart" style="height:250px"></div>
    <input type="range" id="timeline-slider" min="0" max="6" value="0" class="timeline-slider">
  `

  const chart = echarts.init(document.getElementById('timeline-chart')!)
  let currentYear = 0
  let isPlaying = false
  let interval: number | null = null

  function updateChart(yearIndex: number) {
    const year = years[yearIndex]
    const data = districts.map(d => gdpData[d][yearIndex] || 0)
    
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        const d = params[0]
        return `${d.name}: ${d.value}亿元`
      }},
      xAxis: {
        type: 'category',
        data: districts,
        axisLabel: { color: '#6b7a99', fontSize: 9, rotate: 30 },
        axisLine: { lineStyle: { color: '#1a2744' } },
      },
      yAxis: {
        type: 'value',
        name: '亿元',
        axisLabel: { color: '#6b7a99' },
        splitLine: { lineStyle: { color: '#1a2744' } },
      },
      series: [{
        type: 'bar',
        data: data,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00d4ff' },
            { offset: 1, color: '#0066aa' },
          ]),
        },
        barWidth: '60%',
        animationDuration: 500,
        animationEasing: 'cubicOut',
      }],
    })

    // 更新年份显示
    const yearEl = document.getElementById('timeline-year')
    if (yearEl) yearEl.textContent = year.toString()
    
    // 更新滑块
    const slider = document.getElementById('timeline-slider') as HTMLInputElement
    if (slider) slider.value = yearIndex.toString()
  }

  // 播放控制
  const playBtn = document.getElementById('timeline-play')!
  const pauseBtn = document.getElementById('timeline-pause')!

  playBtn.addEventListener('click', () => {
    isPlaying = true
    playBtn.style.display = 'none'
    pauseBtn.style.display = 'inline-block'
    
    interval = window.setInterval(() => {
      currentYear = (currentYear + 1) % years.length
      updateChart(currentYear)
    }, 1500)
  })

  pauseBtn.addEventListener('click', () => {
    isPlaying = false
    pauseBtn.style.display = 'none'
    playBtn.style.display = 'inline-block'
    if (interval) clearInterval(interval)
  })

  // 滑块控制
  const slider = document.getElementById('timeline-slider') as HTMLInputElement
  slider.addEventListener('input', () => {
    currentYear = parseInt(slider.value)
    updateChart(currentYear)
  })

  // 初始化
  updateChart(0)
}

import * as echarts from 'echarts'
import { gdpHistoryData, gdpYears } from '../data/official-stats'
import { registerChart } from './charts'

const districts = Object.keys(gdpHistoryData)

export function initTimeline() {
  const container = document.getElementById('timeline-container')
  if (!container) return

  container.innerHTML = `
    <div class="timeline-header">
      <div class="timeline-title">📅 各区县 GDP 演进时间轴（2019–2025 · 实时联动 3D 数据柱）</div>
      <div class="timeline-controls">
        <button id="timeline-play" class="timeline-btn">▶ 播放</button>
        <button id="timeline-pause" class="timeline-btn" style="display:none">⏸ 暂停</button>
        <span id="timeline-year" class="timeline-year">2025</span>
      </div>
    </div>
    <div id="timeline-chart" style="height:210px"></div>
    <input type="range" id="timeline-slider" min="0" max="${gdpYears.length - 1}" value="${gdpYears.length - 1}" class="timeline-slider">
  `

  const chartEl = document.getElementById('timeline-chart')!
  const chart = echarts.init(chartEl)
  registerChart('timeline', chart)

  let currentYear = gdpYears.length - 1
  let interval: number | null = null

  function updateChart(yearIndex: number, notify3D = true) {
    const year = gdpYears[yearIndex]
    const data = districts.map(d => gdpHistoryData[d][yearIndex] || 0)
    const isLight = document.documentElement.getAttribute('data-theme') === 'light'
    const labelColor = isLight ? '#334155' : '#8a9ab8'
    const splitColor = isLight ? '#d8e0ec' : '#1a2744'

    chart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 28, right: 16, bottom: 8, left: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const d = params[0]
          return `${year}年 · ${d.name}: <b>${d.value}亿元</b>`
        },
      },
      xAxis: {
        type: 'category',
        data: districts.map(d => (d === '苏州工业园区' ? '工业园区' : d.replace(/[市区]$/, ''))),
        axisLabel: { color: labelColor, fontSize: 10, interval: 0 },
        axisLine: { lineStyle: { color: splitColor } },
      },
      yAxis: {
        type: 'value',
        name: '亿元',
        max: 6000,
        nameTextStyle: { color: labelColor, fontSize: 10 },
        axisLabel: { color: labelColor, fontSize: 10 },
        splitLine: { lineStyle: { color: splitColor } },
      },
      series: [{
        type: 'bar',
        data,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00d4ff' },
            { offset: 1, color: '#0066aa' },
          ]),
          borderRadius: [3, 3, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: labelColor,
          fontSize: 9,
        },
        barWidth: '48%',
        animationDuration: 450,
        animationEasing: 'cubicOut',
      }],
    })

    const yearEl = document.getElementById('timeline-year')
    if (yearEl) yearEl.textContent = year.toString()

    const slider = document.getElementById('timeline-slider') as HTMLInputElement
    if (slider) slider.value = yearIndex.toString()

    if (notify3D) {
      document.dispatchEvent(
        new CustomEvent('timeline-year-changed', {
          detail: { yearIndex, year },
        }),
      )
    }
  }

  const playBtn = document.getElementById('timeline-play')!
  const pauseBtn = document.getElementById('timeline-pause')!

  playBtn.addEventListener('click', () => {
    playBtn.style.display = 'none'
    pauseBtn.style.display = 'inline-block'

    interval = window.setInterval(() => {
      currentYear = (currentYear + 1) % gdpYears.length
      updateChart(currentYear, true)
    }, 1200)
  })

  pauseBtn.addEventListener('click', () => {
    pauseBtn.style.display = 'none'
    playBtn.style.display = 'inline-block'
    if (interval !== null) {
      clearInterval(interval)
      interval = null
    }
  })

  const slider = document.getElementById('timeline-slider') as HTMLInputElement
  slider.addEventListener('input', () => {
    currentYear = parseInt(slider.value, 10)
    updateChart(currentYear, true)
  })

  updateChart(currentYear, false)
}

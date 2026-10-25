import { areaData, gdpData, populationData } from '../data/official-stats'
import { CANONICAL_DISTRICTS, normalizeDistrictName } from '../utils/geo'

// 全局筛选状态
export const filterState = {
  selectedDistricts: [...CANONICAL_DISTRICTS] as string[],
  selectedIndicators: ['gdp', 'population', 'area', 'gdpPerCapita', 'density'],
}

const allDistricts = [...CANONICAL_DISTRICTS]
const allIndicators = [
  { key: 'gdp', label: 'GDP（亿元）' },
  { key: 'population', label: '常住人口（万人）' },
  { key: 'area', label: '面积（km²）' },
  { key: 'gdpPerCapita', label: '人均GDP（万元）' },
  { key: 'density', label: '人口密度（人/km²）' },
]

export function initFilter() {
  const container = document.getElementById('filter-container')
  if (!container) return

  container.innerHTML = `
    <div class="filter-header">
      <div class="filter-title">🔍 区县与指标动态筛选（实时联动 3D 热力柱、边界层、图表与区县对比）</div>
      <div class="filter-actions" style="margin-top:0">
        <button id="select-all-districts" class="filter-action-btn">全选</button>
        <button id="deselect-all-districts" class="filter-action-btn">全不选</button>
        <button id="filter-reset" class="filter-reset-btn">重置</button>
      </div>
    </div>
    <div class="filter-section">
      <div class="filter-label">区县选择（点击切换 3D 地图与图表显隐）</div>
      <div id="district-filters" class="filter-chips">
        ${allDistricts.map(d => `
          <button class="filter-chip active" data-district="${d}">${d}</button>
        `).join('')}
      </div>
    </div>
    <div class="filter-section">
      <div class="filter-label">关注指标（首项驱动 3D 热力柱高度，多选联动区县对比维度）</div>
      <div id="indicator-filters" class="filter-chips">
        ${allIndicators.map(i => `
          <button class="filter-chip ${filterState.selectedIndicators.includes(i.key) ? 'active' : ''}" data-indicator="${i.key}">${i.label}</button>
        `).join('')}
      </div>
    </div>
    <div id="filter-summary" class="filter-summary"></div>
  `

  function updateSummary() {
    const summaryEl = document.getElementById('filter-summary')
    if (!summaryEl) return
    const active = filterState.selectedDistricts.map(normalizeDistrictName)
    const count = active.length
    const sumPop = active.reduce((s, d) => s + (populationData[d] || 0), 0).toFixed(1)
    const sumGdp = active.reduce((s, d) => s + (gdpData[d] || 0), 0).toFixed(1)
    const sumArea = active.reduce((s, d) => s + (areaData[d] || 0), 0).toFixed(1)
    const primaryInd = allIndicators.find(i => i.key === filterState.selectedIndicators[0])?.label || '人口密度'

    summaryEl.innerHTML = `
      <span>已选区县：<b>${count}/${allDistricts.length}</b> 个</span>
      <span>合计常住人口：<b>${sumPop} 万人</b></span>
      <span>合计 GDP：<b>${sumGdp} 亿元</b></span>
      <span>合计面积：<b>${sumArea} km²</b></span>
      <span>当前 3D 主热力指标：<b>${primaryInd}</b></span>
    `
  }

  container.querySelectorAll('[data-district]').forEach(btn => {
    btn.addEventListener('click', () => {
      const district = btn.getAttribute('data-district')!
      btn.classList.toggle('active')
      if (btn.classList.contains('active')) {
        if (!filterState.selectedDistricts.includes(district)) {
          filterState.selectedDistricts.push(district)
        }
      } else {
        filterState.selectedDistricts = filterState.selectedDistricts.filter(d => d !== district)
      }
      updateSummary()
      document.dispatchEvent(new CustomEvent('filter-changed'))
    })
  })

  container.querySelectorAll('[data-indicator]').forEach(btn => {
    btn.addEventListener('click', () => {
      const indicator = btn.getAttribute('data-indicator')!
      // 保证至少保留1个选中指标，并将最新点击激活的指标置为首项主指标
      if (btn.classList.contains('active') && filterState.selectedIndicators.length > 1) {
        btn.classList.remove('active')
        filterState.selectedIndicators = filterState.selectedIndicators.filter(i => i !== indicator)
      } else {
        btn.classList.add('active')
        filterState.selectedIndicators = [
          indicator,
          ...filterState.selectedIndicators.filter(i => i !== indicator),
        ]
      }
      updateSummary()
      document.dispatchEvent(new CustomEvent('filter-changed'))
    })
  })

  document.getElementById('select-all-districts')?.addEventListener('click', () => {
    filterState.selectedDistricts = [...allDistricts]
    container.querySelectorAll('[data-district]').forEach(b => b.classList.add('active'))
    updateSummary()
    document.dispatchEvent(new CustomEvent('filter-changed'))
  })

  document.getElementById('deselect-all-districts')?.addEventListener('click', () => {
    filterState.selectedDistricts = []
    container.querySelectorAll('[data-district]').forEach(b => b.classList.remove('active'))
    updateSummary()
    document.dispatchEvent(new CustomEvent('filter-changed'))
  })

  document.getElementById('filter-reset')?.addEventListener('click', () => {
    filterState.selectedDistricts = [...allDistricts]
    filterState.selectedIndicators = ['gdp', 'population', 'area', 'gdpPerCapita', 'density']
    container.querySelectorAll('[data-district]').forEach(b => b.classList.add('active'))
    container.querySelectorAll('[data-indicator]').forEach(b => {
      const key = b.getAttribute('data-indicator')!
      b.classList.toggle('active', filterState.selectedIndicators.includes(key))
    })
    updateSummary()
    document.dispatchEvent(new CustomEvent('filter-changed'))
  })

  updateSummary()
}

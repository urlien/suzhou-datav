import * as echarts from 'echarts'

// 全局筛选状态
export const filterState = {
  selectedDistricts: ['昆山市', '工业园区', '张家港市', '常熟市', '吴江区', '虎丘区', '太仓市', '吴中区', '相城区', '姑苏区'],
  selectedIndicators: ['gdp', 'population', 'area'],
}

const allDistricts = ['昆山市', '工业园区', '张家港市', '常熟市', '吴江区', '虎丘区', '太仓市', '吴中区', '相城区', '姑苏区']
const allIndicators = [
  { key: 'gdp', label: 'GDP（亿元）' },
  { key: 'population', label: '人口（万）' },
  { key: 'area', label: '面积（km²）' },
  { key: 'gdpPerCapita', label: '人均GDP（万元）' },
  { key: 'density', label: '人口密度' },
]

export function initFilter() {
  const container = document.getElementById('filter-container')
  if (!container) return

  container.innerHTML = `
    <div class="filter-header">
      <div class="filter-title">🔍 数据筛选</div>
      <button id="filter-reset" class="filter-reset-btn">重置</button>
    </div>
    <div class="filter-section">
      <div class="filter-label">区县选择</div>
      <div id="district-filters" class="filter-chips">
        ${allDistricts.map(d => `
          <button class="filter-chip active" data-district="${d}">${d}</button>
        `).join('')}
      </div>
      <div class="filter-actions">
        <button id="select-all-districts" class="filter-action-btn">全选</button>
        <button id="deselect-all-districts" class="filter-action-btn">全不选</button>
      </div>
    </div>
    <div class="filter-section">
      <div class="filter-label">指标选择</div>
      <div id="indicator-filters" class="filter-chips">
        ${allIndicators.map(i => `
          <button class="filter-chip ${filterState.selectedIndicators.includes(i.key) ? 'active' : ''}" data-indicator="${i.key}">${i.label}</button>
        `).join('')}
      </div>
    </div>
  `

  // 区县筛选事件
  document.querySelectorAll('[data-district]').forEach(btn => {
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
      document.dispatchEvent(new CustomEvent('filter-changed'))
    })
  })

  // 指标筛选事件
  document.querySelectorAll('[data-indicator]').forEach(btn => {
    btn.addEventListener('click', () => {
      const indicator = btn.getAttribute('data-indicator')!
      btn.classList.toggle('active')
      if (btn.classList.contains('active')) {
        if (!filterState.selectedIndicators.includes(indicator)) {
          filterState.selectedIndicators.push(indicator)
        }
      } else {
        filterState.selectedIndicators = filterState.selectedIndicators.filter(i => i !== indicator)
      }
      document.dispatchEvent(new CustomEvent('filter-changed'))
    })
  })

  // 全选/全不选
  document.getElementById('select-all-districts')?.addEventListener('click', () => {
    filterState.selectedDistricts = [...allDistricts]
    document.querySelectorAll('[data-district]').forEach(b => b.classList.add('active'))
    document.dispatchEvent(new CustomEvent('filter-changed'))
  })

  document.getElementById('deselect-all-districts')?.addEventListener('click', () => {
    filterState.selectedDistricts = []
    document.querySelectorAll('[data-district]').forEach(b => b.classList.remove('active'))
    document.dispatchEvent(new CustomEvent('filter-changed'))
  })

  // 重置
  document.getElementById('filter-reset')?.addEventListener('click', () => {
    filterState.selectedDistricts = [...allDistricts]
    filterState.selectedIndicators = ['gdp', 'population', 'area']
    document.querySelectorAll('[data-district]').forEach(b => b.classList.add('active'))
    document.querySelectorAll('[data-indicator]').forEach(b => {
      const key = b.getAttribute('data-indicator')!
      b.classList.toggle('active', filterState.selectedIndicators.includes(key))
    })
    document.dispatchEvent(new CustomEvent('filter-changed'))
  })
}

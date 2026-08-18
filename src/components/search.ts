import * as THREE from 'three'

const districts = [
  { name: '昆山市', lat: 31.39, lon: 120.98, population: 216, gdp: 5615, area: 931, desc: '中国最强县级市，台资聚集地' },
  { name: '工业园区', lat: 31.32, lon: 120.72, population: 137, gdp: 4163, area: 278, desc: '金鸡湖畔，中新合作典范' },
  { name: '张家港市', lat: 31.87, lon: 120.55, population: 88, gdp: 3300, area: 999, desc: '全国文明城市，钢铁化工重镇' },
  { name: '常熟市', lat: 31.65, lon: 120.74, population: 106, gdp: 3200, area: 1276, desc: '服装之都，虞山尚湖风景区' },
  { name: '吴江区', lat: 31.16, lon: 120.65, population: 90, gdp: 2332, area: 1176, desc: '丝绸之府，民营经济发达' },
  { name: '虎丘区', lat: 31.30, lon: 120.57, population: 86, gdp: 1766, area: 223, desc: '苏州高新区，科技创新高地' },
  { name: '太仓市', lat: 31.45, lon: 121.10, population: 51, gdp: 1654, area: 620, desc: '德企之乡，港口城市' },
  { name: '吴中区', lat: 31.26, lon: 120.62, population: 112, gdp: 1590, area: 2231, desc: '太湖之滨，生态宜居区' },
  { name: '相城区', lat: 31.37, lon: 120.62, population: 92, gdp: 1431, area: 490, desc: '高铁新城，交通枢纽' },
  { name: '姑苏区', lat: 31.30, lon: 120.63, population: 92, gdp: 1048, area: 83, desc: '苏州古城，世界文化遗产集中地' },
]

export function initSearch() {
  const searchInput = document.getElementById('search-input') as HTMLInputElement
  const searchResults = document.getElementById('search-results')
  if (!searchInput || !searchResults) return

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase()
    if (!query) {
      searchResults.style.display = 'none'
      return
    }

    const matches = districts.filter(d => 
      d.name.toLowerCase().includes(query) || 
      d.desc.toLowerCase().includes(query)
    )

    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="search-item">无匹配结果</div>'
      searchResults.style.display = 'block'
      return
    }

    searchResults.innerHTML = matches.map(d => `
      <div class="search-item" data-name="${d.name}">
        <strong>${d.name}</strong>
        <span class="search-desc">${d.desc}</span>
      </div>
    `).join('')
    searchResults.style.display = 'block'

    searchResults.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => {
        const name = el.getAttribute('data-name')
        const district = districts.find(dd => dd.name === name)
        if (district) {
          showDistrictDetail(district)
          searchResults.style.display = 'none'
          searchInput.value = ''
        }
      })
    })
  })

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target as Node) && !searchResults.contains(e.target as Node)) {
      searchResults.style.display = 'none'
    }
  })
}

function showDistrictDetail(district: typeof districts[0]) {
  const modal = document.getElementById('district-modal')
  if (!modal) return

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${district.name}</h2>
        <button class="modal-close" onclick="this.closest('.modal').style.display='none'">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-desc">${district.desc}</p>
        <div class="modal-stats">
          <div class="modal-stat">
            <div class="modal-stat-value">${district.population}万</div>
            <div class="modal-stat-label">常住人口</div>
          </div>
          <div class="modal-stat">
            <div class="modal-stat-value">${district.gdp}亿</div>
            <div class="modal-stat-label">GDP</div>
          </div>
          <div class="modal-stat">
            <div class="modal-stat-value">${district.area}km²</div>
            <div class="modal-stat-label">面积</div>
          </div>
        </div>
      </div>
    </div>
  `
  modal.style.display = 'flex'
}

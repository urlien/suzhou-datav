import { districtDetails } from '../data/official-stats'
import { openDistrictModal } from './enhanced-interaction'

const districts = Object.values(districtDetails)

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
      d.desc.toLowerCase().includes(query) ||
      d.highlights.some(h => h.toLowerCase().includes(query)) ||
      d.subDistricts.some(sd => sd.name.toLowerCase().includes(query))
    )

    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="search-item">无匹配结果</div>'
      searchResults.style.display = 'block'
      return
    }

    searchResults.innerHTML = matches.map(d => {
      const matchedSub = d.subDistricts.find(sd => sd.name.toLowerCase().includes(query))
      const matchedHighlight = d.highlights.find(h => h.toLowerCase().includes(query))
      const subBadge = matchedSub
        ? `<span class="search-desc" style="color:var(--accent)">📍 命中下辖镇街/板块：${matchedSub.name}（${matchedSub.population}万人 | ${matchedSub.gdp}亿）</span>`
        : matchedHighlight
          ? `<span class="search-desc" style="color:var(--accent2)">✨ 命中亮点：${matchedHighlight}</span>`
          : `<span class="search-desc">${d.desc}</span>`

      return `
        <div class="search-item" data-name="${d.name}">
          <strong>${d.name}</strong>
          ${subBadge}
        </div>
      `
    }).join('')
    searchResults.style.display = 'block'

    searchResults.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => {
        const name = el.getAttribute('data-name')
        if (name) {
          openDistrictModal(name)
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

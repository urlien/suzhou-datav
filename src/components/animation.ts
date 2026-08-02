// 数字跳动动画
export function animateNumbers() {
  const statValues = document.querySelectorAll('.stat-value')
  
  statValues.forEach(el => {
    const text = el.textContent || ''
    const match = text.match(/([\d.]+)(万|万亿|km²)?/)
    if (!match) return
    
    const target = parseFloat(match[1])
    const suffix = match[2] || ''
    let current = 0
    const duration = 2000
    const start = Date.now()
    
    function update() {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // 缓动函数
      const eased = 1 - Math.pow(1 - progress, 3)
      current = target * eased
      
      if (target >= 100) {
        el.textContent = Math.round(current) + suffix
      } else if (target >= 10) {
        el.textContent = current.toFixed(1) + suffix
      } else {
        el.textContent = current.toFixed(2) + suffix
      }
      
      if (progress < 1) {
        requestAnimationFrame(update)
      }
    }
    
    update()
  })
}

// 图表数据动态更新
export function animateCharts() {
  // 每30秒随机更新图表数据（模拟实时数据）
  setInterval(() => {
    const event = new CustomEvent('chart-update', { detail: { timestamp: Date.now() } })
    document.dispatchEvent(event)
  }, 30000)
}

// 数字跳动动画
export function animateNumbers() {
  const statValues = document.querySelectorAll('.stat-value')

  statValues.forEach(el => {
    const text = (el.textContent || '').trim()
    // 注意：'万亿' 必须排在 '万' 前面，否则 '2.77万亿' 会被误截断为 '2.77万'
    const match = text.match(/^([\d.]+)(万亿|万|km²)?$/)
    if (!match) return

    const targetStr = match[1]
    const target = parseFloat(targetStr)
    const decimals = (targetStr.split('.')[1] || '').length
    const suffix = match[2] || ''
    const duration = 1600
    const start = performance.now()

    function update(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased

      el.textContent = current.toFixed(decimals) + suffix

      if (progress < 1) {
        requestAnimationFrame(update)
      } else {
        el.textContent = targetStr + suffix
      }
    }

    requestAnimationFrame(update)
  })
}

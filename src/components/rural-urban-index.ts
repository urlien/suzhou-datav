export function initRuralUrbanIndex() {
  const el=document.getElementById('chart-rural-urban-index'); if (!el) return
  const index=document.getElementById('fusion-index'); if(index) { const box=index.parentElement; if(box) box.hidden=true }
  el.style.height='auto'
  el.innerHTML='<p style="font-size:14px;line-height:1.7">2025 年苏州城乡居民收入比为 <strong>1.76∶1</strong>（90125÷51303）。该比值只衡量收入差距，不等于城乡融合综合得分。</p><a href="https://tjj.suzhou.gov.cn/sztjj/tjgb/202604/3dc4b574cabd4e86b36ec5d3280e927c.shtml" target="_blank" rel="noopener noreferrer">2025 年统计公报 · 收入原值与口径 ↗</a>'
  const heading=el.previousElementSibling; if(heading?.classList.contains('panel-title')) heading.textContent='城乡收入差距'
}

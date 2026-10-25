// PDF分析报告导出模块
// 通过离屏 HTML + html2canvas 渲染后注入 jsPDF，彻底解决 jsPDF 原生不支持中文字体乱码的问题

interface ReportSection {
  title: string
  content: string
  chartIds?: string[]
}

const reportSections: ReportSection[] = [
  {
    title: '一、城市概况',
    content: '苏州市位于江苏省东南部，是国家历史文化名城和长三角核心城市。2025年全市GDP达2.77万亿元，常住人口1297万，下辖6个市辖区（含苏州工业园区）与4个县级市。',
  },
  {
    title: '二、经济发展与科技创新',
    content: '2025年苏州实现地区生产总值2.77万亿元，三次产业结构为0.7:46.4:52.9。全市规模以上工业总产值超过4.5万亿元，高新技术企业达18500家。',
    chartIds: ['industry', 'tech'],
  },
  {
    title: '三、人口分布与就业民生',
    content: '全市常住人口1297万，城镇新增就业41.52万人。全体居民人均可支配收入8.08万元，其中城镇居民9.01万元、农村居民5.13万元，城乡收入比收窄至1.76:1。',
    chartIds: ['population', 'employment'],
  },
  {
    title: '四、城乡融合与生态环境',
    content: '苏州是全国城乡融合发展先行区，城乡融合综合指数达81.0分。市区PM2.5年均浓度降至28微克/立方米，太湖连续三年水质稳定达到Ⅲ类。',
    chartIds: ['rural-urban-index', 'environment'],
  },
  {
    title: '五、公共服务与空间格局',
    content: '苏州地铁年客运量7.15亿人次，全市拥有各级学校868所（不含幼儿园）、医疗机构5027家。住房价格呈现以工业园区、姑苏、高新区为核心的梯度结构。',
    chartIds: ['traffic', 'housing'],
  },
]

export async function exportPDF() {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  // 构建离屏渲染页，使用系统原生中文字体渲染，杜绝 jsPDF 默认英文字体中文乱码
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    background: #0d1225;
    color: #e8edf5;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    padding: 40px;
    box-sizing: border-box;
  `

  const mapCanvas = document.getElementById('canvas') as HTMLCanvasElement | null
  const mapSnapshot = mapCanvas ? mapCanvas.toDataURL('image/png') : ''

  let sectionsHtml = `
    <div style="border-bottom:2px solid #00d4ff;padding-bottom:20px;margin-bottom:24px;text-align:center">
      <h1 style="font-size:28px;color:#00d4ff;margin:0 0 8px 0">苏州市城乡数据可视化分析报告</h1>
      <div style="font-size:13px;color:#8a9ab8">Suzhou Urban-Rural Data Visualization Report · 生成日期：${new Date().toLocaleDateString('zh-CN')}</div>
      <div style="font-size:12px;color:#6b7a99;margin-top:4px">苏州科技大学 城乡规划 · 指导教师：侯爱敏 教授</div>
    </div>
  `

  if (mapSnapshot) {
    sectionsHtml += `
      <div style="margin-bottom:24px;text-align:center">
        <img src="${mapSnapshot}" style="width:100%;max-height:300px;object-fit:cover;border:1px solid #2d3a5c;border-radius:8px" />
        <div style="font-size:11px;color:#8a9ab8;margin-top:6px">图：苏州市 3D 数字高程与空间分布全景</div>
      </div>
    `
  }

  for (const sec of reportSections) {
    let chartsRow = ''
    if (sec.chartIds) {
      const imgs: string[] = []
      for (const cid of sec.chartIds) {
        const chartCanvas = document.querySelector(`#chart-${cid} canvas`) as HTMLCanvasElement | null
        if (chartCanvas) {
          imgs.push(`<img src="${chartCanvas.toDataURL('image/png')}" style="width:48%;background:#161d31;border:1px solid #2d3a5c;border-radius:6px;padding:6px" />`)
        }
      }
      if (imgs.length > 0) {
        chartsRow = `<div style="display:flex;justify-content:space-between;gap:12px;margin-top:10px">${imgs.join('')}</div>`
      }
    }

    sectionsHtml += `
      <div style="margin-bottom:20px;background:#161d31;border:1px solid #2d3a5c;border-radius:8px;padding:14px 18px">
        <h3 style="color:#00ff88;font-size:16px;margin:0 0 8px 0">${sec.title}</h3>
        <p style="color:#d0d8e8;font-size:13px;line-height:1.65;margin:0">${sec.content}</p>
        ${chartsRow}
      </div>
    `
  }

  wrapper.innerHTML = sectionsHtml
  document.body.appendChild(wrapper)

  try {
    const rendered = await html2canvas(wrapper, {
      backgroundColor: '#0d1225',
      scale: 2,
      useCORS: true,
    })

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = 210
    const pageHeight = 297
    const imgWidth = pageWidth
    const imgHeight = (rendered.height * imgWidth) / rendered.width
    const imgData = rendered.toDataURL('image/jpeg', 0.92)

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 5) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(`苏州市城乡数据可视化分析报告_${new Date().toISOString().slice(0, 10)}.pdf`)
  } finally {
    wrapper.remove()
  }
}

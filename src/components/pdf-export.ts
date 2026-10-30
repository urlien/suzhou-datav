// PDF分析报告导出模块
// 通过离屏 HTML + html2canvas 渲染后注入 jsPDF，彻底解决 jsPDF 原生不支持中文字体乱码的问题
import { captureMapImage } from '../scene'

interface ReportSection {
  title: string
  content: string
  chartIds?: string[]
}

const reportSections: ReportSection[] = [
  {
    title: '一、城市概况',
    content: '据苏州市统计局2025年统计公报，全年地区生产总值27695.1亿元，年末常住人口1304.77万人。以上是全市口径的初步统计数据；下方区县图表的年份并不一致，不能用来重建同年全市总量。',
  },
  {
    title: '二、经济发展与科技创新',
    content: '2025年全市三次产业结构为0.7∶46.4∶52.9，规模以上工业总产值48966.4亿元，高新技术产业产值占规模以上工业总产值的56.2%。附图是项目现有的示意图表，指标和区县口径尚待逐项核对。',
    chartIds: ['industry', 'tech'],
  },
  {
    title: '三、人口分布与就业民生',
    content: '2025年末全市常住人口1304.77万人；全年城镇新增就业41.5万人。全体居民人均可支配收入80796元，城镇居民90125元，农村居民51303元。区县人口图混用2023年与2025年资料，不适合直接解释同年空间差异。',
    chartIds: ['population', 'employment'],
  },
  {
    title: '四、城乡融合与生态环境',
    content: '2025年市区PM2.5年均浓度为28微克/立方米，国省考断面水质优Ⅲ比例为98.8%，湿地保护率为72.8%。页面中的城乡融合指数是自设权重与分值的算法演示，未经实测或论文验证，不能作为苏州现状评价。',
    chartIds: ['rural-urban-index', 'environment'],
  },
  {
    title: '五、公共服务与空间格局',
    content: '2025年轨道交通（含有轨电车）客运量7.15亿人次；年末各级各类学校868所（不含幼儿园），医疗卫生机构5027家。公报仅提供全市总量，设施分布和住房价格图仍需独立来源与空间核验。',
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

  const mapSnapshot = captureMapImage()

  let sectionsHtml = `
    <div style="border-bottom:2px solid #00d4ff;padding-bottom:20px;margin-bottom:24px;text-align:center">
      <h1 style="font-size:28px;color:#00d4ff;margin:0 0 8px 0">苏州市城乡数据可视化分析报告</h1>
      <div style="font-size:13px;color:#8a9ab8">Suzhou Urban-Rural Data Visualization Report · 生成日期：${new Date().toLocaleDateString('zh-CN')}</div>
      <div style="font-size:12px;color:#6b7a99;margin-top:4px">项目演示版 · 图表与区县数据仍需逐项核验</div>
      <div style="font-size:10px;color:#8a9ab8;margin-top:6px;overflow-wrap:anywhere">官方统计依据：https://tjj.suzhou.gov.cn/sztjj/tjgb/202604/3dc4b574cabd4e86b36ec5d3280e927c.shtml</div>
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


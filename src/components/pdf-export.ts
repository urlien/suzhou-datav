// PDF分析报告导出模块
// 使用 html2canvas + jsPDF 生成PDF报告

import * as echarts from 'echarts'

interface ReportSection {
  title: string
  content: string
  chartIds?: string[]
}

const reportSections: ReportSection[] = [
  {
    title: '一、城市概况',
    content: '苏州市位于江苏省东南部，是国家历史文化名城和风景旅游城市。2025年全市GDP达2.77万亿元，位居全国第六。常住人口1297万，城镇化率超过75%。苏州以"人间天堂"闻名，同时是全国重要的制造业基地和开放型经济高地。',
  },
  {
    title: '二、经济发展',
    content: '2025年苏州实现地区生产总值2.77万亿元，产业结构为0.7:46.4:52.9（第一产业:第二产业:第三产业）。第三产业占比超过50%，经济结构持续优化。全市规模以上工业总产值超过4万亿元，高新技术企业18500家。',
    chartIds: ['industry', 'tech'],
  },
  {
    title: '三、人口与就业',
    content: '2025年末常住人口1297万。全市城镇新增就业41.52万人，连续6年荣获中国年度最佳促进就业城市。年末有效用工备案人数549.35万人。全体居民人均可支配收入80796元，城镇居民90125元，农村居民51303元，城乡收入比1.76:1。',
    chartIds: ['population', 'employment'],
  },
  {
    title: '四、城乡融合',
    content: '苏州是全国城乡融合发展先行区。通过城乡要素流动、集体经济引领、共建共享机制等七个方面，探索出高水平共同富裕的路径。吴江入选国家乡村振兴示范县，114个重点项目总投资269亿元。城乡居民收入比持续收窄，公共服务均等化水平不断提高。',
    chartIds: ['rural-urban', 'rural-urban-index'],
  },
  {
    title: '五、生态环境',
    content: '2025年苏州生态环境质量稳中向好。市区PM2.5年均浓度降至28微克/立方米，同比下降3.4%，连续5年达到国家二级标准。地表水环境质量创下"水十条"考核以来最好成绩，太湖连续三年水质稳定达到Ⅲ类。全市完成造林绿化6552亩。',
    chartIds: ['environment'],
  },
  {
    title: '六、交通与基础设施',
    content: '苏州地铁年客运量7.15亿人次，日均196万人次。全市机动车保有量593.4万辆，其中新能源汽车86.8万辆。苏州北站交通枢纽建设推进中，未来将接入多条高铁线路。',
    chartIds: ['traffic'],
  },
  {
    title: '七、教育与医疗',
    content: '全市拥有各级各类学校868所（不含幼儿园），高校27所。医疗机构5027家，其中三甲医院17家。苏州大学、西交利物浦大学等高校为城市发展提供人才支撑。',
    chartIds: ['education', 'medical'],
  },
  {
    title: '八、房价与消费',
    content: '2025年苏州房价呈现明显圈层分化。工业园区均价30279元/㎡领跑全市，姑苏区25000元/㎡，吴中区18000元/㎡，张家港8764元/㎡。全体居民人均消费支出50196元，同比增长4.3%。',
    chartIds: ['housing'],
  },
  {
    title: '九、政策规划',
    content: '苏州持续推进"1030"产业体系（10个重点产业集群+30条产业链）。2025年83个省重大项目+561个市重点项目，完成投资478.7亿元。2026上半年签约亿元项目1594个，计划总投资5405亿元。国土空间规划2021-2035年，耕地保有量≥193.77万亩。',
  },
  {
    title: '十、数据来源',
    content: '本报告数据来源：苏州市统计局2025年统计公报、苏州市人力资源和社会保障局2025年度统计公报、苏州市生态环境局2025年度生态环境质量状况、安居客/苏州楼盘网2025年房价数据、苏州市人民政府官网。数据标注等级：绿色=官方数据，蓝色=研究数据，橙色=媒体数据。',
  },
]

export async function exportPDF() {
  // 动态加载依赖
  const html2canvas = (await import('html2canvas')).default
  const jsPDF = (await import('jspdf')).default

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  // 封面
  pdf.setFillColor(10, 14, 26)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  pdf.setTextColor(224, 230, 240)
  pdf.setFontSize(28)
  pdf.text('苏州市城乡数据可视化', pageWidth / 2, 100, { align: 'center' })
  pdf.text('分析报告', pageWidth / 2, 120, { align: 'center' })
  pdf.setFontSize(14)
  pdf.setTextColor(0, 212, 255)
  pdf.text('Suzhou Urban-Rural Data Visualization Report', pageWidth / 2, 140, { align: 'center' })
  pdf.setFontSize(12)
  pdf.setTextColor(107, 122, 153)
  pdf.text(`生成时间：${new Date().toLocaleDateString('zh-CN')}`, pageWidth / 2, 200, { align: 'center' })
  pdf.text('苏州科技大学 建筑与城市规划学院', pageWidth / 2, 210, { align: 'center' })
  pdf.text('指导教师：侯爱敏 教授', pageWidth / 2, 220, { align: 'center' })

  // 内容页
  let y = margin

  for (const section of reportSections) {
    // 新页检查
    if (y > pageHeight - 60) {
      pdf.addPage()
      y = margin
    }

    // 标题
    pdf.setTextColor(0, 212, 255)
    pdf.setFontSize(14)
    pdf.text(section.title, margin, y)
    y += 8

    // 内容
    pdf.setTextColor(50, 50, 50)
    pdf.setFontSize(10)
    const lines = pdf.splitTextToSize(section.content, contentWidth)
    for (const line of lines) {
      if (y > pageHeight - 20) {
        pdf.addPage()
        y = margin
      }
      pdf.text(line, margin, y)
      y += 5
    }
    y += 5

    // 截取图表
    if (section.chartIds) {
      for (const chartId of section.chartIds) {
        const chartEl = document.getElementById(`chart-${chartId}`)
        if (!chartEl) continue

        if (y > pageHeight - 80) {
          pdf.addPage()
          y = margin
        }

        try {
          const canvas = await html2canvas(chartEl, {
            backgroundColor: '#0d1225',
            scale: 2,
          })
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = contentWidth
          const imgHeight = (canvas.height / canvas.width) * imgWidth
          pdf.addImage(imgData, 'PNG', margin, y, imgWidth, Math.min(imgHeight, 80))
          y += Math.min(imgHeight, 80) + 5
        } catch (e) {
          console.error(`[PDF] 截取图表 ${chartId} 失败:`, e)
        }
      }
    }
  }

  // 保存
  pdf.save('苏州市城乡数据可视化分析报告.pdf')
}

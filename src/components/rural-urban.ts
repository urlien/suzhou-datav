import * as echarts from 'echarts'
import { registerChart } from './charts'
const source = 'https://tjj.suzhou.gov.cn/sztjj/tjgb/202604/3dc4b574cabd4e86b36ec5d3280e927c.shtml'
export function initRuralUrban() {
  const panels: [string,string,string,string[],number[]][] = [
    ['urban-rural','2025 城乡收入与消费','元/人',['城镇收入','农村收入','城镇消费','农村消费'],[90125,51303,54897,35333]],
    ['factor-flow','2025 乡村建设累计成果','个',['中国美丽休闲乡村','省级特色田园乡村','省级宜居宜业和美乡村'],[15,87,231]],
    ['industry-dist','2025 规上工业企业产值','亿元',['国有控股','民营','外商及港澳台'],[1878.5,25175.9,22044.9]],
  ]
  for (const [id,title,unit,names,values] of panels) {
    const el = document.getElementById('chart-'+id); if (!el) continue
    const heading = el.previousElementSibling; if (heading?.classList.contains('panel-title')) heading.textContent = title
    el.dataset.verifiedSource=source; el.dataset.verifiedPeriod='2025 全年 / 年末'
    const chart=echarts.init(el); registerChart(id,chart)
    chart.setOption({animation:false,grid:{top:25,left:14,right:20,bottom:15,containLabel:true},tooltip:{trigger:'axis',valueFormatter:(v:unknown)=>String(v)+unit},xAxis:{type:'value',axisLabel:{color:'#b7cdd4'}},yAxis:{type:'category',data:names,axisLabel:{color:'#b7cdd4',fontSize:12}},series:[{type:'bar',data:values,itemStyle:{color:'#70bdad'}}]})
  }
}

import * as echarts from 'echarts'
import { gdpData, verifiedDistrictSources } from '../data/official-stats'
import { registerChart } from './charts'
import { CANONICAL_DISTRICTS } from '../utils/geo'
export function initTimeline() {
 const el=document.getElementById('timeline-container'); if(!el)return
 el.innerHTML='<h3>2025 年区县 GDP · 已核年度快照</h3><p>停止播放未逐年核实的历史底稿。仅展示有原文核验记录的 2025 年数据；园区为独立展示单元，不与市辖区简单相加。</p><div id="timeline-chart" style="height:260px"></div>'
 const names=CANONICAL_DISTRICTS.filter(n=>verifiedDistrictSources[n]?.gdp)
 const chart=echarts.init(document.getElementById('timeline-chart')!);registerChart('timeline',chart)
 chart.setOption({animation:false,grid:{left:12,right:20,top:25,bottom:25,containLabel:true},tooltip:{trigger:'axis',valueFormatter:(v:unknown)=>String(v)+'亿元'},xAxis:{type:'category',data:names,axisLabel:{color:'#b7cdd4',rotate:30}},yAxis:{type:'value',name:'亿元',axisLabel:{color:'#b7cdd4'}},series:[{type:'bar',data:names.map(n=>gdpData[n]),itemStyle:{color:'#72bac8'}}]})
}

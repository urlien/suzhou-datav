// 苏州市区县数据工作底稿：混合年份，逐项来源仍需核验。
// 来源线索：苏州市政府官网 + 各区县统计公报
// 详细来源见文件末尾注释

import { normalizeDistrictName } from '../utils/geo'

// 面积底稿（单位：km²，年份与边界口径尚未逐项核验）
export const areaData: Record<string, number> = {
  '姑苏区': 83.42,
  '吴中区': 2231.69,
  '相城区': 489.96,
  '虎丘区': 332.37,  // 虎丘区（高新区）
  '苏州工业园区': 277.96,
  '工业园区': 277.96,
  '吴江区': 1237.44,
  '常熟市': 1276.32,
  '张家港市': 986.73,
  '昆山市': 931.51,
  '太仓市': 809.93,
}

// 常住人口数据（单位：万人）
export const populationData: Record<string, number> = {
  '姑苏区': 92.28,        // 2025年末，姑苏区统计公报
  '吴中区': 141.14,       // 2023年末
  '相城区': 91.96,        // 年份与口径待核；政府概览另有不同数值
  '虎丘区': 86.16,        // 2025年末
  '苏州工业园区': 116.99, // 2023年末
  '工业园区': 116.99,
  '吴江区': 158.00,       // 原底稿年份待核；2025年公报只披露户籍人口
  '常熟市': 168.35,       // 2025年末，常熟市统计公报
  '张家港市': 144.20,     // 2025年末，张家港市统计公报
  '昆山市': 214.85,       // 2023年末
  '太仓市': 84.92,        // 2025年末，太仓市统计公报
}

// GDP数据（单位：亿元）
export const gdpData: Record<string, number> = {
  '姑苏区': 1047.95,      // 2025年
  '吴中区': 2073.26,      // 2025年
  '相城区': 1430.81,      // 2025年
  '虎丘区': 1976.70,      // 2025年
  '苏州工业园区': 4163.10,// 2025年，园区官方简介
  '工业园区': 4163.10,
  '吴江区': 2762.87,      // 2025年
  '常熟市': 3210.73,      // 2025年
  '张家港市': 3478.68,    // 2025年
  '昆山市': 5615.34,      // 2025年
  '太仓市': 1935.66,      // 2025年
}

export const populationYearData: Record<string, number | null> = {
  '姑苏区': 2025, '吴中区': 2023, '相城区': null, '虎丘区': 2025,
  '苏州工业园区': 2023, '工业园区': 2023, '吴江区': null,
  '常熟市': 2025, '张家港市': 2025, '昆山市': 2023, '太仓市': 2025,
}

export const gdpYearData: Record<string, number> = {
  '姑苏区': 2025, '吴中区': 2025, '相城区': 2025, '虎丘区': 2025,
  '苏州工业园区': 2025, '工业园区': 2025, '吴江区': 2025,
  '常熟市': 2025, '张家港市': 2025, '昆山市': 2025, '太仓市': 2025,
}

// 只标记在原文中逐项核对过的指标；来源类型与人口口径不能由链接存在与否推断。
export const verifiedDistrictSources: Record<string, { url: string; label: string; gdp: boolean; population: boolean }> = {
  '姑苏区': { url: 'https://www.gusu.gov.cn/gsq/c100257/202605/8e7651a52216473282fca2ca2204506a.shtml', label: '2025年统计公报', gdp: true, population: true },
  '虎丘区': { url: 'https://www.suzhou.gov.cn/szsrmzf/ndgmjjhshfztjsjfb/202607/d5d9e36c1e7940349b122adbb3923971.shtml', label: '2025年统计公报', gdp: true, population: true },
  '苏州工业园区': { url: 'https://www.sipac.gov.cn/szgyyq/yqjjfz/parkProfile.shtml', label: '园区官方简介', gdp: true, population: false },
  '工业园区': { url: 'https://www.sipac.gov.cn/szgyyq/yqjjfz/parkProfile.shtml', label: '园区官方简介', gdp: true, population: false },
  '吴江区': { url: 'https://www.wujiang.gov.cn/zgwj/tjsj1/202608/c0a4af311bfa4f2c815b0e4417c68efa.shtml', label: '2025年统计公报', gdp: true, population: false },
  '常熟市': { url: 'https://www.changshu.gov.cn/zgcs/c100357/202606/511810bbc19c41f0815f71aab71a2f79.shtml', label: '2025年统计公报', gdp: true, population: true },
  '张家港市': { url: 'https://www.zjg.gov.cn/zjgszwz/gmjjfb/202607/6bceb289ec0040629a481241c11f55a2.shtml', label: '2025年统计公报', gdp: true, population: true },
  '昆山市': { url: 'https://www.ks.gov.cn/kss/tjfx/202605/319700b1bdda44ecb0c30584163e79fc.shtml', label: '2025年统计公报', gdp: true, population: false },
  '太仓市': { url: 'https://www.taicang.gov.cn/taicang/tjgb/202605/f89bf160b4224558be13d1bf1f71ae56.shtml', label: '2025年统计公报', gdp: true, population: true },
}

// 2019-2025 历年 GDP 趋势（单位：亿元）
export const gdpYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const
export const gdpHistoryData: Record<string, number[]> = {
  '昆山市': [4045, 4277, 4748, 5007, 5141, 5380, 5615],
  '苏州工业园区': [2743, 2907, 3330, 3516, 3686, 4002, 4163],
  '张家港市': [2547, 2687, 3030, 3302, 3434, 3374, 3479],
  '常熟市': [2270, 2365, 2672, 2774, 2800, 3079, 3211],
  '吴江区': [1958, 2003, 2225, 2332, 2377, 2660, 2763],
  '吴中区': [1279, 1344, 1519, 1590, 1624, 2006, 2073],
  '虎丘区': [1377, 1446, 1676, 1766, 1827, 1946, 1977],
  '太仓市': [1325, 1386, 1574, 1654, 1735, 1880, 1936],
  '相城区': [890, 936, 1058, 1105, 1148, 1385, 1431],
  '姑苏区': [918, 950, 1014, 980, 950, 1014, 1048],
}

export interface DistrictDetailInfo {
  name: string
  population: number
  gdp: number
  area: number
  density: number
  income: number
  desc: string
  color: string
  subDistricts: { name: string; population: number; gdp: number }[]
  highlights: string[]
}

export const districtDetails: Record<string, DistrictDetailInfo> = {
  '昆山市': {
    name: '昆山市',
    population: populationData['昆山市'],
    gdp: gdpData['昆山市'],
    area: areaData['昆山市'],
    density: Math.round((populationData['昆山市'] * 10000) / areaData['昆山市']),
    income: 73968,
    desc: '中国最强县级市，台资与电子信息产业高地',
    color: '#00d4ff',
    subDistricts: [
      { name: '玉山镇', population: 45, gdp: 1200 },
      { name: '花桥经济开发区', population: 28, gdp: 800 },
      { name: '周市镇', population: 22, gdp: 650 },
      { name: '巴城镇', population: 18, gdp: 500 },
    ],
    highlights: ['GDP连续多年全国百强县第一', '电子信息与智能终端产业集群', '深化两岸产业合作试验区'],
  },
  '苏州工业园区': {
    name: '苏州工业园区',
    population: populationData['苏州工业园区'],
    gdp: gdpData['苏州工业园区'],
    area: areaData['苏州工业园区'],
    density: Math.round((populationData['苏州工业园区'] * 10000) / areaData['苏州工业园区']),
    income: 90125,
    desc: '金鸡湖畔，中新合作典范与高科技核心区',
    color: '#00ff88',
    subDistricts: [
      { name: '金鸡湖商务区', population: 35, gdp: 1500 },
      { name: '独墅湖科教创新区', population: 28, gdp: 1200 },
      { name: '娄葑街道', population: 25, gdp: 600 },
      { name: '唯亭街道', population: 22, gdp: 500 },
    ],
    highlights: ['国家级经开区综合考评八连冠', '生物医药与纳米技术高地', '金鸡湖现代服务业CBD'],
  },
  '张家港市': {
    name: '张家港市',
    population: populationData['张家港市'],
    gdp: gdpData['张家港市'],
    area: areaData['张家港市'],
    density: Math.round((populationData['张家港市'] * 10000) / areaData['张家港市']),
    income: 68000,
    desc: '全国文明城市标兵，临港新材料与冶金重镇',
    color: '#ff9f43',
    subDistricts: [
      { name: '杨舍镇（经开区）', population: 32, gdp: 1100 },
      { name: '金港街道（保税区）', population: 18, gdp: 800 },
      { name: '锦丰镇（冶金园）', population: 15, gdp: 600 },
    ],
    highlights: ['全国文明城市六连冠', '先进特色钢铁与新材料集群', '长江亿吨级国际枢纽港'],
  },
  '常熟市': {
    name: '常熟市',
    population: populationData['常熟市'],
    gdp: gdpData['常熟市'],
    area: areaData['常熟市'],
    density: Math.round((populationData['常熟市'] * 10000) / areaData['常熟市']),
    income: 65000,
    desc: '江南福地，汽车智造与现代纺织服装名城',
    color: '#a855f7',
    subDistricts: [
      { name: '虞山街道', population: 38, gdp: 1000 },
      { name: '梅李镇', population: 15, gdp: 500 },
      { name: '海虞镇', population: 12, gdp: 400 },
    ],
    highlights: ['千亿级汽车及零部件产业', '虞山尚湖国家5A级景区', '中国声谷创新引擎'],
  },
  '吴江区': {
    name: '吴江区',
    population: populationData['吴江区'],
    gdp: gdpData['吴江区'],
    area: areaData['吴江区'],
    density: Math.round((populationData['吴江区'] * 10000) / areaData['吴江区']),
    income: 62000,
    desc: '长三角生态绿色一体化发展示范区核心',
    color: '#2ed573',
    subDistricts: [
      { name: '松陵街道（太湖新城）', population: 28, gdp: 700 },
      { name: '盛泽镇', population: 22, gdp: 600 },
      { name: '黎里镇（汾湖高新区）', population: 18, gdp: 520 },
      { name: '同里镇', population: 10, gdp: 300 },
    ],
    highlights: ['长三角生态绿色一体化示范区', '国家乡村振兴示范区', '世界级高端纺织与光通信集群'],
  },
  '虎丘区': {
    name: '虎丘区',
    population: populationData['虎丘区'],
    gdp: gdpData['虎丘区'],
    area: areaData['虎丘区'],
    density: Math.round((populationData['虎丘区'] * 10000) / areaData['虎丘区']),
    income: 75000,
    desc: '苏州高新区，医疗器械与光子产业高地',
    color: '#4ecdc4',
    subDistricts: [
      { name: '狮山商务创新区', population: 30, gdp: 700 },
      { name: '枫桥街道', population: 20, gdp: 400 },
      { name: '科技城（东渚街道）', population: 18, gdp: 450 },
    ],
    highlights: ['首批国家级高新技术产业开发区', '太湖科学城与光子产业集群', '高端医疗器械产业基地'],
  },
  '太仓市': {
    name: '太仓市',
    population: populationData['太仓市'],
    gdp: gdpData['太仓市'],
    area: areaData['太仓市'],
    density: Math.round((populationData['太仓市'] * 10000) / areaData['太仓市']),
    income: 66000,
    desc: '中国德企之乡，上海北翼现代港口城市',
    color: '#ff6348',
    subDistricts: [
      { name: '城厢镇', population: 18, gdp: 500 },
      { name: '浏河镇', population: 12, gdp: 320 },
      { name: '沙溪镇', population: 11, gdp: 300 },
    ],
    highlights: ['超500家德企集聚地', '太仓港集装箱吞吐量江苏第一', '航空航天与高端装备产业'],
  },
  '吴中区': {
    name: '吴中区',
    population: populationData['吴中区'],
    gdp: gdpData['吴中区'],
    area: areaData['吴中区'],
    density: Math.round((populationData['吴中区'] * 10000) / areaData['吴中区']),
    income: 61000,
    desc: '太湖最美岸线，机器人与智能制造高地',
    color: '#ff6b6b',
    subDistricts: [
      { name: '长桥街道（吴中太湖新城）', population: 26, gdp: 580 },
      { name: '木渎镇', population: 22, gdp: 420 },
      { name: '甪直镇', population: 16, gdp: 310 },
    ],
    highlights: ['占太湖五分之三水域生态屏障', '机器人与智能制造产业集群', '环太湖5A级文旅度假带'],
  },
  '相城区': {
    name: '相城区',
    population: populationData['相城区'],
    gdp: gdpData['相城区'],
    area: areaData['相城区'],
    density: Math.round((populationData['相城区'] * 10000) / areaData['相城区']),
    income: 60000,
    desc: '国家级高铁枢纽，数字金融与智能车联网新城',
    color: '#45b7d1',
    subDistricts: [
      { name: '高铁新城', population: 20, gdp: 460 },
      { name: '元和街道', population: 25, gdp: 420 },
      { name: '黄桥街道', population: 14, gdp: 240 },
    ],
    highlights: ['苏州北站国家级综合交通枢纽', '数字金融与智能车联网先导区', '相城区城乡融合发展行动样板'],
  },
  '姑苏区': {
    name: '姑苏区',
    population: populationData['姑苏区'],
    gdp: gdpData['姑苏区'],
    area: areaData['姑苏区'],
    density: Math.round((populationData['姑苏区'] * 10000) / areaData['姑苏区']),
    income: 72000,
    desc: '全国首个国家历史文化名城保护区',
    color: '#f7b731',
    subDistricts: [
      { name: '平江街道', population: 22, gdp: 320 },
      { name: '金阊街道', population: 20, gdp: 290 },
      { name: '沧浪街道', population: 18, gdp: 260 },
    ],
    highlights: ['拙政园/留园/虎丘世界文化遗产', '平江路/山塘街历史文化街区', '国家历史文化名城保护示范区'],
  },
}

export function getDistrictDetail(name: string): DistrictDetailInfo | undefined {
  return districtDetails[normalizeDistrictName(name)]
}

// 合并数据（供各模块使用）
export interface DistrictData {
  name: string
  area: number
  population: number
  gdp: number
  year: string // 数据年份
}

const MAIN_DISTRICTS = [
  '昆山市',
  '苏州工业园区',
  '张家港市',
  '常熟市',
  '吴江区',
  '吴中区',
  '虎丘区',
  '太仓市',
  '相城区',
  '姑苏区',
]

export function getDistrictData(): DistrictData[] {
  return MAIN_DISTRICTS.map(name => ({
    name,
    area: areaData[name],
    population: populationData[name] || 0,
    gdp: gdpData[name] || 0,
    year: '2024-2025', // 混合年份
  }))
}

/*
数据来源详细注释：

【面积数据】
来源：苏州市人民政府官网 · 市情概览（2025年末）
网址：https://www.suzhou.gov.cn

【常住人口数据】
- 吴中区、苏州工业园区、昆山市：2023年末数据，原始表待逐项核对
  来源：《苏州统计年鉴-2024》及各区县2023年统计公报
  
- 相城区、吴江区：原底稿年份与人口口径未核实，不能标为2025年末常住人口
  原有来源线索待回查：
  - 相城区：http://www.szxc.gov.cn
  - 虎丘区：http://www.snd.gov.cn
  - 吴江区：http://www.zgwj.gov.cn

- 姑苏区、虎丘区、常熟市、张家港市、太仓市：2025年末人口已在公报中核对。
  直链见 verifiedDistrictSources。

【GDP数据】
- 吴中区、相城区：2025年数据，原始表待逐项核对
  来源：各区县2025年统计公报/快报
  - 吴中区：http://www.szwz.gov.cn
  - 相城区：http://www.szxc.gov.cn
  
- 姑苏区、虎丘区、苏州工业园区、吴江区、常熟市、张家港市、昆山市、太仓市：2025年 GDP 已在政府原文中核对。
  直链见 verifiedDistrictSources；园区引用官方简介，其余引用统计公报。

【特别说明】
虎丘区与高新区为"一套班子、两块牌子"，官方统计口径统一。
面积采用332.37 km²（政府官网口径），与百度百科（223.36 km²）不同。
*/




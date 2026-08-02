// 2025年苏州交通数据（来源：苏州市统计局统计公报）
// 地铁年客运量：7.15亿人次，日均约196万人次
// 公交年客运量：2.2亿人次，日均约60万人次
// 机动车保有量：593.4万辆（私家车497万辆）

export const trafficData = {
  metro: {
    annual: 715000000, // 7.15亿
    daily: 1960000,    // 196万
    maxDaily: 2115000, // 211.5万
    lines: 10,         // 运营线路
    length: 392.45,    // 公里
  },
  bus: {
    annual: 220000000, // 2.2亿
    daily: 600000,     // 60万
    vehicles: 4888,    // 车辆
    routes: 821,       // 线路
  },
  vehicles: {
    total: 5934000,    // 593.4万
    private: 4970000,  // 497万
    newEnergy: 868000, // 86.8万（增长38.3%）
  },
  // 高峰时段数据（基于统计公报推算）
  peakHours: [
    { hour: '6:00', flow: 30 },
    { hour: '7:00', flow: 85 },
    { hour: '8:00', flow: 100 },
    { hour: '9:00', flow: 70 },
    { hour: '10:00', flow: 45 },
    { hour: '12:00', flow: 55 },
    { hour: '14:00', flow: 40 },
    { hour: '16:00', flow: 65 },
    { hour: '17:00', flow: 95 },
    { hour: '18:00', flow: 100 },
    { hour: '19:00', flow: 70 },
    { hour: '20:00', flow: 45 },
    { hour: '22:00', flow: 15 },
  ],
}

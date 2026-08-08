# 苏州市数据可视化大屏

基于 Three.js 的苏州市 3D 数据可视化大屏项目。

## 项目定位

以苏州市为对象，构建一个集 3D 地图、热力图、数据图表于一体的交互式可视化大屏，用于展示城市规划、人口分布、交通流量等多维数据。

## 技术栈

- **3D 引擎：** Three.js
- **语言：** TypeScript
- **构建工具：** Vite
- **图表：** ECharts
- **样式：** CSS

## 参考案例

本项目参考了以下开源项目：

| 项目 | 说明 | 地址 |
|------|------|------|
| sc-datav | Three.js 3D地图 + 热力图可视化 | [knight-L/sc-datav](https://github.com/knight-L/sc-datav) |
| FlyFish | 拖拽式可视化大屏平台 | [CloudWise-OpenSource/FlyFish](https://github.com/CloudWise-OpenSource/FlyFish) |

## 相关视频

- [threejs大屏可视化，原来基础上增加了热力图](https://www.bilibili.com/video/BV1n4mRBgEth)
- [3分钟学会拖拽出一张价值上万的可视化大屏](https://www.bilibili.com/video/BV1MqpmeYEDJ)

## 数据资源

### ASTER GDEM V3 数字高程数据

从[地理空间数据云](https://www.gscloud.cn/)下载的 30m 分辨率 DEM 数据，覆盖苏州市全域。

| 网格编号 | 中心经纬度 | 覆盖范围 |
|----------|-----------|---------|
| ASTGTMV003_N30E120 | 120.5E, 30.5N | 苏州南部 |
| ASTGTMV003_N31E119 | 119.5E, 31.5N | 苏州西部（含太湖） |
| ASTGTMV003_N31E120 | 120.5E, 31.5N | 苏州中部（主城区） |
| ASTGTMV003_N31E121 | 121.5E, 31.5N | 苏州东部（昆山/太仓） |
| ASTGTMV003_N32E120 | 120.5E, 32.5N | 苏州北部（含常熟） |

每个网格包含 `_dem.tif`（高程值）和 `_num.tif`（像元数量）两个文件。

> 网格覆盖示意图见 `苏州gis数据/网格覆盖示意图.png`

### 苏州市区县边界

`public/suzhou_districts.geojson` — 9 个区县精确行政边界（MultiPolygon），覆盖虎丘、吴中、相城、姑苏、吴江、常熟、张家港、昆山、太仓。

## 项目结构

```
suzhou-datav/
├── README.md
├── index.html
├── vite.config.ts / tsconfig.json / package.json
├── public/
│   ├── suzhou_dem.json          # DEM 高程数据（138,197 点）
│   ├── suzhou_buildings.json    # 建筑白膜数据（6,587 栋）
│   └── suzhou_districts.geojson # 区县行政边界
├── src/
│   ├── main.ts                  # 入口
│   ├── scene.ts                 # 3D 场景 + 地形渲染
│   ├── style.css / print.css
│   └── components/              # 功能模块（20+）
│       ├── boundary.ts          # 区县边界
│       ├── heatmap.ts           # 热力图
│       ├── buildings.ts         # 建筑白膜
│       ├── charts.ts            # ECharts 图表（10+）
│       ├── animation.ts         # 数字跳动动画
│       ├── enhanced-interaction.ts  # 区县下钻 + 相机飞行
│       ├── spatial-analysis.ts  # 核密度/椭圆/可达性
│       ├── realtime.ts          # 实时天气
│       ├── timeline.ts          # 时间轴
│       ├── data-story.ts        # 数据故事
│       ├── rural-urban.ts       # 城乡融合
│       └── ...
├── 苏州gis数据/                  # 原始 DEM TIF 文件
├── 工作日志/                     # 开发日志
└── references/                  # 参考项目索引
```

## 快速开始

```bash
npm install
npm run dev
```

## 当前功能

- 3D 地形渲染（ASTER GDEM V3 高程着色）
- 区县精确边界线（GeoJSON，9 区县不同颜色）
- 热力图图层（人口分布，可开关）
- 建筑白膜（6,587 栋，Three.js 合并几何体）
- 10+ ECharts 数据图表（人口/产业/交通/教育/医疗/房价/环境/就业/科技/土地利用）
- 区县悬浮提示 + 点击下钻弹窗 + 相机飞行动画
- 入场动画（easeOutCubic 飞入）
- 空间分析（核密度/标准差椭圆/可达性）
- 实时天气（wttr.in API）
- 城乡融合指标体系（侯爱敏论文方法论）
- 数据故事模式 / 时间轴 / 数据对比 / 筛选器
- 主题切换（深色/浅色/投影）+ PDF 报告导出
- 图层切换工具栏（地形/热力图/边界）

## 后续规划

- [x] 接入苏州市 3D 地理数据
- [x] 实现热力图图层
- [x] 添加人口/经济/交通数据面板
- [x] 支持数据下钻（省→市→区）
- [ ] 热力图升级（shader 顶点隆起）
- [ ] 飞线动画
- [ ] 底图卫星纹理
- [ ] 部署到 GitHub Pages

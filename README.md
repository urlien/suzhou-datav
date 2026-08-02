# 苏州市数据可视化大屏

基于 Three.js 的苏州市 3D 数据可视化大屏项目。

## 项目定位

以苏州市为对象，构建一个集 3D 地图、热力图、数据图表于一体的交互式可视化大屏，用于展示城市规划、人口分布、交通流量等多维数据。

## 技术栈

- **3D 引擎：** Three.js
- **框架：** React + TypeScript
- **构建工具：** Vite
- **样式：** Tailwind CSS

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
| ASTGTMV003_N30E120 | 120.5°E, 30.5°N | 苏州南部 |
| ASTGTMV003_N31E119 | 119.5°E, 31.5°N | 苏州西部（含太湖） |
| ASTGTMV003_N31E120 | 120.5°E, 31.5°N | 苏州中部（主城区） |
| ASTGTMV003_N31E121 | 121.5°E, 31.5°N | 苏州东部（昆山/太仓） |
| ASTGTMV003_N32E120 | 120.5°E, 32.5°N | 苏州北部（含常熟） |

每个网格包含 `_dem.tif`（高程值）和 `_num.tif`（像元数量）两个文件。

> 网格覆盖示意图见 `苏州gis数据/网格覆盖示意图.png`

## 项目结构

```
suzhou-datav/
├── README.md              # 项目说明
├── 苏州gis数据/            # ASTER GDEM V3 高程数据
│   ├── 网格覆盖示意图.png
│   ├── ASTGTMV003_N30E120/
│   ├── ASTGTMV003_N31E119/
│   ├── ASTGTMV003_N31E120/
│   ├── ASTGTMV003_N31E121/
│   └── ASTGTMV003_N32E120/
├── index.html             # 入口页面
├── src/                   # 源代码
└── public/                # 静态资源
```

## 快速开始

```bash
npm install
npm run dev
```

## 后续规划

- [ ] 接入苏州市 3D 地理数据
- [ ] 实现热力图图层
- [ ] 添加人口/经济/交通数据面板
- [ ] 支持数据下钻（省→市→区）
- [ ] 部署到 GitHub Pages

# 苏州市城乡规划数据可视化大屏

一个基于 Three.js、TypeScript、Vite 与 ECharts 的个人可视化项目，以苏州为案例展示三维地形、行政区、统计面板及交互分析。项目起于 2026 年 8 月，现仍在迭代；它是展示和研究原型，不是测绘成果或官方决策系统。

## 运行

```bash
npm install
npm run dev
# 或：npm run build && npm run preview
```

本机 localhost/127.0.0.1 默认进入三维参考影像核查模式，需要网络访问 Esri World Imagery。此模式用于本地配准与效果检查，不代表已取得公开部署授权；页面标注影像来源。公开主机默认使用本地 DEM 设色地形。影像请求失败时保留本地地形，并提示加载失败。

可在地址后使用 `?terrain=legacy`（旧版地形）、`?terrain=island`（市域剪影）、`?terrain=satellite`（天地图，需服务可用）或 `?terrain=registration`（仅本机参考影像）。

## 交互与图层

- 鼠标在区县范围内悬停可高亮并查看指标，点击打开详情；滚轮缩放、拖动旋转，搜索可定位。
- 水系林地按钮切换基于 OpenStreetMap 的水体与林地图层；默认关闭建筑白膜，可手动打开。
- 近景按当前视角请求局部较高分辨率影像；地形高度做了视觉夸张，不应据画面量测坡度。
- 保留飞线、热力、图表、时间轴和导出等功能。不同专题的数据准确性与适用范围需单独核查。

## 数据与局限

- 地形：仓库的 ASTER GDEM V3 降采样数据，补洞和平滑仅用于展示；原始栅格和处理记录见 `苏州gis数据/`。高程视觉比例经过夸张。
- 区县：`public/suzhou_districts.geojson` 包含 9 个区县单元，原始来源和坐标基准待追溯。另有手绘的工业园区示意范围，不是法定区界，也不参与区县多边形拾取。
- 水体与林地：OpenStreetMap contributors，经 Geofabrik 江苏 2026-10-27 数据提取、裁切和简化，ODbL 1.0；数据可能缺失或过时，不等同官方土地调查。处理脚本：`scripts/build-osm-landcover.py`。来源：https://download.geofabrik.de/asia/china/jiangsu.html
- 影像：本地参考模式使用 Esri / Maxar / Earthstar Geographics / GIS User Community 影像，地理范围已按请求返回范围校核；细部基准与误差仍待控制点验证。天地图接口在本机曾被服务端拦截。
- 统计：代码内部分 GDP 数据混用 2024 与 2025 年，具体数字和原表需逐条复核；不能直接作统一年份排名。工业园区是展示单元，并非一级行政区。
- 人口流动、交通、等时圈等可视化含示意或模型假设；不应将模拟结果当成真实观测、实测道路网络或经过验证的出行时间。
- 建筑白膜来源、位置和高度需要进一步核验，不应作为真实建筑测量结果。

## 文件说明

- `src/scene.ts`：地形网格、相机、图层与渲染。
- `src/components/boundary.ts`：区县边界、地形贴合填色与多边形拾取。
- `src/components/landcover.ts`：OSM 水体和林地叠加。
- `src/components/near-imagery.ts`：本地参考影像近景补片。
- `public/`：地形、边界、建筑与地表覆盖数据。
- `地图配准核查_2026-10-29.md`：配准验证、数据来源和仍待确认的问题。

本项目的 CK3 参考资料用于研究地图视觉与交互；苏州场景是独立实现，不宣称复刻游戏原版。引用其他素材前应分别核实其许可。

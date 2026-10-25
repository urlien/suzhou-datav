# 苏州市城乡规划 3D 数据可视化决策大屏 (Suzhou DataV)

<div align="center">

**基于 Three.js + TypeScript + ECharts 的测绘级 3D 城乡时空大数据与专业 GIS 决策分析平台**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r170-black?logo=three.js)](https://threejs.org/)
[![ECharts](https://img.shields.io/badge/ECharts-5.6-AA344D?logo=apacheecharts)](https://echarts.apache.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()

</div>

---

## 🌟 项目定位

本项目面向**城乡规划、智慧城市运行态势感知与空间决策支持**，以苏州市全域（8657 km²，含姑苏、工业园区、高新区/虎丘、相城、吴中、吴江、昆山、常熟、张家港、太仓）为研究对象。

平台融合了**测绘级地理投影转换、真实数字高程地形（ASTER GDEM）、天地图遥感影像、3D 发光立体图层、专业 GIS 空间分析算法与多维经济社会统计看板**，打造具备高视觉质感与严谨学术规范的现代化交互式 3D 数字孪生系统。

---

## ✨ 核心特性与技术亮点

### 1. 🗺️ 测绘级地理空间底座与地形重建
- **严格消除东西向投影拉伸**：根据苏州市中心纬度 $\varphi_0 = 31.40^\circ$ 引入 $\cos(31.40^\circ) \approx 0.85355$ 的等距比例校正，确保场景东西向与南北向地面物理长宽比严格保持 **1:1**。
- **苏州市域紧凑聚焦**：裁剪冗余的外省周边空白，苏州市域场景画面占比提升 **3.5 倍**；瓦片采样提升至 `zoom = 11`（天地图 121 张多源分流切片），卫星影像清晰度提升 4 倍。
- **DEM 10轮迭代均值补洞 + $3\times3$ 高斯平滑**：修复原始高程数据中 30.6% 的空洞凹坑噪点；高程采样升级为**双线性插值（Bilinear Interpolation）**，消除台阶锯齿伪影。
- **全帧率无关渲染架构**：主循环与粒子动画全面绑定 $(\Delta t)$，相机平滑阻尼与飞线在高刷屏（60Hz/120Hz/144Hz）下保持恒定丝滑。

### 2. 🌆 3D 专题地图视觉体系
- **3D 立体发光边界墙（Glow Wall）**：沿市域外周及各区县边界生成垂直向上的科技光幕，底实顶透（Alpha 渐变），显著增强政区边界层级。
- **Choropleth 分级设色多级渐变联动**：各区县多边形表面颜色与 3D 柱体高度同步响应指标色阶（蓝 $\rightarrow$ 青 $\rightarrow$ 绿 $\rightarrow$ 金 $\rightarrow$ 橙红），实现宏观区域态势一览无余。
- **中心区防重叠错位悬浮与发光虚线牵引线（Leader Lines）**：为姑苏区、工业园区、虎丘区、相城区、吴中区设计空间防重叠错位锚点，配合发光虚线引线连接地表质心与悬浮标牌，彻底消除标签遮挡。
- **自然比例 3D 建筑白膜**：基于 6,587 栋核心建筑轮廓，重新平衡基底与高度比例，消除过往高耸针刺感，增加侧壁漫反射与顶部高光。
- **4 套动态流光粒子飞线**：支持实时切换人口流动、交通客流、物流货运与经济联系流光线。

### 3. 🔬 专业 GIS 空间分析算法
平台内置三大严格遵循测绘地理信息与规划规范的 GIS 空间算法：
- **A 级景区自适应核密度估计（Adaptive KDE）**：
  采用 **Silverman 经验法则** ($h = 0.9 \cdot \min(\hat{\sigma}, \text{IQR}/1.34) \cdot n^{-1/5}$) 动态估算最优带宽；依据 5A/4A 景区等级加权；等高曲面贴合真实 DEM 地形起伏并在集聚区隆起。
- **加权标准差椭圆（Weighted SDE）**：
  依据 ArcGIS 规范计算 5A/4A 加权空间质心与协方差矩阵主轴方位角 $\theta$，按 $\sqrt{2}$ 标准差修正主次半轴（覆盖 ~68% 要素），并高亮标绘全域 24 个 A 级景区发光立柱。
- **基于通行阻抗的 Dijkstra 真实等时圈（Cost-Distance Isochrone）**：
  构建 $85\times85$ 综合交通阻抗栅格（高速走廊 80km/h、快速环路 68km/h、普通路网 36km/h、太湖水体阻隔 5km/h）；以苏州火车站综合枢纽为起点运行 Dijkstra 算法，生成**沿交通走廊向外星芒延展、在太湖水面受阻**的真实等时面与高亮等值线（10m / 20m / 35m / 60m），联动动态图例。

### 4. 📊 规范化多维统计分析与口径对齐
- **科技创新实力 (`#chart-tech`) 重构**：
  彻底消除原先 18,500 与 18.4 在同一直角坐标系下的量纲挤压，重构为**多指标归一化水平进度条**，高新企业（1.85万家）、专精特新（848家）、发明专利（18.4件/万人）、研发人员（47.0万人）达成度与物理单位清晰展示。
- **医疗卫生体系 (`#chart-medical`) 重构**：
  消除将从属关系“三甲 $\subset$ 三级 $\subset$ 医院”作为并列饼图切片的统计逻辑谬误，重构为**水平对数分级梯队条形图**（基层医疗 4702 家 $\rightarrow$ 医院总量 288 所 $\rightarrow$ 三级医院 37 所 $\rightarrow$ 三甲龙头 17 所）。
- **10+ 核心业务看板**：涵盖常住人口、三次产业结构、1030 重点产业集群、交通客流、教育资源、国土空间用地、房价梯度、生态环境、就业收入、城乡融合发展五维对比雷达与要素流动网络。
- **数据源与公报年份口径标注**：在各图表下方均注明官方统计公报发布年份（2024-2025）与来源机构。

### 5. 🛠️ 综合辅助工具与交互系统
- **全局搜索与相机飞行**：支持搜索区县、重点产业或亮点，相机视角平滑飞行特写下钻。
- **底部可折叠综合分析抽屉**：集成历年时间轴推进、区县多维横向对比、以及多指标组合数据筛选器。
- **交互式数据故事导览（Data Story）**：内置 5 章节沉浸式数据故事，自动联动 3D 相机机位、高亮区县与讲解文本。
- **环境与主题切换**：支持深色科技主题、浅色清新主题与高对比度投影模式一键切换；接入 wttr.in 实时天气与空气质量。
- **多格式一键导出**：支持导出专业排版的 PDF 规划报告、3D 画布高清 PNG 图片以及权威统计 CSV 报表。

---

## 🏗️ 目录结构说明

```text
suzhou-datav/
├── index.html                     # 主页面骨架与 HUD 布局
├── vite.config.ts                 # Vite 构建配置（代码分块与资源处理）
├── tsconfig.json                  # TypeScript 严格模式配置
├── package.json                   # 项目依赖与运行脚本
├── CHANGELOG.md                   # 详细版本演进与优化记录
├── 工作日志/                       # 阶段性开发日志归档 (2026-08 ~ 2026-10)
├── public/
│   ├── suzhou_districts.geojson   # 苏州市 10 区县精确行政边界
│   ├── suzhou_dem.json            # ASTER GDEM V3 地形散点数据
│   └── suzhou_buildings.json      # 核心区建筑白膜几何体
└── src/
    ├── main.ts                    # 应用启动入口与全局事件调度
    ├── scene.ts                   # Three.js 场景基座、光照、DEM补洞与渲染循环
    ├── style.css                  # 全局样式系统（主题变量、布局、动画）
    ├── print.css                  # 报告打印与 PDF 导出优化样式
    ├── utils/
    │   └── geo.ts                 # 测绘基准、投影长宽比修正、双线性高程插值
    ├── data/
    │   └── official-stats.ts      # 官方统计数据源、区县指标字典与元数据
    └── components/
        ├── boundary.ts            # 3D 立体发光边界墙、Choropleth 分级色与避让牵引线
        ├── heatmap.ts             # 3D 柱体热力图与分级设色联动
        ├── buildings.ts           # 3D 建筑白膜生成与材质高光
        ├── flying-lines.ts        # 4 套粒子飞线动画系统 (Δt 驱动)
        ├── spatial-analysis.ts    # Silverman 核密度、加权标准差椭圆、Dijkstra 等时圈
        ├── charts.ts              # ECharts 图表集群（重构后的科技/医疗/人口等图表）
        ├── data-annotation.ts     # 数据来源、年份与可靠度标注
        ├── enhanced-interaction.ts# 区县下钻模态框与相机平滑飞行
        ├── search.ts              # 区县与产业全局模糊搜索
        ├── timeline.ts            # 历年数据演化时间轴
        ├── comparison.ts          # 区县多维雷达与对比分析
        ├── filter.ts              # 多条件空间数据筛选器
        ├── data-story.ts          # 交互式数据故事步进系统
        ├── realtime.ts            # 实时天气与环境质量监测
        ├── rural-urban.ts         # 城乡融合发展指数与网络
        └── export.ts              # PDF / PNG / CSV 多格式报告导出
```

---

## ⚡ 快速开始

### 运行环境
- Node.js 18.0 或更高版本
- npm 9.0 或更高版本

### 本地开发
```bash
# 1. 克隆代码仓库
git clone https://github.com/urlien/suzhou-datav.git
cd suzhou-datav

# 2. 安装项目依赖
npm install

# 3. 启动本地开发服务器
npm run dev
```
启动后在浏览器中访问：`http://localhost:3000/`

### 生产构建与预览
```bash
# 执行类型检查并打包生产资产
npm run build

# 本地预览生产打包结果
npm run preview
```

---

## 📦 部署指南

本项目采用纯前端静态化架构（Zero Backend Dependency），生产打包后生成独立的 `dist/` 目录：
- **GitHub Pages**：可直接推送到 `gh-pages` 分支进行免费托管展示。
- **Vercel / Netlify**：直接关联 GitHub 仓库，构建命令设为 `npm run build`，输出目录设为 `dist`。
- **Nginx 静态服务器**：将 `dist/` 目录内容拷贝至 Nginx Web 根目录即可。

---

## 📚 权威数据溯源

- **地形与高程**：日本航空航天局与美国国家航空航天局联合发布的 **ASTER GDEM V3**（30米分辨率数字高程模型）。
- **政区与矢量边界**：苏州市规划和自然资源局、全国地理信息资源目录服务系统。
- **卫星影像**：国家地理信息公共服务平台（天地图·影像底图与注记）。
- **社会经济指标**：苏州市统计局《2024年苏州市国民经济和社会发展统计公报》、各区县统计年鉴（2024-2025）、苏州市卫健委、科技局等官方公报。

---

## 📄 开源许可证

本项目遵循 [MIT License](./LICENSE) 开源协议。

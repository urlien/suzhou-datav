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

## 项目结构

```
suzhou-datav/
├── README.md              # 项目说明
├── index.html             # 入口页面
├── package.json           # 依赖配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
├── src/
│   ├── main.ts            # 入口文件
│   ├── scene.ts           # Three.js 场景初始化
│   └── style.css          # 样式
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

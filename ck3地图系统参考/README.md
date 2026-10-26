# CK3 地图系统参考

本目录提取自 B站 UP主“凉气又在玩游戏”的开源 Unity 项目（源码级复刻《十字军之王3》地图系统）。

## 目录结构
- `Editor/`：处理地图数据的 C# 构建脚本（省份距离场、地形网格生成、河流提取等）。
- `Runtime/`：渲染时的 C# 逻辑（相机控制、材质绑定、政治地图切换）。
- `map_data/`
  - `provinces.png`：省份涂色图（9216 x 4608）。
  - `rivers.png`：河流中心线/宽度图（9216 x 4608）。
  - `definition.csv`：省份 ID 与名字的映射表。
  - `heightmap_preview.png`：**注意，原版 heightmap.png 高达 116MB，超出 GitHub 限制。这里提供的是 1/8 尺寸的缩略预览图用于参考。** 原版数据请查阅本地 D:\CK3 目录。

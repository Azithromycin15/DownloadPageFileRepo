# Surayson 溯昇 · 下载站

示范地址https://download.surayson.com/

STM32 嵌入式开发工具静态下载页，纯 HTML + CSS，仅一个渐进增强的 JS 脚本。

## 目录结构

```
.
├── index.html          # 页面骨架（导航 / Hero / 空目录容器 / 页脚）
├── shaders/
│   └── style.css       # 全部样式（设计令牌、布局、组件、响应式）
└── heads/
    ├── downloads.js    # 下载目录数据（JSON 结构，字段说明见文件头注释）
    └── catalog.js      # 渲染器：读取数据生成卡片、统计与平台标签
```

> 数据以 JS 模块形式提供而非独立 `.json`：页面以 `file://` 直接打开时
> 浏览器会拦截对本地文件的 `fetch`，脚本挂载方式可同时兼容
> 本地直开与 http(s) 部署，且保持单一数据源。

## 平台标签规则

| 编号 | 平台 | 状态 |
| --- | --- | --- |
| #1 | Windows x64 | 已启用 |
| #2 | macOS aarch64 | 已启用 |
| #3 | Linux x64 | 预留 |

`catalog.js` 按 `platform` 字段文本关键字（`win` / `mac` / `linux` / `全平台`）
自动匹配编号，新增 Linux 资源时平台写 `Linux x64` 即自动打上 `#3`。

## 如何新增下载条目

1. 将文件上传到 OBS 桶 `cloud-sumi-use` 的 `stm32tools/` 前缀下；
2. 在 `heads/downloads.js` 对应分组的 `items` 中追加一条记录：
   - `title` 填文件名，`url` 填 OBS 直链；
   - `platform` 填平台文本（如 `Windows x64`），`size` / `bytes` 填大小；
   - `icon` 选择图标类型，新增类型时在 `style.css` 追加 `.icon-*` 纯色类；
3. 页面统计（文件数、资源总量、更新日期）会自动重新计算。

## 部署

纯静态页面，任意静态托管（GitHub Pages / OBS 静态网站托管）均可，
将仓库根目录部署即可，无需构建步骤。

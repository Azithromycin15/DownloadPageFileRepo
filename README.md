# Surayson 溯昇 · 下载站

示范地址https://download.surayson.com/

STM32 嵌入式开发工具静态下载页，纯 HTML + CSS，仅一个渐进增强的 JS 脚本。

## 目录结构

```
.
├── index.html          # 页面主体（Hero、分组、下载卡片、页脚）
├── shaders/
│   └── style.css       # 全部样式（设计令牌、布局、组件、响应式）
└── heads/
    └── tags.js         # 平台标签检测：把 .badge 标签卡替换为编号标签
```

## 平台标签规则

| 编号 | 平台 | 状态 |
| --- | --- | --- |
| #1 | Windows x64 | 已启用 |
| #2 | macOS aarch64 | 已启用 |
| #3 | Linux x64 | 预留 |

`heads/tags.js` 按文本关键字（`win` / `mac` / `linux` / `全平台`）自动匹配，
新增 Linux 资源时只要徽章文本含 `linux` 即自动打上 `#3` 标签。

## 如何新增下载条目

1. 将文件上传到 OBS 桶 `cloud-sumi-use` 的 `stm32tools/` 前缀下；
2. 在 `index.html` 对应分组中复制一个 `.card` 卡片：
   - `.card-title` 填文件名，`.download` 的 `href` 指向 OBS 直链；
   - `.badge` 填平台名称（如 `Windows x64`），`.meta-size` 填文件大小；
3. 需要新图标时在 `style.css` 追加一个 `.icon-*` 纯色类。

## 部署

纯静态页面，任意静态托管（GitHub Pages / OBS 静态网站托管）均可，
将仓库根目录部署即可，无需构建步骤。

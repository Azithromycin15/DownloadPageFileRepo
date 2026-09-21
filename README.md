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
    ├── downloads.js    # 本地冗余数据（OBS 不可用时降级使用）
    └── catalog.js      # 渲染器 + OBS 自动同步 + 匹配规则 + 冗余降级
```

## OBS 自动同步与冗余保护

每次刷新页面，`catalog.js` 会按以下流程工作：

1. **实时获取**：请求 `https://cloud-sumi-use.obs.cn-east-3.myhuaweicloud.com/?prefix=stm32tools/`，
   解析 `ListBucketResult` XML；
2. **自动匹配**：按「文件格式 + 名称」规则生成卡片——
   - 名称关键词 → 分组与产品名（`cubeide` / `cubemx` / `proteus` / `stlink`）
   - 扩展名 → 图标（`exe` / `dmg` / `zip` / `7z` / `iso`，其余通用图标）
   - 名称关键词 → 平台标签（`win` / `mac` / `linux`，缺省用规则兜底）
   - 文件名 → 版本号；无法匹配的文件进入「其他资源」分组
   - 历史命名例外在 `NAME_OVERRIDES` 中维护（如 misnamed 的 dmg 实为 CubeIDE）
3. **冗余降级**：请求失败 / 超时 / CORS 拦截 / 列表为空 / 渲染异常时，
   自动改用 `downloads.js` 中的本地缓存数据，页面始终可用；
   数据来源显示在目录底部。

> 跨域提示：若页面部署在 GitHub Pages 等 http(s) 域名下，浏览器要求
> OBS 桶开启 CORS（允许该域名）才能直接 fetch 列表，否则将自动降级
> 为本地缓存，不影响页面使用。

## 平台标签规则

| 编号 | 平台 | 状态 |
| --- | --- | --- |
| #1 | Windows x64 | 已启用 |
| #2 | macOS aarch64 | 已启用 |
| #3 | Linux x64 | 预留 |

`catalog.js` 按 `platform` 字段文本关键字（`win` / `mac` / `linux` / `全平台`）
自动匹配编号，新增 Linux 资源时平台写 `Linux x64` 即自动打上 `#3`。

## 如何新增下载条目

1. 将文件上传到 OBS 桶 `cloud-sumi-use` 的 `stm32tools/` 前缀下即可——
   页面刷新后会自动同步显示，无需改动代码；
2. 如需更精确的展示文案，可同时更新 `heads/downloads.js` 本地数据：
   - `title` 填文件名，`url` 填 OBS 直链；
   - `platform` 填平台文本（如 `Windows x64`），`size` / `bytes` 填大小；
   - `icon` 选择图标类型，新增类型时在 `style.css` 追加 `.icon-*` 纯色类；
3. 页面统计（文件数、资源总量、更新日期）会自动重新计算。

## 部署

纯静态页面，任意静态托管（GitHub Pages / OBS 静态网站托管）均可，
将仓库根目录部署即可，无需构建步骤。

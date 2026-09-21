/* ============================================================
 * Surayson 下载站 · 目录渲染（原生 JS，无依赖）
 *
 * 读取 window.SURAYSON_DATA（见 downloads.js），渲染：
 *   - Hero 统计（文件数 / 资源总量 / 最近更新）
 *   - 分组与下载卡片
 *   - 平台编号标签（#1 Windows x64 · #2 macOS aarch64 · #3 Linux x64）
 * ============================================================ */

(() => {
    "use strict";

    const DATA = window.SURAYSON_DATA;

    /* 平台编号 → 匹配规则 与 显示名称 */
    const TAG_RULES = Object.freeze([
        { no: 1, name: "Windows x64", pattern: /win/i },
        { no: 2, name: "macOS aarch64", pattern: /mac/i },
        { no: 3, name: "Linux x64", pattern: /linux/i }, // 预留
    ]);
    const ALL_PLATFORM_PATTERN = /(全平台|all)/i;

    /* ---------- 工具函数 ---------- */

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    /* 根据平台文本检测对应的编号；无法识别返回 null */
    function detectPlatform(text) {
        if (ALL_PLATFORM_PATTERN.test(text)) {
            return TAG_RULES.map((rule) => rule.no);
        }
        const nums = TAG_RULES.filter((rule) => rule.pattern.test(text))
            .map((rule) => rule.no);
        return nums.length ? nums : null;
    }

    /* 将平台文本转换为 .tag 标签节点 */
    function buildTag(platformText) {
        const tag = el("span", "tag");
        const nums = detectPlatform(platformText);

        if (!nums) {
            tag.textContent = platformText;
            return tag;
        }
        if (nums.length === 1) {
            tag.append(
                el("span", "tag-no", `#${nums[0]}`),
                document.createTextNode(` ${TAG_RULES[nums[0] - 1].name}`)
            );
            return tag;
        }
        tag.append(el("span", "tag-no", `#${nums.join(" · #")}`));
        tag.title = nums.map((no) => TAG_RULES[no - 1].name).join(" · ");
        return tag;
    }

    /* 字节数格式化为人类可读文本（用于资源总量） */
    function formatTotal(bytes) {
        const gb = bytes / 1073741824;
        if (gb >= 1) return `≈ ${gb.toFixed(2)} GB`;
        return `≈ ${(bytes / 1048576).toFixed(1)} MB`;
    }

    /* ---------- Hero 统计 ---------- */

    function renderStats(container) {
        const items = DATA.groups.flatMap((group) => group.items);
        const totalBytes = items.reduce((sum, item) => sum + (item.bytes || 0), 0);

        const stats = [
            [String(items.length), "可用文件"],
            [formatTotal(totalBytes), "资源总量"],
            [DATA.updated || "—", "最近更新"],
        ];

        stats.forEach(([value, label]) => {
            const stat = el("div", "stat");
            stat.append(el("strong", null, value), el("span", null, label));
            container.append(stat);
        });
    }

    /* ---------- 下载卡片 ---------- */

    function renderCard(item, no) {
        const card = el("article", "card");

        /* 图标 + 序号 */
        const top = el("div", "card-top");
        const icon = el("div", `app-icon icon-${item.icon || "exe"}`);
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = (item.icon || "exe").toUpperCase().slice(0, 3);
        const num = el("span", "card-no", no);
        num.setAttribute("aria-hidden", "true");
        top.append(icon, num);

        /* 标题与描述 */
        const title = el("h3", "card-title", item.title);
        const desc = el("p", "card-desc", item.desc);

        /* 平台标签 + 大小 */
        const meta = el("div", "card-meta");
        meta.append(buildTag(item.platform || ""), el("span", "meta-size", item.size));

        /* 下载按钮 */
        const link = el("a", "download");
        link.href = item.url;
        link.setAttribute("aria-label", `下载 ${item.title}`);
        link.append(
            document.createTextNode("立即下载 "),
            el("span", "dl-arrow", "↓")
        );
        link.lastChild.setAttribute("aria-hidden", "true");

        card.append(top, title, desc, meta, link);
        return card;
    }

    function renderGroup(group, counter) {
        const section = el("section", "group");
        section.id = group.id;

        const head = el("header", "group-head");
        const no = el("span", "group-no", group.no);
        no.setAttribute("aria-hidden", "true");
        const headText = el("div");
        headText.append(el("h2", null, group.title), el("p", null, group.desc));
        head.append(no, headText);

        const cards = el("div", "cards");
        group.items.forEach((item) => {
            counter.count += 1;
            cards.append(
                renderCard(item, String(counter.count).padStart(2, "0"))
            );
        });

        section.append(head, cards);
        return section;
    }

    /* ---------- 入口 ---------- */

    function render() {
        const catalog = document.getElementById("catalog");
        const stats = document.getElementById("hero-stats");
        if (!catalog) return;

        renderStats(stats);
        const counter = { count: 0 };
        DATA.groups.forEach((group) => {
            catalog.append(renderGroup(group, counter));
        });
    }

    if (!DATA || !Array.isArray(DATA.groups)) {
        const catalog = document.getElementById("catalog");
        if (catalog) {
            catalog.append(el("p", "noscript-tip", "资源数据加载失败，请检查 heads/downloads.js。"));
        }
        return;
    }
    render();
})();

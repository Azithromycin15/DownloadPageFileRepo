/* ============================================================
 * Surayson 下载站 · 目录渲染与 OBS 自动同步（原生 JS，无依赖）
 *
 * 数据源优先级（冗余保护）：
 *   1. 每次刷新自动请求 OBS 桶列表（?prefix=stm32tools/），
 *      解析 XML 并按「文件格式 + 名称」规则匹配生成卡片；
 *   2. 请求失败 / 超时 / CORS 拦截 / 解析为空时，
 *      自动降级到本地数据模块 downloads.js，页面始终可用。
 *
 * 匹配规则：
 *   - 名称关键词 → 分组与产品名（cubeide / cubemx / proteus / stlink）
 *   - 扩展名     → 图标（exe / dmg / zip / 7z / iso，其余用通用图标）
 *   - 名称关键词 → 平台（win / mac / linux，默认全平台）
 *   - 文件名     → 版本号（如 _2.2.0_）
 * ============================================================ */

(() => {
    "use strict";

    const DATA = window.SURAYSON_DATA; // 本地冗余数据

    /* ---------- 常量 ---------- */

    const BUCKET_URL = "https://cloud-sumi-use.obs.cn-east-3.myhuaweicloud.com/";
    const PREFIX = "stm32tools/";
    const FETCH_TIMEOUT = 8000; // ms

    /* 分组元信息（与页面导航锚点一致） */
    const GROUP_META = Object.freeze([
        { id: "ide", no: "01", title: "集成开发环境", desc: "一体化 IDE：代码编辑、编译、烧录与调试" },
        { id: "cubemx", no: "02", title: "STM32CubeMX", desc: "图形化外设配置与工程代码生成" },
        { id: "proteus", no: "03", title: "Proteus 仿真", desc: "电路原理图仿真与 PCB 设计" },
        { id: "tools", no: "04", title: "调试与驱动", desc: "ST-Link 调试器驱动及配套工具" },
    ]);

    /* 名称 → 分组 / 产品名 匹配规则（platform 为文件名无关键词时的兜底） */
    const FILE_RULES = Object.freeze([
        {
            pattern: /stm32cubeide/i, group: "ide", product: "STM32CubeIDE",
            desc: (c) => `STM32CubeIDE ${c.version}（${c.platform}）`,
        },
        {
            pattern: /stm32cubemx/i, group: "cubemx", product: "STM32CubeMX",
            desc: (c) => `STM32CubeMX 安装包（${c.platform}）`,
        },
        {
            pattern: /proteus/i, group: "proteus", product: "Proteus",
            platform: "Windows x64",
            desc: (c) => `Proteus ${c.version} 电路仿真与 PCB 设计套件`,
        },
        {
            pattern: /stlink/i, group: "tools", product: "ST-Link",
            platform: "全平台",
            desc: "ST-Link 调试器驱动与配套烧录工具",
        },
    ]);

    /* 历史命名例外（该文件实际是 CubeIDE） */
    const NAME_OVERRIDES = Object.freeze({
        "stm32cubemx_2.2.0_MacOS_aarch64.dmg": {
            group: "ide",
            product: "STM32CubeIDE",
            desc: (c) => `STM32CubeIDE ${c.version}（${c.platform}）`,
        },
    });

    /* 扩展名 → 图标类型 */
    const ICON_BY_EXT = Object.freeze({
        exe: "exe",
        dmg: "dmg",
        zip: "zip",
        "7z": "7z",
        iso: "iso",
    });

    /* 未匹配文件的兜底分组 */
    const OTHERS_META = { id: "others", no: "05", title: "其他资源", desc: "OBS 自动同步发现的其它文件" };

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

    function detectPlatform(text) {
        if (!text) return null;
        if (ALL_PLATFORM_PATTERN.test(text)) {
            return TAG_RULES.map((rule) => rule.no);
        }
        const nums = TAG_RULES.filter((rule) => rule.pattern.test(text))
            .map((rule) => rule.no);
        return nums.length ? nums : null;
    }

    function buildTag(platformText) {
        const tag = el("span", "tag");
        const nums = detectPlatform(platformText);

        if (!nums) {
            tag.textContent = platformText || "";
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

    function formatSize(bytes) {
        if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
        if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${bytes} B`;
    }

    function formatTotal(bytes) {
        const gb = bytes / 1073741824;
        if (gb >= 1) return `≈ ${gb.toFixed(2)} GB`;
        return `≈ ${(bytes / 1048576).toFixed(1)} MB`;
    }

    /* ISO 时间 → YYYY-MM-DD */
    function formatDate(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        return d.toISOString().slice(0, 10);
    }

    /* ---------- OBS 桶列表获取与解析 ---------- */

    async function fetchBucketList() {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
        try {
            const res = await fetch(`${BUCKET_URL}?prefix=${PREFIX}`, {
                signal: controller.signal,
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const list = parseBucketXml(await res.text());
            if (!list || !list.length) throw new Error("empty list");
            return list;
        } finally {
            clearTimeout(timer);
        }
    }

    /* 解析 OBS ListBucketResult XML（按 localName 兼容命名空间） */
    function parseBucketXml(text) {
        const doc = new DOMParser().parseFromString(text, "application/xml");
        const root = doc.documentElement;
        if (!root || root.localName !== "ListBucketResult") return null;

        const list = [];
        for (const node of root.children) {
            if (node.localName !== "Contents") continue;
            let key = "";
            let size = 0;
            let modified = "";
            for (const child of node.children) {
                const name = child.localName;
                if (name === "Key") key = child.textContent;
                else if (name === "Size") size = Number(child.textContent) || 0;
                else if (name === "LastModified") modified = child.textContent;
            }
            if (key) list.push({ key, size, modified });
        }
        /* 去重（按 Key），保护冗余 */
        return [...new Map(list.map((e) => [e.key, e])).values()];
    }

    /* ---------- 名称/格式匹配 ---------- */

    function matchPlatform(filename, fallback) {
        if (/mac/i.test(filename)) return "macOS · ARM64";
        if (/win/i.test(filename)) return "Windows x64";
        if (/linux/i.test(filename)) return "Linux x64";
        return fallback || "全平台";
    }

    function matchItem(entry) {
        const filename = entry.key.slice(PREFIX.length);
        if (!filename) return null;

        const ext = (filename.split(".").pop() || "").toLowerCase();
        const override = NAME_OVERRIDES[filename] || null;
        const rule = override
            ? null
            : FILE_RULES.find((r) => r.pattern.test(filename));
        const effective = override || rule;

        const version = (filename.match(/v?(\d+(?:\.\d+)+)/i) || [])[1] || "";
        const platform = matchPlatform(filename, effective && effective.platform);
        const context = { filename, version, platform };

        const desc = effective && typeof effective.desc === "function"
            ? effective.desc(context)
            : effective && effective.desc
                ? effective.desc
                : `自动同步资源（${platform}）`;

        return {
            title: filename,
            desc,
            icon: ICON_BY_EXT[ext] || "file",
            platform,
            size: formatSize(entry.size),
            bytes: entry.size,
            url: BUCKET_URL + entry.key,
            modified: entry.modified,
            groupId: effective ? effective.group : "others",
        };
    }

    /* 桶列表 → 分组结构（空分组不显示，未匹配进"其他资源"） */
    function buildRemoteGroups(list) {
        const groups = new Map(GROUP_META.map((g) => [g.id, { ...g, items: [] }]));
        const others = { ...OTHERS_META, items: [] };
        let updated = "";

        list.forEach((entry) => {
            if (!entry.key.startsWith(PREFIX) || entry.key === PREFIX) return;
            if (!entry.size) return; // 目录占位对象
            const item = matchItem(entry);
            if (!item) return;

            if (item.modified > updated) updated = item.modified;

            const bucket = item.groupId === "others"
                ? others
                : groups.get(item.groupId);
            if (!bucket) return;
            bucket.items.push(item);
        });

        const ordered = GROUP_META.map((g) => groups.get(g.id))
            .filter((g) => g.items.length)
            .concat(others.items.length ? [others] : []);
        return { groups: ordered, updated: formatDate(updated) };
    }

    /* ---------- 渲染 ---------- */

    function renderStats(container, groups, updated) {
        const items = groups.flatMap((group) => group.items);
        const totalBytes = items.reduce((sum, item) => sum + (item.bytes || 0), 0);

        const stats = [
            [String(items.length), "可用文件"],
            [formatTotal(totalBytes), "资源总量"],
            [updated || "—", "最近更新"],
        ];
        stats.forEach(([value, label]) => {
            const stat = el("div", "stat");
            stat.append(el("strong", null, value), el("span", null, label));
            container.append(stat);
        });
    }

    function renderCard(item, no) {
        const card = el("article", "card");

        const top = el("div", "card-top");
        const icon = el("div", `app-icon icon-${item.icon || "file"}`);
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = (item.icon || "file").toUpperCase().slice(0, 3);
        const num = el("span", "card-no", no);
        num.setAttribute("aria-hidden", "true");
        top.append(icon, num);

        const title = el("h3", "card-title", item.title);
        const desc = el("p", "card-desc", item.desc);
        const meta = el("div", "card-meta");
        meta.append(buildTag(item.platform), el("span", "meta-size", item.size));

        const link = el("a", "download");
        link.href = item.url;
        link.setAttribute("aria-label", `下载 ${item.title}`);
        link.append(document.createTextNode("立即下载 "));
        const arrow = el("span", "dl-arrow", "↓");
        arrow.setAttribute("aria-hidden", "true");
        link.append(arrow);

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
            cards.append(renderCard(item, String(counter.count).padStart(2, "0")));
        });

        section.append(head, cards);
        return section;
    }

    function renderGroups(catalog, stats, groups, updated) {
        renderStats(stats, groups, updated);
        const counter = { count: 0 };
        groups.forEach((group) => catalog.append(renderGroup(group, counter)));
    }

    /* ---------- 入口（冗余保护） ---------- */

    async function init() {
        const catalog = document.getElementById("catalog");
        const stats = document.getElementById("hero-stats");
        if (!catalog) return;

        let groups = null;
        let updated = (DATA && DATA.updated) || "";
        let sourceLabel = "";

        /* 1) 尝试 OBS 实时列表 */
        try {
            const list = await fetchBucketList();
            const remote = buildRemoteGroups(list);
            if (remote.groups.length) {
                groups = remote.groups;
                updated = remote.updated;
                sourceLabel = `数据源：OBS 实时列表 · 更新于 ${remote.updated}`;
            }
        } catch {
            /* 网络错误 / 超时 / CORS 拦截：进入本地冗余 */
        }

        /* 2) 冗余降级：本地数据模块 */
        if (!groups) {
            if (DATA && Array.isArray(DATA.groups) && DATA.groups.length) {
                groups = DATA.groups;
                sourceLabel = "数据源：本地缓存（OBS 实时列表不可用，已自动降级）";
            } else {
                catalog.append(el("p", "noscript-tip", "资源数据加载失败，请刷新重试。"));
                return;
            }
        }

        /* 3) 渲染（渲染异常时再次降级到本地数据） */
        try {
            renderGroups(catalog, stats, groups, updated);
        } catch {
            catalog.replaceChildren();
            if (DATA && Array.isArray(DATA.groups)) {
                renderGroups(catalog, stats, DATA.groups, DATA.updated);
                sourceLabel = "数据源：本地缓存（渲染实时列表时发生异常）";
            } else {
                catalog.append(el("p", "noscript-tip", "资源数据加载失败，请刷新重试。"));
                return;
            }
        }

        catalog.append(el("p", "data-source", sourceLabel));
    }

    init();
})();


/* ============================================================
 * Surayson 下载站 · 平台标签检测（原生 JS，无依赖）
 *
 * 匹配规则（声明式）：
 *   #1 Windows x64
 *   #2 macOS aarch64
 *   #3 Linux x64（预留，暂无对应资源）
 *
 * 作用：把卡片中的平台标签卡（.badge）替换为纯文本编号标签（.tag），
 *       例如 "Windows x64" → "#1 Windows x64"。
 * ============================================================ */

(() => {
    "use strict";

    /* 平台编号 → 匹配规则 与 显示名称 */
    const TAG_RULES = Object.freeze([
        { no: 1, name: "Windows x64", pattern: /win/i },
        { no: 2, name: "macOS aarch64", pattern: /mac/i },
        { no: 3, name: "Linux x64", pattern: /linux/i }, // 预留
    ]);

    const ALL_PLATFORM_PATTERN = /(全平台|all)/i;

    /* 根据标签卡文本检测对应的平台编号；无法识别时返回 null */
    function detect(text) {
        if (ALL_PLATFORM_PATTERN.test(text)) {
            return TAG_RULES.map((rule) => rule.no);
        }
        const nums = TAG_RULES.filter((rule) => rule.pattern.test(text))
            .map((rule) => rule.no);
        return nums.length ? nums : null;
    }

    /* 构造标签编号节点，如 "#1" */
    function createTagNo(label) {
        const span = document.createElement("span");
        span.className = "tag-no";
        span.textContent = label;
        return span;
    }

    /* 将单个标签卡替换为编号标签 */
    function convert(badge) {
        const nums = detect(badge.textContent.trim());
        if (!nums) return; // 无法识别时保留原样

        badge.className = "tag";
        badge.replaceChildren();

        if (nums.length === 1) {
            badge.append(
                createTagNo(`#${nums[0]}`),
                document.createTextNode(` ${TAG_RULES[nums[0] - 1].name}`)
            );
            return;
        }

        /* 多平台（如"全平台"）：仅显示编号，悬停提示完整平台名 */
        badge.append(createTagNo(`#${nums.join(" · #")}`));
        badge.title = nums
            .map((no) => TAG_RULES[no - 1].name)
            .join(" · ");
    }

    document.querySelectorAll(".badge").forEach(convert);
})();


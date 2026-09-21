/* ============================================================
 * Surayson 下载站 · 平台标签检测（原生 JS，无依赖）
 *  匹配关系：
 *    #1 → Windows x64
 *    #2 → macOS aarch64
 *    #3 → Linux x64（预留，暂无对应资源）
 *  将卡片中的平台徽章（标签卡）替换为纯文本编号标签。
 * ============================================================ */

(() => {
    "use strict";

    /* 平台编号 → 名称 的匹配关系 */
    const TAGS = {
        1: "Windows x64",
        2: "macOS aarch64",
        3: "Linux x64", // 预留
    };

    /* 根据徽章文本检测对应的平台编号 */
    function detect(text) {
        const t = text.toLowerCase();
        if (t.includes("全平台") || t.includes("all")) return [1, 2, 3];
        const nums = [];
        if (t.includes("win")) nums.push(1);
        if (t.includes("mac")) nums.push(2);
        if (t.includes("linux")) nums.push(3);
        return nums.length ? nums : null;
    }

    /* 遍历所有徽章，替换为编号标签 */
    document.querySelectorAll(".badge").forEach((el) => {
        const nums = detect(el.textContent.trim());
        if (!nums) return; // 无法识别时保留原样

        el.className = "tag";
        if (nums.length === 1) {
            el.innerHTML = `<i>#${nums[0]}</i> ${TAGS[nums[0]]}`;
        } else {
            el.innerHTML = `<i>#${nums.join(" · #")}</i>`;
            el.title = nums.map((n) => TAGS[n]).join(" · ");
        }
    });
})();

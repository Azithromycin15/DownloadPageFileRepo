/* ============================================================
 * Surayson 下载站 · 鼠标跟随粒子特效（原生 JS，无依赖）
 *  - 粒子在光标位置持续生成，跟随鼠标移动
 *  - 粒子受重力影响向下掉落，渐隐缩小后消失
 *  - 自动适配高分屏（DPR）与窗口缩放
 *  - 遵循 prefers-reduced-motion 无障碍偏好
 * ============================================================ */

(() => {
    "use strict";

    /* 用户偏好"减少动效"时直接禁用 */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* 纯黑粒子 */
    const COLOR = "#000000";

    const MAX_PARTICLES = 300; // 粒子总数上限
    const EMIT_RATE = 1.2;     // 每帧发射粒子数（60fps 基准，保持稀疏）
    const LIFE_MIN = 800;      // 粒子最短寿命（ms）
    const LIFE_MAX = 1500;     // 粒子最长寿命（ms）
    const GRAVITY = 0.035;     // 重力加速度（px/帧²，60fps 基准，轻微）

    /* ---------- 画布 ---------- */

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
        "position:fixed;inset:0;z-index:9999;pointer-events:none;";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d", { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    /* ---------- 粒子 ---------- */

    let particles = [];
    let cursor = null; // 当前光标位置，未进入页面时为 null

    /* 在光标处生成一颗粒子 */
    function spawn() {
        if (particles.length >= MAX_PARTICLES) particles.shift();

        particles.push({
            x: cursor.x + (Math.random() - 0.5) * 8,
            y: cursor.y + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 6,   // 极轻微水平漂移
            vy: Math.random() * 6,           // 缓慢向下
            size: 0.8 + Math.random() * 1.4, // 小颗粒
            color: COLOR,
            born: performance.now(),
            life: LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN),
        });
    }

    /* ---------- 事件 ---------- */

    window.addEventListener("pointermove", (e) => {
        cursor = { x: e.clientX, y: e.clientY };
    });

    /* 光标离开页面后停止生成，已有粒子继续下落 */
    window.addEventListener("pointerleave", () => {
        cursor = null;
    });

    /* ---------- 渲染循环 ---------- */

    let last = performance.now();
    let emitAcc = 0;

    function frame(now) {
        const dt = Math.min((now - last) / 1000, 0.05); // 秒，封顶防跳帧
        last = now;

        /* 持续在光标位置发射粒子（跟随鼠标） */
        if (cursor) {
            emitAcc += EMIT_RATE * dt * 60;
            while (emitAcc >= 1) {
                spawn();
                emitAcc -= 1;
            }
        } else {
            emitAcc = 0;
        }

        ctx.clearRect(0, 0, width, height);

        particles = particles.filter((p) => {
            const age = now - p.born;
            if (age >= p.life) return false;

            /* 重力下落 + 空气阻尼 */
            p.vy = p.vy + GRAVITY * dt * 60;
            p.vx *= 0.96;
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;

            const t = age / p.life; // 0 → 1
            const alpha = (1 - t) * (1 - t); // 渐隐
            const size = p.size * (1 - t * 0.5); // 渐小

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
            return true;
        });

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();


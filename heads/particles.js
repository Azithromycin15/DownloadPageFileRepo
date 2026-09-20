/* ============================================================
 * Surayson 下载站 · 鼠标移动粒子特效（原生 JS，无依赖）
 *  - 仅在鼠标移动时沿轨迹生成 4×4 纯黑方块粒子
 *  - 粒子受轻微重力向下掉落，渐隐后消失
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
    const STEP_DIST = 10;      // 鼠标每移动该距离（px）生成一颗粒子
    const LIFE_MIN = 600;      // 粒子最短寿命（ms）
    const LIFE_MAX = 1000;     // 粒子最长寿命（ms）
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
    let lastX = -1;
    let lastY = -1;

    /* 在指定位置生成一颗粒子（4×4 黑色方块） */
    function spawn(x, y) {
        if (particles.length >= MAX_PARTICLES) particles.shift();

        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 6, // 极轻微水平漂移
            vy: Math.random() * 4,         // 缓慢向下
            size: 4,                       // 4×4 像素
            color: COLOR,
            born: performance.now(),
            life: LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN),
        });
    }

    /* 沿移动路径撒粒子：仅在鼠标移动时生成 */
    function trail(x, y) {
        if (lastX < 0) { // 首次进入页面，只记录位置
            lastX = x;
            lastY = y;
            return;
        }
        const dist = Math.hypot(x - lastX, y - lastY);
        if (dist < STEP_DIST) return;

        const steps = Math.min(6, Math.ceil(dist / STEP_DIST));
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            spawn(lastX + (x - lastX) * t, lastY + (y - lastY) * t);
        }
        lastX = x;
        lastY = y;
    }

    /* ---------- 事件 ---------- */

    window.addEventListener("pointermove", (e) => trail(e.clientX, e.clientY));

    /* 光标离开页面后停止生成，已有粒子继续下落 */
    window.addEventListener("pointerleave", () => {
        lastX = -1;
        lastY = -1;
    });

    /* ---------- 渲染循环 ---------- */

    let last = performance.now();

    function frame(now) {
        const dt = Math.min((now - last) / 1000, 0.05); // 秒，封顶防跳帧
        last = now;

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
            ctx.globalAlpha = (1 - t) * (1 - t); // 渐隐
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            return true;
        });

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();


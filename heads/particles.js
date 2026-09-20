/* ============================================================
 * Surayson 下载站 · 鼠标粒子特效（原生 JS，无依赖）
 *  - 鼠标移动：彩色粒子拖尾
 *  - 鼠标点击：粒子爆裂 + 扩散涟漪
 *  - 自动适配高分屏（DPR）与窗口缩放
 *  - 遵循 prefers-reduced-motion 无障碍偏好
 * ============================================================ */

(() => {
    "use strict";

    /* 用户偏好"减少动效"时直接禁用 */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* 与页面图标同色系的扁平配色（前两个深色权重更高） */
    const COLORS = [
        "#111111", "#111111", "#555555",
        "#2563eb", "#0d9488", "#16a34a", "#7c3aed", "#ea580c",
    ];

    const TRAIL_LIFE = 900;    // 拖尾粒子寿命（ms）
    const CLICK_LIFE = 1100;   // 爆裂粒子寿命（ms）
    const CLICK_COUNT = 18;    // 点击时爆裂粒子数量
    const MAX_PARTICLES = 400; // 粒子总数上限
    const MIN_TRAIL_DIST = 10; // 移动超过该距离才生成粒子

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

    function spawn(x, y, opts = {}) {
        if (particles.length >= MAX_PARTICLES) particles.shift();

        const angle = opts.angle ?? Math.random() * Math.PI * 2;
        const speed = opts.speed ?? 0;
        const jitter = 0.4 + Math.random() * 0.6; // 速度随机系数

        particles.push({
            x, y,
            vx: Math.cos(angle) * speed * jitter,
            vy: Math.sin(angle) * speed * jitter,
            size: opts.size ?? 1.5 + Math.random() * 2.5,
            color: opts.color ?? COLORS[(Math.random() * COLORS.length) | 0],
            born: performance.now(),
            life: opts.life ?? TRAIL_LIFE,
            gravity: opts.gravity ?? 0.03,
            damping: opts.damping ?? 0.93,
            ring: !!opts.ring,
        });
    }

    /* 鼠标拖尾：沿移动路径撒粒子 */
    let lastX = -1;
    let lastY = -1;

    function trail(x, y) {
        const dist = Math.hypot(x - lastX, y - lastY);
        if (dist < MIN_TRAIL_DIST) return;
        lastX = x;
        lastY = y;

        const steps = Math.min(3, Math.ceil(dist / 24));
        for (let i = 0; i < steps; i++) {
            spawn(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8, {
                life: TRAIL_LIFE * (0.7 + Math.random() * 0.5),
                speed: 14 + Math.random() * 18,
                damping: 0.92,
                gravity: 0.035,
                size: 1.2 + Math.random() * 2.2,
            });
        }
    }

    /* 鼠标点击：放射状爆裂 + 涟漪 */
    function burst(x, y) {
        const base = Math.random() * Math.PI * 2;
        for (let i = 0; i < CLICK_COUNT; i++) {
            const angle = base + (i / CLICK_COUNT) * Math.PI * 2;
            spawn(x, y, {
                color: COLORS[2 + ((Math.random() * (COLORS.length - 2)) | 0)],
                angle,
                speed: 90 + Math.random() * 180,
                life: CLICK_LIFE * (0.6 + Math.random() * 0.6),
                damping: 0.9,
                gravity: 0.12,
                size: 1.5 + Math.random() * 2.8,
            });
        }
        spawn(x, y, { color: "#111111", size: 3, life: 520, speed: 0, ring: true });
    }

    /* ---------- 事件 ---------- */

    window.addEventListener("pointermove", (e) => trail(e.clientX, e.clientY));

    window.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return; // 仅左键
        burst(e.clientX, e.clientY);
    });

    /* 鼠标离开窗口后重置轨迹，避免再次进入时拉出长线 */
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

            p.vx *= p.damping;
            p.vy = p.vy * p.damping + p.gravity * dt * 60;
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;

            const t = age / p.life; // 0 → 1
            const alpha = t > 0.7 ? (1 - t) / 0.3 : 1; // 末段渐隐

            if (p.ring) {
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 0.5 + 1.5 * (1 - t);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size + t * 26, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2);
                ctx.fill();
            }
            return true;
        });

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();

import { useEffect, useRef, useState } from 'react';

// 开场：星球入场 —— Canvas 2D 程序化渲染（星空 + 自转星球 + 轨道粒子环），无外部素材。
// 仅当用户点击星球（或按钮聚焦后按 Enter/Space）才进入主页；无自动跳转。
export default function PlanetIntro({ done, onEnter }) {
  const canvasRef = useRef(null);
  const lockedRef = useRef(false);
  const enterStartRef = useRef(0);
  const [locked, setLocked] = useState(false);
  const [canvasFailed, setCanvasFailed] = useState(false);

  useEffect(() => {
    let raf = 0;
    let resizeTimer;
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // 移动端降级：更少粒子、更低 devicePixelRatio
      const mobile = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 560;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

      let w = 0, h = 0, cx = 0, cy = 0, R = 0;
      let stars = [], orbiters = [];

      // 星球表面斑块：确定性伪随机（每次刷新观感一致），球面经度投影实现自转
      let seed = 42;
      const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
      const patches = Array.from({ length: mobile ? 8 : 14 }, () => ({
        lon: rnd() * Math.PI * 2,
        lat: rnd() * 1.5 - 0.75,
        size: 0.14 + rnd() * 0.2,
        light: rnd() > 0.45,
        alpha: 0.1 + rnd() * 0.14,
      }));

      const TILT = -0.32; // 轨道环倾角

      function layout() {
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = w / 2; cy = h * 0.42;
        R = Math.min(w, h) * 0.17;
        const starCount = Math.max(50, Math.min(mobile ? 80 : 130, Math.round(w / (mobile ? 14 : 9))));
        stars = Array.from({ length: starCount }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.5 + Math.random() * 1.2,
          base: 0.25 + Math.random() * 0.6,
          spd: 0.5 + Math.random() * 1.5,
          ph: Math.random() * Math.PI * 2,
          purple: Math.random() < 0.25,
        }));
        orbiters = Array.from({ length: mobile ? 18 : 34 }, () => ({
          a0: Math.random() * Math.PI * 2,
          spd: (0.15 + Math.random() * 0.45) * (Math.random() < 0.85 ? 1 : -1),
          r: 0.7 + Math.random() * 1.5,
          alpha: 0.3 + Math.random() * 0.55,
        }));
      }

      function drawOrbiters(t, rx, ry, fade, back) {
        const cos = Math.cos(TILT), sin = Math.sin(TILT);
        for (const o of orbiters) {
          const ang = o.a0 + (reduced ? 0 : t * o.spd);
          const ex = Math.cos(ang) * rx, ey = Math.sin(ang) * ry;
          if ((ey < 0) !== back) continue; // 远半在星球后面，近半在前面
          const x = cx + ex * cos - ey * sin;
          const y = cy + ex * sin + ey * cos;
          ctx.beginPath();
          ctx.arc(x, y, o.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(165,180,252,' + (o.alpha * fade).toFixed(3) + ')';
          ctx.fill();
        }
      }

      const enterDur = reduced ? 220 : 750;
      let rot = 0;
      let prev = 0;
      function draw(now) {
        const t = now / 1000;
        const dt = prev ? Math.min(0.05, t - prev) : 0.016;
        prev = t;
        if (!reduced) rot += dt * 0.12;

        // 入场过渡：星球冲向镜头（easeInCubic；减少动态效果时改为短促淡出）
        const e = enterStartRef.current ? Math.min(1, (now - enterStartRef.current) / enterDur) : 0;
        const zoom = reduced ? 1 + 2.5 * e * e : 1 + 13 * e * e * e;

        ctx.clearRect(0, 0, w, h);

        // 星空（过渡时向外扩散，营造前进感）
        const zo = 1 + 0.5 * e;
        for (const s of stars) {
          const a = reduced ? s.base : s.base * (0.6 + 0.4 * Math.sin(t * s.spd + s.ph));
          const x = cx + (s.x - cx) * zo, y = cy + (s.y - cy) * zo;
          if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = s.purple ? 'rgba(168,139,250,' + a.toFixed(3) + ')' : 'rgba(255,255,255,' + a.toFixed(3) + ')';
          ctx.fill();
        }

        const PR = R * zoom;
        const fade = 1 - e;

        // 大气光晕
        let g = ctx.createRadialGradient(cx, cy, PR * 0.6, cx, cy, PR * 2.1);
        g.addColorStop(0, 'rgba(99,102,241,' + (0.3 * fade + 0.12).toFixed(3) + ')');
        g.addColorStop(0.4, 'rgba(99,102,241,0.1)');
        g.addColorStop(1, 'rgba(99,102,241,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, PR * 2.1, 0, Math.PI * 2); ctx.fill();

        // 轨道环与远半粒子（画在星球后）
        const rx = PR * 1.9, ry = PR * 0.52;
        ctx.strokeStyle = 'rgba(129,140,248,' + (0.14 * fade).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, TILT, 0, Math.PI * 2);
        ctx.stroke();
        drawOrbiters(t, rx, ry, fade, true);

        // 星球本体：左上光源的球体渐变
        g = ctx.createRadialGradient(cx - PR * 0.38, cy - PR * 0.38, PR * 0.1, cx, cy, PR);
        g.addColorStop(0, '#b3bcff');
        g.addColorStop(0.28, '#7d80f2');
        g.addColorStop(0.58, '#4f46b8');
        g.addColorStop(0.82, '#2a2470');
        g.addColorStop(1, '#16113c');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, PR, 0, Math.PI * 2); ctx.fill();

        // 表面斑块：经度随 rot 前移，转到背面（cos≤0）隐藏，宽度按 cos 收缩模拟球面
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, PR, 0, Math.PI * 2); ctx.clip();
        for (const p of patches) {
          const lon = p.lon + rot;
          const c = Math.cos(lon);
          if (c <= 0.04) continue;
          const sx = cx + Math.sin(lon) * Math.cos(p.lat) * PR;
          const sy = cy + Math.sin(p.lat) * PR;
          ctx.beginPath();
          ctx.ellipse(sx, sy, p.size * PR * c, p.size * PR * 0.7, 0, 0, Math.PI * 2);
          ctx.fillStyle = p.light
            ? 'rgba(180,190,255,' + p.alpha.toFixed(3) + ')'
            : 'rgba(18,14,58,' + (p.alpha + 0.05).toFixed(3) + ')';
          ctx.fill();
        }
        ctx.restore();

        // 受光侧轮廓光
        ctx.strokeStyle = 'rgba(199,210,254,' + (0.5 * fade + 0.1).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1, PR * 0.012);
        ctx.beginPath();
        ctx.arc(cx, cy, PR - ctx.lineWidth * 0.5, Math.PI * 1.15, Math.PI * 1.75);
        ctx.stroke();

        // 近半轨道粒子（画在星球前）
        drawOrbiters(t, rx, ry, fade, false);

        // 冲镜闪光
        if (e > 0) {
          g = ctx.createRadialGradient(cx, cy, 0, cx, cy, PR);
          g.addColorStop(0, 'rgba(224,231,255,' + (e * e * 0.85).toFixed(3) + ')');
          g.addColorStop(0.6, 'rgba(129,140,248,' + (e * e * 0.5).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(129,140,248,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(cx, cy, PR, 0, Math.PI * 2); ctx.fill();
        }

        if (e >= 1) return; // 过渡完成，停止渲染循环
        raf = requestAnimationFrame(draw);
      }

      layout();
      raf = requestAnimationFrame(draw);
      const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150); };
      window.addEventListener('resize', onResize);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
      };
    } catch {
      setCanvasFailed(true); // Canvas 不可用：CSS 静态星球降级，按钮仍可点击进入
    }
  }, []);

  const handleEnter = () => {
    if (lockedRef.current) return; // 点击后立即锁定，防止重复触发
    lockedRef.current = true;
    setLocked(true);
    enterStartRef.current = performance.now();
    onEnter();
  };

  return (
    <div id="intro" className={done ? 'done' : ''}>
      {canvasFailed && <div className="planet-css" aria-hidden="true"></div>}
      <canvas ref={canvasRef} className="planet-canvas" aria-hidden="true"></canvas>
      {!locked && !done && (
        <>
          <button
            type="button"
            className="planet-btn"
            autoFocus
            aria-label="点击星球，进入 OpenUMR"
            onClick={handleEnter}
          ></button>
          <div className="planet-hint">点击星球，进入 OpenUMR</div>
        </>
      )}
      <div className="planet-brand" aria-hidden="true">
        <div className="b-mark">UMR</div>
        <div>OPEN · UMR</div>
      </div>
    </div>
  );
}

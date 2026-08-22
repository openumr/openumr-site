import { useEffect, useRef, useState } from 'react';

// 开场：星球入场 —— 写实地球（Canvas 2D）。
// 视觉规格：海洋 #1E3A8A / 高光 #E0F2FE / 阴影 #0F172A / 大气辉光 #87CEEB（宽约直径 1/10）；
// 大陆为降饱和蓝灰，程序化 fBm 值噪声生成，云层赤道厚极地薄缓慢漂移；光源固定左上 10 点钟方向。
// 交互契约：点击星球 / Enter / Space 进入主页（≤1s 冲镜过渡 + 锁定），无自动跳转。
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
      const mobile = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 560;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

      let w = 0, h = 0, cx = 0, cy = 0, R = 0;
      let stars = [];

      // ============ 程序化纹理（一次性生成，等距柱状投影，经度无缝环绕） ============
      function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
          a |= 0; a = (a + 0x6D2B79F5) | 0;
          let t = Math.imul(a ^ (a >>> 15), 1 | a);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      }
      // 格点值噪声采样器：u 以格宽取模实现经度无缝
      function makeSampler(lattice, lw, lh) {
        return function (u, v) {
          let iu = Math.floor(u), fv = u - iu;
          let iv = Math.floor(v), fu = v - iv;
          const s = fv * fv * (3 - 2 * fv), t = fu * fu * (3 - 2 * fu);
          const x0 = ((iu % lw) + lw) % lw, x1 = (x0 + 1) % lw;
          const y0 = Math.min(lh - 1, Math.max(0, iv)), y1 = Math.min(lh - 1, y0 + 1);
          const a = lattice[y0 * lw + x0], b = lattice[y0 * lw + x1];
          const c = lattice[y1 * lw + x0], d = lattice[y1 * lw + x1];
          return a + (b - a) * s + (c - a) * t + (a - b - c + d) * s * t;
        };
      }
      function makeLattice(lw, lh, rnd) {
        const l = new Float32Array(lw * lh);
        for (let i = 0; i < l.length; i++) l[i] = rnd();
        return l;
      }
      function fbm(samp, u, v, oct) {
        let sum = 0, amp = 0.5, tot = 0;
        for (let o = 0; o < oct; o++) {
          sum += samp(u, v) * amp; tot += amp;
          amp *= 0.5; u *= 2; v *= 2;
        }
        return sum / tot;
      }
      const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
      const smooth = (a, b, v) => { const x = clamp01((v - a) / (b - a)); return x * x * (3 - 2 * x); };
      const mix = (a, b, k) => a + (b - a) * k;

      // 地表纹理：海洋主导 + 低频大陆（软边缘）+ 陆地颗粒 + 极地淡冰 + 海洋细反光
      // 云层纹理：白色 alpha，赤道厚极地薄，独立经度漂移
      function buildTextures() {
        const W = 384, H = 192;
        const rndS = mulberry32(20260822), rndC = mulberry32(88041255);
        const contS = makeSampler(makeLattice(13, 7, rndS), 13, 7);       // 低频大陆轮廓
        const grainS = makeSampler(makeLattice(96, 48, rndS), 96, 48);    // 陆地颗粒
        const oceanS = makeSampler(makeLattice(48, 24, rndS), 48, 24);    // 海面反光起伏
        const cloudS = makeSampler(makeLattice(11, 6, rndC), 11, 6);
        const cloudG = makeSampler(makeLattice(64, 32, rndC), 64, 32);

        const surf = document.createElement('canvas'); surf.width = W; surf.height = H;
        const sctx = surf.getContext('2d');
        const simg = sctx.createImageData(W, H);
        const clouds = document.createElement('canvas'); clouds.width = W; clouds.height = H;
        const cctx = clouds.getContext('2d');
        const cimg = cctx.createImageData(W, H);

        // OCEAN #1E3A8A(30,58,138)  HI #E0F2FE(224,242,254)  SHADOW #0F172A(15,23,42)  LAND 蓝灰(96,113,140)
        for (let y = 0; y < H; y++) {
          const v = y / H;
          const lat = v * 2 - 1;                          // -1 南极 … 1 北极
          const polar = smooth(0.78, 0.96, Math.abs(lat));
          const cloudLat = 0.3 + 0.7 * Math.pow(1 - Math.abs(lat), 1.3); // 赤道厚、极地薄
          for (let x = 0; x < W; x++) {
            const u = x / W;
            const i = (y * W + x) * 4;
            // 地表
            const n = fbm(contS, u * 13, v * 7, 4);
            const landK = smooth(0.5, 0.585, n);          // 大陆软边缘
            const gr = fbm(grainS, u * 96, v * 48, 2);    // 陆地地形颗粒
            const oc = fbm(oceanS, u * 48, v * 24, 3);    // 海面细反光
            let r = mix(30 + (oc - 0.5) * 16, 96 + (gr - 0.5) * 26, landK);
            let g = mix(58 + (oc - 0.5) * 20, 113 + (gr - 0.5) * 30, landK);
            let b = mix(138 + (oc - 0.5) * 26, 140 + (gr - 0.5) * 30, landK);
            const ice = polar * (0.5 + 0.5 * landK);      // 极地冰盖（陆上更实）
            r = mix(r, 216, ice); g = mix(g, 234, ice); b = mix(b, 250, ice);
            simg.data[i] = r; simg.data[i + 1] = g; simg.data[i + 2] = b; simg.data[i + 3] = 255;
            // 云层
            const cn = fbm(cloudS, u * 11, v * 6, 4) * 0.72 + fbm(cloudG, u * 64, v * 32, 2) * 0.28;
            const dens = smooth(0.48, 0.74, cn) * cloudLat;
            cimg.data[i] = 244; cimg.data[i + 1] = 250; cimg.data[i + 2] = 255;
            cimg.data[i + 3] = Math.round(clamp01(dens) * 150);
          }
        }
        sctx.putImageData(simg, 0, 0);
        cctx.putImageData(cimg, 0, 0);
        return { surf, clouds };
      }
      const tex = buildTextures();

      function layout() {
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = w / 2; cy = h * 0.42;
        R = Math.min(w, h) * 0.26; // 星球放大（直径 52vmin）
        // 背景星点：极少量、极细微，不抢主体
        const starCount = mobile ? 8 : 14;
        stars = Array.from({ length: starCount }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.4 + Math.random() * 0.7,
          base: 0.14 + Math.random() * 0.26,
          spd: 0.4 + Math.random() * 1.2,
          ph: Math.random() * Math.PI * 2,
        }));
      }

      // 列条带球面贴图：把等距柱状纹理按经度投影到球面（横向自然透视收缩）
      function drawSphereLayer(texture, rot, PR) {
        const tw = texture.width, th = texture.height;
        const step = PR > 150 ? 2 : 1;
        for (let x = -PR + step * 0.5; x < PR; x += step) {
          const hh = Math.sqrt(PR * PR - x * x);
          if (hh < 0.5) continue;
          const ang = Math.asin(Math.max(-1, Math.min(1, x / PR)));
          let u = ((rot + ang) / (Math.PI * 2)) % 1; if (u < 0) u += 1;
          const sx = u * tw;
          const sw = Math.min(tw / 8, Math.max(1, (step / (2 * PR)) * tw * 1.6));
          ctx.drawImage(texture, sx, 0, sw, th, cx + x - step * 0.5, cy - hh, step, hh * 2);
          if (sx + sw > tw) { // 经度环绕接缝补画
            ctx.drawImage(texture, sx - tw, 0, sw, th, cx + x - step * 0.5, cy - hh, step, hh * 2);
          }
        }
      }

      const enterDur = reduced ? 220 : 750;
      function draw(now) {
        const t = now / 1000;
        const rotS = reduced ? 0.9 : 0.9 + t * 0.05;   // 地表缓慢自转（约 2 分钟一圈）
        const rotC = reduced ? 1.2 : 1.2 + t * 0.068;  // 云层略快漂移
        const breath = reduced ? 0 : Math.sin(t * 0.6) * 0.06;

        // 入场过渡：星球冲向镜头（easeInCubic；减少动态效果时改为短促淡出）
        const e = enterStartRef.current ? Math.min(1, (now - enterStartRef.current) / enterDur) : 0;
        const zoom = reduced ? 1 + 2.5 * e * e : 1 + 13 * e * e * e;

        ctx.clearRect(0, 0, w, h);

        // 星点（过渡时向外扩散，营造前进感）
        const zo = 1 + 0.5 * e;
        for (const s of stars) {
          const a = reduced ? s.base : s.base * (0.6 + 0.4 * Math.sin(t * s.spd + s.ph));
          const x = cx + (s.x - cx) * zo, y = cy + (s.y - cy) * zo;
          if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(203,230,255,' + a.toFixed(3) + ')';
          ctx.fill();
        }

        const PR = R * zoom;
        const fade = 1 - e;

        // 大气辉光 #87CEEB：宽约直径 1/10（R → 1.2R），轻微呼吸
        let g = ctx.createRadialGradient(cx, cy, PR * 0.9, cx, cy, PR * 1.2);
        g.addColorStop(0, 'rgba(135,206,235,' + (0.34 * (1 + breath) * fade).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(135,206,235,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, PR * 1.2, 0, Math.PI * 2); ctx.fill();
        // 贴合星球的内圈大气
        g = ctx.createRadialGradient(cx, cy, PR * 0.82, cx, cy, PR * 1.02);
        g.addColorStop(0, 'rgba(135,206,235,0)');
        g.addColorStop(0.85, 'rgba(135,206,235,' + (0.2 * (1 + breath) * fade + 0.06).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(135,206,235,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, PR * 1.02, 0, Math.PI * 2); ctx.fill();

        // 星球本体：地表 + 云层（列条带贴图）+ 光影
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, PR, 0, Math.PI * 2); ctx.clip();
        drawSphereLayer(tex.surf, rotS, PR);
        drawSphereLayer(tex.clouds, rotC, PR);

        // 光影：光源左上 10 点钟，高光 #E0F2FE、背光 #0F172A，柔和过渡（晨昏线固定于光源方向）
        const lx = cx - PR * 0.42, ly = cy - PR * 0.42;
        g = ctx.createRadialGradient(lx, ly, PR * 0.05, lx, ly, PR * 2.05);
        g.addColorStop(0, 'rgba(224,242,254,0.5)');
        g.addColorStop(0.3, 'rgba(224,242,254,0.1)');
        g.addColorStop(0.52, 'rgba(15,23,42,0)');
        g.addColorStop(0.78, 'rgba(15,23,42,0.5)');
        g.addColorStop(1, 'rgba(15,23,42,0.85)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - PR, cy - PR, PR * 2, PR * 2);

        // 边缘光：右下暗部一圈极细蓝白反光，增强球体感
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(224,242,254,' + (0.16 * fade + 0.05).toFixed(3) + ')';
        ctx.lineWidth = Math.max(2.5, PR * 0.028);
        ctx.beginPath(); ctx.arc(cx, cy, PR - ctx.lineWidth * 0.55, Math.PI * 0.08, Math.PI * 0.46); ctx.stroke();
        ctx.strokeStyle = 'rgba(224,242,254,' + (0.34 * fade + 0.06).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1, PR * 0.012);
        ctx.beginPath(); ctx.arc(cx, cy, PR - ctx.lineWidth * 0.5, Math.PI * 0.14, Math.PI * 0.4); ctx.stroke();
        ctx.restore();

        // 冲镜闪光（蓝白）
        if (e > 0) {
          g = ctx.createRadialGradient(cx, cy, 0, cx, cy, PR);
          g.addColorStop(0, 'rgba(224,242,254,' + (e * e * 0.85).toFixed(3) + ')');
          g.addColorStop(0.6, 'rgba(135,206,235,' + (e * e * 0.5).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(135,206,235,0)');
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

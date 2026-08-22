import { useEffect, useRef } from 'react';

// 动态星空背景（canvas）：星点缓慢上浮 + 闪烁，部分星点带紫色
export default function Starfield() {
  const ref = useRef(null);

  useEffect(() => {
    const sf = ref.current;
    const sx = sf.getContext('2d');
    let SW, SH, stars = [];
    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    // 无障碍：系统开启「减少动态效果」时不启动星空动画
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initStars() {
      SW = sf.width = window.innerWidth * dpr;
      SH = sf.height = window.innerHeight * dpr;
      const count = Math.min(150, Math.floor(window.innerWidth / 8));
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * SW,
          y: Math.random() * SH,
          r: (0.6 + Math.random() * 1.4) * dpr,
          base: 0.35 + Math.random() * 0.55,
          tw: Math.random() * Math.PI * 2,
          spd: 0.008 + Math.random() * 0.02,
          vy: (0.08 + Math.random() * 0.3) * dpr,
          purple: Math.random() < 0.3,
        });
      }
    }
    function tickStars() {
      sx.clearRect(0, 0, SW, SH);
      for (const s of stars) {
        s.tw += s.spd;
        const a = s.base * (0.6 + 0.4 * Math.sin(s.tw));
        s.y += s.vy;
        if (s.y > SH + 4) { s.y = -4; s.x = Math.random() * SW; }
        sx.beginPath();
        sx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        sx.fillStyle = s.purple
          ? `rgba(168,139,250,${a})`
          : `rgba(255,255,255,${a})`;
        sx.fill();
      }
      raf = requestAnimationFrame(tickStars);
    }

    if (!reduced) {
      initStars();
      tickStars();
      window.addEventListener('resize', initStars);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', initStars);
    };
  }, []);

  return <canvas id="starfield" ref={ref} aria-hidden="true"></canvas>;
}

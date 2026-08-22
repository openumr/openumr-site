import { useEffect, useRef } from 'react';

// 粒子背景（canvas）：主页面可见后才启动（节省资源），由 App 通过 active 点亮
export default function Particles({ active }) {
  const canvasRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    let raf = 0;
    let meteorTimer;
    let started = false;
    let W, H;
    let particles = [];
    const meteors = [];
    const N = 90;

    function resize() {
      W = canvas.width = window.innerWidth * devicePixelRatio;
      H = canvas.height = window.innerHeight * devicePixelRatio;
    }
    function spawnParticles() {
      particles = [];
      for (let i = 0; i < N; i++) {
        particles.push({
          x: Math.random() * W, y: Math.random() * H,
          r: (Math.random() * 1.6 + 0.4) * devicePixelRatio,
          vx: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
          vy: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
          a: Math.random() * 0.5 + 0.15,
          tw: Math.random() * Math.PI * 2,
        });
      }
    }
    function spawnMeteor() {
      meteors.push({
        x: Math.random() * W * 0.7 + W * 0.15,
        y: Math.random() * H * 0.3,
        vx: (Math.random() * 2 + 3) * devicePixelRatio,
        vy: (Math.random() * 1 + 1.2) * devicePixelRatio,
        life: 1, len: 60 * devicePixelRatio,
      });
    }
    function tick() {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      // 粒子
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.tw += 0.02;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
        const alpha = p.a * (0.7 + 0.3 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129,140,248,${alpha})`;
        ctx.fill();
      }
      // 流星
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx; m.y += m.vy; m.life -= 0.012;
        if (m.life <= 0 || m.y > H) { meteors.splice(i, 1); continue; }
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * m.len / 10, m.y - m.vy * m.len / 10);
        grad.addColorStop(0, `rgba(165,180,252,${0.75 * m.life})`);
        grad.addColorStop(1, 'rgba(165,180,252,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 1.4 * devicePixelRatio;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * m.len / 10, m.y - m.vy * m.len / 10);
        ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (started) return;
      started = true;
      tick();
    }

    // 无障碍：系统开启「减少动态效果」时不启动粒子循环
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      if (!reduced) {
        resize();
        spawnParticles();
        window.addEventListener('resize', resize);
        meteorTimer = setInterval(() => { if (meteors.length < 3) spawnMeteor(); }, 3200);
        startRef.current = start;
      }
    } catch (e) {
      document.documentElement.setAttribute('data-err-particles', e.message);
    }

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(meteorTimer);
      cancelAnimationFrame(raf);
      startRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (active && startRef.current) startRef.current();
  }, [active]);

  return <canvas id="particles" ref={canvasRef} aria-hidden="true"></canvas>;
}

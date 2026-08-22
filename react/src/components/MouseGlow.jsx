import { useEffect, useRef } from 'react';

// 鼠标光晕跟随（失败仅失去光晕效果）
export default function MouseGlow() {
  const ref = useRef(null);

  useEffect(() => {
    try {
      // 无障碍：系统开启「减少动态效果」时不启动跟随动画
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const glow = ref.current;
      let glowX = window.innerWidth / 2, glowY = window.innerHeight * 0.4;
      let tx = glowX, ty = glowY;
      let raf = 0;
      const onMove = (e) => { tx = e.clientX; ty = e.clientY; };
      window.addEventListener('mousemove', onMove);
      (function glowLoop() {
        glowX += (tx - glowX) * 0.08;
        glowY += (ty - glowY) * 0.08;
        glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;
        raf = requestAnimationFrame(glowLoop);
      })();
      return () => {
        window.removeEventListener('mousemove', onMove);
        cancelAnimationFrame(raf);
      };
    } catch (e) {
      document.documentElement.setAttribute('data-err-glow', e.message);
    }
  }, []);

  return <div className="mouse-glow" ref={ref} aria-hidden="true"></div>;
}

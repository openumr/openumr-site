import { useEffect, useState } from 'react';
import PlanetIntro from './components/PlanetIntro.jsx';
import Particles from './components/Particles.jsx';
import MouseGlow from './components/MouseGlow.jsx';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import ShotPreview from './components/ShotPreview.jsx';
import StatsBand from './components/StatsBand.jsx';
import Pipeline from './components/Pipeline.jsx';
import Features from './components/Features.jsx';
import Principles from './components/Principles.jsx';
import Roadmap from './components/Roadmap.jsx';
import Faq from './components/Faq.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import GateModal from './components/GateModal.jsx';

export default function App() {
  // 星球开场：同一会话内已进入过主页则刷新不再展示（sessionStorage，新会话重新展示）
  const [introDone, setIntroDone] = useState(() => sessionStorage.getItem('umr_intro_done') === '1');
  // 主页在开场遮罩下已渲染就绪；点击进入的同一时刻点亮粒子背景，无白屏等待
  const [particlesOn, setParticlesOn] = useState(introDone);
  const [gateOpen, setGateOpen] = useState(false);
  const openGate = () => setGateOpen(true);

  const enterMain = () => {
    sessionStorage.setItem('umr_intro_done', '1');
    setParticlesOn(true);
    setIntroDone(true);
  };

  // 滚动渐入：reveal-ok 门控 —— 本段挂掉时内容直接可见，不会白屏
  useEffect(() => {
    let ok = false;
    let cleanup = () => {};
    try {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.18 });
      document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
      // 兜底：后台标签页 IO 不触发时，用 scroll/定时检查保证渐入生效
      const maybeReveal = () => {
        document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
          const r = el.getBoundingClientRect();
          // 顶部低于视口88%线即触发（含已被锚点/快速滚动跳过的元素，杜绝空白区块）
          if (r.top < window.innerHeight * 0.88) el.classList.add('in');
        });
      };
      window.addEventListener('scroll', maybeReveal, { passive: true });
      const interval = setInterval(maybeReveal, 600);
      maybeReveal();
      ok = true;
      cleanup = () => {
        window.removeEventListener('scroll', maybeReveal);
        clearInterval(interval);
        io.disconnect();
      };
    } catch (e) {
      document.documentElement.setAttribute('data-err-reveal', e.message);
    }
    if (ok) document.documentElement.classList.add('reveal-ok');
    return cleanup;
  }, []);

  return (
    <>
      <PlanetIntro done={introDone} onEnter={enterMain} />

      <div id="main" className={introDone ? 'show' : ''}>
        <Particles active={particlesOn} />
        <div className="aurora"></div>
        <div className="noise"></div>
        <MouseGlow />

        <Nav onOpenGate={openGate} />
        <Hero onOpenGate={openGate} />
        <ShotPreview onOpenGate={openGate} />
        <StatsBand />
        <Pipeline />
        <Features onOpenGate={openGate} />
        <Principles />
        <Roadmap />
        <Faq />
        <SiteFooter onOpenGate={openGate} />
      </div>

      <GateModal open={gateOpen} onClose={() => setGateOpen(false)} />
    </>
  );
}

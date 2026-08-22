import { useState } from 'react';

const HOT_TAGS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD', 'NFLX', 'AVGO', 'INTC', 'QCOM'];

export default function Hero({ onOpenGate }) {
  const [query, setQuery] = useState('');

  return (
    <section className="hero" id="top">
      <div className="grid-bg"></div>
      <div className="hero-inner">
        <div className="kicker">OPEN UMR · US EQUITIES</div>
        <h1>开放的数据<br /><em>看见真实</em></h1>
        <p className="sub">5,000+ 美股标的的行情与数据 —— 来源公开、算法透明、人人可审计，不做黑箱。</p>
        <div className="cta-row">
          <button className="btn btn-primary" onClick={onOpenGate}>进入数据大厅</button>
          <a className="btn btn-ghost" href="#pipeline">了解更多</a>
        </div>
        <div className="hero-right">
          <div className="neon-box">
            <div className="neon-head"><span className="live"></span>DATA HALL · 数据大厅</div>
            <div className="neon-input-wrap">
              <input
                type="text"
                placeholder="输入股票代码，如 AAPL、TSLA、NVDA…"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onOpenGate(); }}
              />
              <button className="neon-go" title="进入数据大厅" onClick={onOpenGate}>→</button>
            </div>
            <div className="neon-tags">
              <div className="neon-track">
                <div className="neon-set">
                  {HOT_TAGS.map((t) => (
                    <span key={t} onClick={() => { setQuery(t); onOpenGate(); }}>{t}</span>
                  ))}
                </div>
                <div className="neon-set" aria-hidden="true">
                  {HOT_TAGS.map((t) => (
                    <span key={`dup-${t}`}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="neon-foot">5,000+ 美股标的 <span className="sep"></span> 数据公开 · 可审计</div>
          </div>
        </div>
        <div className="hero-trust">
          <div className="dot"></div>
          <span>NYSE</span><span>NASDAQ</span><span>SEC EDGAR</span><span>FINRA</span>
        </div>
      </div>
      <div id="scrollHint">
        <div className="wheel"></div>
        <div>SCROLL</div>
      </div>
    </section>
  );
}

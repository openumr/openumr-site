const WATCHLIST = [
  { sym: 'AAPL', name: '苹果', price: '268.42', chg: '+0.46%', dir: 'up' },
  { sym: 'NVDA', name: '英伟达', price: '187.90', chg: '+2.24%', dir: 'up' },
  { sym: 'TSLA', name: '特斯拉', price: '412.55', chg: '-1.97%', dir: 'down' },
  { sym: 'MSFT', name: '微软', price: '512.18', chg: '+0.67%', dir: 'up' },
];

export default function Features({ onOpenGate }) {
  return (
    <section className="feat-sec" id="features">
      <div className="sec-head center reveal">
        <div className="kicker">FEATURES · 功能</div>
        <h2>不止是看个报价</h2>
        <p>围绕行情数据构建的实用工具，陆续开放中。</p>
      </div>
      <div className="feat-row reveal">
        <div className="feat-text">
          <div className="feat-num">01 / WATCHLIST</div>
          <h3>自选清单，一键跟踪</h3>
          <p>把关心的标的收进 Watchlist，打开数据大厅一眼看全：最新价、涨跌、盘中表现，90 秒自动刷新，不用一页一页翻。</p>
          <button className="feat-link" onClick={onOpenGate}>查看自选清单 →</button>
        </div>
        <div className="feat-visual">
          <div className="wl-head">
            <div className="wl-title">MY WATCHLIST · 自选</div>
            <div className="wl-count">12 只 · 90s 前更新</div>
          </div>
          {WATCHLIST.map((w) => (
            <div className="wl-item" key={w.sym}>
              <div className="wl-sym">{w.sym}</div>
              <div className="wl-name">{w.name}</div>
              <div className="wl-price">{w.price}</div>
              <div className={`wl-chg ${w.dir}`}>{w.chg}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="feat-row reverse reveal">
        <div className="feat-text">
          <div className="feat-num">02 / OPEN API</div>
          <h3>开放 API，程序可读</h3>
          <p>所有数据都来自公开渠道，理应也能被程序读取。REST 接口建设中：返回 JSON、带缓存、可直连，写脚本拉数据不用爬页面。</p>
          <button className="feat-link" onClick={onOpenGate}>内测期间申请访问 →</button>
        </div>
        <div className="feat-visual">
          <div className="term">
            <div><span className="p">$</span> <span className="c2">curl openumr.com/api/quotes?symbols=AAPL,NVDA</span></div>
            <div><span className="c1">{'{'}</span> <span className="cm">// 内测中 · 即将开放</span></div>
            <div>&nbsp;&nbsp;<span className="c1">"quotes"</span><span className="c2">: [</span></div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="c1">"AAPL"</span><span className="c2">: 268.42</span><span className="up"> +0.46%</span><span className="c2">,</span></div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="c1">"NVDA"</span><span className="c2">: 187.90</span><span className="up"> +2.24%</span></div>
            <div>&nbsp;&nbsp;<span className="c2">]</span></div>
            <div><span className="c1">{'}'}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

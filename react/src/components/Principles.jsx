export default function Principles() {
  return (
    <section className="transparency" id="why" style={{ paddingTop: 110 }}>
      <div className="sec-head center reveal">
        <div className="kicker">PRINCIPLES · 原则</div>
        <h2>不只是一个行情页</h2>
      </div>
      <div className="bento">
        <div className="b-cell w3 reveal">
          <div className="t-ico">🌐</div>
          <h4>数据来源公开</h4>
          <p>NYSE · NASDAQ · SEC EDGAR · FINRA，来源与获取方式全部公开。</p>
          <div className="b-metric"><b>4</b><span>个公开数据源</span></div>
        </div>
        <div className="b-cell w3 reveal" data-delay="1">
          <div className="t-ico">⚡</div>
          <h4>快，而且说实话</h4>
          <p>缓存预热 + 并发抓取，打开就是热的；刷新间隔对用户如实标注，不装实时。</p>
          <div className="b-metric"><b>90s</b><span>行情刷新间隔</span></div>
        </div>
        <div className="b-cell w2 reveal">
          <div className="t-ico">🔍</div>
          <h4>可审计</h4>
          <p>展示数据与源数据可交叉核对，任何人都能验证。</p>
        </div>
        <div className="b-cell w2 reveal" data-delay="1">
          <div className="t-ico">🛰</div>
          <h4>轻量无追踪</h4>
          <p>不埋点、不采集访客数据、不上广告。</p>
        </div>
        <div className="b-cell w2 reveal" data-delay="2">
          <div className="t-ico">🧮</div>
          <h4>算法透明</h4>
          <p>计算逻辑可查看、可复现，无隐藏权重。</p>
        </div>
      </div>
    </section>
  );
}

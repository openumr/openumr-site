const STEPS = [
  {
    step: 'STEP 01', ico: '🌐', title: '数据来源公开', delay: null,
    text: '美股行情与财报数据均取自 NYSE、NASDAQ、SEC EDGAR、FINRA 等公开数据源，来源与获取方式完全公开，不做黑箱聚合。',
  },
  {
    step: 'STEP 02', ico: '🧮', title: '算法透明', delay: '1',
    text: '所有指标计算逻辑可查看、可复现，没有任何隐藏权重或私货公式。改了什么，变更记录公开可查。',
  },
  {
    step: 'STEP 03', ico: '🔍', title: '可审计', delay: '2',
    text: '展示数据与源数据可交叉核对，任何人都能验证我们有没有说谎。发现不一致，欢迎公开打脸。',
  },
];

export default function Pipeline() {
  return (
    <section className="transparency" id="pipeline" style={{ paddingTop: 110 }}>
      <div className="sec-head center reveal">
        <div className="kicker">PIPELINE · 数据管道</div>
        <h2>数据从哪来，一目了然</h2>
        <p>Open 精神不是口号，而是三条可以逐条核验的承诺。美股数据怎么来、怎么算、怎么展示，全部摊开给你看。</p>
      </div>
      <div className="t-grid">
        {STEPS.map((s) => (
          <div className="t-item reveal" key={s.step} data-delay={s.delay}>
            <div className="t-step">{s.step}</div>
            <div className="t-ico">{s.ico}</div>
            <h4>{s.title}</h4>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

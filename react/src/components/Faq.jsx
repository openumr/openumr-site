const FAQS = [
  {
    q: '怎么获得数据大厅的访问密码？', delay: null,
    a: '内测期间密码定向分享给早期用户；想提前体验，可以到 GitHub 仓库提 Issue 或联系作者申请。正式开放后会在本页公布获取方式。',
  },
  {
    q: '数据多久更新一次？行情有延迟吗？', delay: '1',
    a: '行情每 90 秒刷新一次，页面上如实标注最近更新时间 —— 这是「延迟行情」，不是实时行情。做重大决策请以交易所官方数据为准，我们不建议也不希望任何人把延迟数据当作交易依据。',
  },
  {
    q: '和券商 App、行情软件有什么区别？', delay: '2',
    a: '市面工具比的是快和全，OpenUMR 只专注两件事：来源公开、可审计。每个数字从哪来、怎么算出来的都可以查证 —— 我们不追求速度，追求可信。',
  },
  {
    q: '「可审计」具体怎么审？', delay: '3',
    a: '展示的行情与指标都能追溯到公开源数据（NYSE、NASDAQ、SEC EDGAR、FINRA），你可以自行交叉核对。后续会上线一键核对工具，把「可审计」从口号变成按钮。',
  },
  {
    q: '个人项目，会一直维护吗？', delay: '3',
    a: '代码与数据管道全部开源在 GitHub，路线图公开、进度公开。就算哪天停更，社区也能接管 —— 这正是 Open 的意义。',
  },
];

export default function Faq() {
  return (
    <section className="faq-sec" id="faq">
      <div className="sec-head center reveal">
        <div className="kicker">FAQ · 常见问题</div>
        <h2>你可能想问</h2>
      </div>
      <div className="faq-list">
        {FAQS.map((f) => (
          <details className="faq-item reveal" key={f.q} data-delay={f.delay}>
            <summary>{f.q}<span className="fx">+</span></summary>
            <div className="faq-a">{f.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

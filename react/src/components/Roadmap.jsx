const ROADMAP = [
  { tag: '已上线', cls: 'done', title: '数据大厅（内测）', text: '自选清单行情、指数概览、90 秒刷新，密码保护访问。', delay: null },
  { tag: '进行中', cls: 'doing', title: '行情体验优化', text: '缓存预热、并发抓取、加载性能与可审计来源标注。', delay: '1' },
  { tag: '规划中', cls: 'todo', title: '开放 API', text: 'REST 接口，JSON 返回，程序直连读取行情数据。', delay: '2' },
  { tag: '规划中', cls: 'todo', title: '审计工具', text: '数据源交叉核对报表，把「可审计」做成一键可查。', delay: '3' },
];

export default function Roadmap() {
  return (
    <section className="transparency" id="roadmap" style={{ paddingTop: 110 }}>
      <div className="sec-head center reveal">
        <div className="kicker">ROADMAP · 路线</div>
        <h2>建设中，进度公开</h2>
        <p>个人项目，不画大饼 —— 做一块，是一块。</p>
      </div>
      <div className="road-grid">
        {ROADMAP.map((r) => (
          <div className="r-item reveal" key={r.title} data-delay={r.delay}>
            <span className={`r-tag ${r.cls}`}>{r.tag}</span>
            <h4>{r.title}</h4>
            <p>{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

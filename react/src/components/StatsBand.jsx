const STATS = [
  { b: '5,000+', span: '覆盖美股标的' },
  { b: '4', span: '公开数据源' },
  { b: '90s', span: '行情刷新间隔' },
  { b: '100%', span: '数据可审计' },
];

export default function StatsBand() {
  return (
    <section className="stats-band reveal" id="stats">
      {STATS.map((s) => (
        <div className="stat" key={s.span}><b>{s.b}</b><span>{s.span}</span></div>
      ))}
    </section>
  );
}

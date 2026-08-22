const PREVIEW_ROWS = [
  { sym: 'AAPL', name: '苹果', price: '268.42', chg: '+1.24', pct: '+0.46%', dir: 'up' },
  { sym: 'NVDA', name: '英伟达', price: '187.90', chg: '+4.12', pct: '+2.24%', dir: 'up' },
  { sym: 'TSLA', name: '特斯拉', price: '412.55', chg: '-8.30', pct: '-1.97%', dir: 'down' },
  { sym: 'MSFT', name: '微软', price: '512.18', chg: '+3.42', pct: '+0.67%', dir: 'up' },
  { sym: 'AMZN', name: '亚马逊', price: '246.03', chg: '-1.15', pct: '-0.47%', dir: 'down' },
  { sym: 'META', name: 'Meta', price: '738.90', chg: '+9.86', pct: '+1.35%', dir: 'up' },
];

// 数据大厅浏览器窗口预览（mockup）
export default function ShotPreview({ onOpenGate }) {
  return (
    <section className="shot-wrap">
      <div className="shot reveal">
        <div className="shot-bar">
          <span className="d r"></span><span className="d y"></span><span className="d g"></span>
          <div className="shot-url">openumr.com · 数据大厅</div>
        </div>
        <div className="shot-body">
          <table className="shot-table">
            <thead>
              <tr><th>代码</th><th className="hide-s">公司</th><th>最新价</th><th>涨跌额</th><th>涨跌幅</th></tr>
            </thead>
            <tbody>
              {PREVIEW_ROWS.map((r) => (
                <tr key={r.sym}>
                  <td className="sym">{r.sym}</td>
                  <td className="name hide-s">{r.name}</td>
                  <td>{r.price}</td>
                  <td className={r.dir}>{r.chg}</td>
                  <td className={r.dir}>{r.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="shot-lock" onClick={onOpenGate}>
            <div className="lk">🔐</div>
            <div>输入访问密码，解锁完整实时数据</div>
            <div className="go">进入数据大厅 →</div>
          </div>
        </div>
      </div>
    </section>
  );
}

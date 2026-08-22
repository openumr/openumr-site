import { fmt, fmtVol } from './utils.js';

// 统计卡：纳指 100 / 纳指综合（接口有数据才显示）+ 覆盖标的 + 总成交量
export default function StatsCards({ rows, indices }) {
  const upCount = rows.filter(r => r.pct > 0).length;
  const downCount = rows.length - upCount;
  const totalVol = rows.reduce((s, r) => s + (r.volume || 0), 0);
  const ndx = indices.find(i => i.symbol === 'NDX');
  const comp = indices.find(i => i.symbol === 'COMP');

  const idxCard = (ix, sym, label) => {
    if (!ix) return null;
    return (
      <div className="stat" key={sym}>
        <div className="label"><span>{label}</span><span>{sym}</span></div>
        <div className="value">{fmt(ix.price, 2)}</div>
        <div className={`sub ${ix.pct >= 0 ? 'up' : 'down'}`}>
          {ix.pct >= 0 ? '▲' : '▼'} {Math.abs(ix.pct).toFixed(2)}%
        </div>
      </div>
    );
  };

  return (
    <div className="stats">
      {idxCard(ndx, 'NDX', '纳指 100')}
      {idxCard(comp, 'COMP', '纳指综合')}
      <div className="stat" key="coverage">
        <div className="label"><span>覆盖标的</span></div>
        <div className="value">{rows.length}</div>
        <div className="sub">美股 · 热门中概</div>
      </div>
      <div className="stat" key="volume">
        <div className="label"><span>总成交量</span></div>
        <div className="value">{fmtVol(totalVol)}</div>
        <div className="sub">{upCount} 涨 / {downCount} 跌</div>
      </div>
    </div>
  );
}

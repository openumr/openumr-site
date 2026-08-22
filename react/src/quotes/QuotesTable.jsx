import { useMemo } from 'react';
import { fmt, fmtVol, colorFor, getSorted, PIN } from './utils.js';

const COLUMNS = [
  { key: 'symbol', label: '代码' },
  { key: 'name', label: '公司' },
  { key: 'price', label: '价格 (USD)' },
  { key: 'pct', label: '涨跌幅' },
  { key: 'high', label: '今日最高' },
  { key: 'low', label: '今日最低' },
  { key: 'volume', label: '成交量' },
];

export default function QuotesTable({ rows, query, sortKey, sortDir, onSort, onQuery, onOpenKline }) {
  const list = useMemo(
    () => getSorted(rows, query, sortKey, sortDir),
    [rows, query, sortKey, sortDir]
  );
  const maxVol = list.length ? Math.max(...list.map(r => r.volume || 0)) : 0;

  return (
    <div className="panel">
      <div className="toolbar">
        <h2>美股行情 <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>· {list.length} 只股票</span></h2>
        <div className="search">
          <input
            type="text"
            placeholder="搜索代码 / 公司，如 AAPL、Apple…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  aria-sort={sortKey === c.key ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" onClick={() => onSort(c.key)}>
                    {c.label} <span className="arrow">{sortKey === c.key ? (sortDir === 1 ? '▲' : '▼') : ''}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={7} className="empty">{rows.length === 0 ? '数据加载中…' : '没有匹配的股票'}</td></tr>
            ) : list.map((r) => {
              const pct = r.pct || 0;
              const cls = pct >= 0 ? 'up' : 'down';
              const arrow = pct >= 0 ? '▲' : '▼';
              const volPct = maxVol ? (r.volume / maxVol * 100).toFixed(1) : 0;
              return (
                <tr
                  key={r.symbol}
                  className={PIN.includes(r.symbol) ? 'pinned' : ''}
                  onClick={() => onOpenKline(r.symbol, r.name)}
                >
                  <td>
                    <div className="symbol">
                      <div className="dot" style={{ background: colorFor(r.symbol) }}>{r.symbol.slice(0, 2)}</div>
                      <div>
                        <div className="name">{r.symbol}<span className="kl-arrow">⤢</span></div>
                        <div className="base">{r.realtime ? '实时' : '延迟'}</div>
                      </div>
                    </div>
                  </td>
                  <td><div className="name">{r.name}</div></td>
                  <td>${fmt(r.price)}</td>
                  <td className={cls}>{arrow} {Math.abs(pct).toFixed(2)}%</td>
                  <td>${fmt(r.high)}</td>
                  <td>${fmt(r.low)}</td>
                  <td>
                    {fmtVol(r.volume)}
                    <span className="vol-bar-wrap"><span className="vol-bar" style={{ width: volPct + '%' }}></span></span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

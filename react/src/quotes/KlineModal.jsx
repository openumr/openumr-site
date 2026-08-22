import { useEffect, useRef, useState } from 'react';
import { fmt, fetchJson } from './utils.js';

const RANGES = [
  { days: 30, label: '1月' },
  { days: 90, label: '3月' },
  { days: 180, label: '6月' },
  { days: 365, label: '1年' },
];

// 计算均线
function calcMA(rows, n) {
  return rows.map((_, i) => {
    if (i < n - 1) return null;
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += rows[j].close;
    return s / n;
  });
}

// K线绘制：网格/价格刻度 + 成交量 + 蜡烛 + MA5/MA10/MA20（逻辑与原版一致）
function drawKline(canvas, rows) {
  const dpr = window.devicePixelRatio || 1;
  const klCtx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const W = rect.width, H = rect.height;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  klCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  klCtx.clearRect(0, 0, W, H);

  if (!rows || !rows.length) return;
  const padL = 58, padR = 14, padT = 12;
  const volH = 64, gap = 10;
  const priceH = H - padT - volH - gap - 16;
  const chartW = W - padL - padR;
  const n = rows.length;

  const highs = rows.map(r => r.high), lows = rows.map(r => r.low);
  const hi = Math.max(...highs), lo = Math.min(...lows);
  const span = (hi - lo) || 1;
  const pad = span * 0.06;
  const yMax = hi + pad, yMin = lo - pad;
  const xAt = i => padL + (i + 0.5) * chartW / n;
  const yAt = v => padT + (yMax - v) / (yMax - yMin) * priceH;
  const candleW = Math.max(2, chartW / n * 0.62);

  // 网格 + 价格刻度
  klCtx.strokeStyle = 'rgba(255,255,255,.06)';
  klCtx.fillStyle = '#6b7280';
  klCtx.font = '10px "SF Mono", Consolas, monospace';
  klCtx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const v = yMax - (yMax - yMin) * g / 4;
    const y = yAt(v);
    klCtx.beginPath(); klCtx.moveTo(padL, y); klCtx.lineTo(W - padR, y); klCtx.stroke();
    klCtx.fillText(v.toFixed(2), 6, y + 3);
  }
  // 日期刻度（首/中/尾）
  klCtx.textAlign = 'center';
  const ticks = [0, Math.floor(n / 2), n - 1];
  ticks.forEach(i => {
    klCtx.fillText(rows[i].date.slice(0, 5), xAt(i), H - 3);
  });
  klCtx.textAlign = 'left';

  // 成交量
  const maxVol = Math.max(...rows.map(r => r.volume));
  rows.forEach((r, i) => {
    const h = r.volume / maxVol * volH;
    const up = r.close >= r.open;
    klCtx.fillStyle = up ? 'rgba(38,166,154,.5)' : 'rgba(239,83,80,.5)';
    klCtx.fillRect(xAt(i) - candleW / 2, padT + priceH + gap + (volH - h), candleW, h);
  });

  // K线蜡烛
  rows.forEach((r, i) => {
    const up = r.close >= r.open;
    klCtx.strokeStyle = up ? '#26a69a' : '#ef5350';
    klCtx.fillStyle = up ? 'rgba(38,166,154,.92)' : 'rgba(239,83,80,.92)';
    klCtx.lineWidth = 1;
    const x = xAt(i);
    // 影线
    klCtx.beginPath();
    klCtx.moveTo(x, yAt(r.high));
    klCtx.lineTo(x, yAt(r.low));
    klCtx.stroke();
    // 实体
    const yo = yAt(r.open), yc = yAt(r.close);
    const top = Math.min(yo, yc), h = Math.max(2, Math.abs(yo - yc));
    klCtx.fillRect(x - candleW / 2, top, candleW, h);
    if (h <= 2) { // 十字星
      klCtx.fillRect(x - candleW / 2, top, candleW, 1);
    }
  });

  // 均线 MA5 / MA10 / MA20
  const mas = [[5, '#f0b90b'], [10, '#6366f1'], [20, '#ec4899']];
  mas.forEach(([nn, color]) => {
    const ma = calcMA(rows, nn);
    klCtx.strokeStyle = color;
    klCtx.lineWidth = 1.2;
    klCtx.beginPath();
    let started = false;
    ma.forEach((v, i) => {
      if (v === null) return;
      const x = xAt(i), y = yAt(v);
      if (!started) { klCtx.moveTo(x, y); started = true; }
      else klCtx.lineTo(x, y);
    });
    klCtx.stroke();
  });
  // 均线图例
  klCtx.font = '10px "SF Mono", Consolas, monospace';
  klCtx.fillStyle = '#f0b90b';
  klCtx.fillText('MA5', padL + 4, padT + 10);
  klCtx.fillStyle = '#6366f1';
  klCtx.fillText('MA10', padL + 36, padT + 10);
  klCtx.fillStyle = '#ec4899';
  klCtx.fillText('MA20', padL + 72, padT + 10);
}

// K线弹窗：target 为 { symbol, name } 或 null
export default function KlineModal({ target, onClose }) {
  const [days, setDays] = useState(90);
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | done | error
  const canvasRef = useRef(null);

  // 每次打开都重置（days 保留上次选择，与原版一致）
  useEffect(() => {
    if (target) { setData(null); setPhase('loading'); }
  }, [target]);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setPhase('loading');
    fetchJson(`/api/kline?symbol=${encodeURIComponent(target.symbol)}&days=${days}`)
      .then(d => {
        if (cancelled) return;
        if (!d.ok || !d.rows || !d.rows.length) throw new Error('无数据');
        setData(d.rows);
        setPhase('done');
      })
      .catch(() => { if (!cancelled) setPhase('error'); });
    return () => { cancelled = true; };
  }, [target, days]);

  // 数据就绪后绘制
  useEffect(() => {
    if (phase === 'done' && data && canvasRef.current) drawKline(canvasRef.current, data);
  }, [phase, data]);

  // 窗口尺寸变化时重绘（弹窗打开且有数据才画）
  useEffect(() => {
    const onResize = () => { if (target && data && canvasRef.current) drawKline(canvasRef.current, data); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [data, target]);

  // Esc 关闭
  useEffect(() => {
    if (!target) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [target, onClose]);

  if (!target) return null;

  // 头部最新价：来自最后两根收盘
  let price = '—', chg = '', chgVar = '';
  if (data && data.length) {
    const last = data[data.length - 1];
    const prev = data.length > 1 ? data[data.length - 2] : null;
    const pct = prev ? ((last.close - prev.close) / prev.close * 100) : 0;
    const cls = pct >= 0 ? 'up' : 'down';
    price = '$' + fmt(last.close);
    chg = `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(2)}%`;
    chgVar = `var(--${cls})`;
  }

  return (
    <div
      id="klineOverlay"
      className="show"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="kline-card">
        <div className="kline-head">
          <div>
            <div className="kl-sym">{target.symbol}</div>
            <div className="kl-name">{target.name || ''}</div>
          </div>
          <div className="kl-price" style={chgVar ? { color: chgVar } : undefined}>{price}</div>
          <div className="kl-chg" style={chgVar ? { color: chgVar } : undefined}>{chg}</div>
          <button className="kline-close" title="关闭" onClick={onClose}>✕</button>
        </div>
        <div className="kline-ranges">
          {RANGES.map((r) => (
            <button key={r.days} className={days === r.days ? 'active' : ''} onClick={() => setDays(r.days)}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="kline-body">
          <canvas id="klineCanvas" ref={canvasRef} role="img" aria-label={`${target.symbol} K线图`}></canvas>
          {phase !== 'done' && (
            <div className={phase === 'error' ? 'kline-err' : 'kline-loading'} style={{ display: 'flex' }}>
              {phase === 'error' ? 'K线数据加载失败' : 'K线加载中…'}
            </div>
          )}
        </div>
        <div className="kline-foot">
          <span>数据来源：Nasdaq</span>
          <span>点击代码行任意处查看 K 线</span>
        </div>
      </div>
    </div>
  );
}

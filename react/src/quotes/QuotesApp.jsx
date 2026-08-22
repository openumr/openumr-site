import { useCallback, useEffect, useState } from 'react';
import Starfield from './Starfield.jsx';
import StatsCards from './StatsCards.jsx';
import QuotesTable from './QuotesTable.jsx';
import KlineModal from './KlineModal.jsx';
import { API_QUOTES, API_INDICES, REFRESH_MS, fetchJson } from './utils.js';

export default function QuotesApp() {
  const [rows, setRows] = useState([]);
  const [indices, setIndices] = useState([]);
  const [sortKey, setSortKey] = useState('volume');   // 默认按成交量排序
  const [sortDir, setSortDir] = useState(-1);
  const [colorMode, setColorMode] = useState('intl'); // intl: 绿涨红跌 | cn: 红涨绿跌
  const [query, setQuery] = useState('');
  const [updated, setUpdated] = useState({ text: '加载中…', error: false });
  const [klineTarget, setKlineTarget] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchJson(API_QUOTES);
      if (!data.ok) throw new Error(data.error || 'unknown');
      setRows(data.quotes);
      setUpdated({ text: '更新于 ' + new Date().toLocaleTimeString('zh-CN'), error: false });
    } catch (e) {
      setUpdated({ text: '⚠ 数据获取失败：' + e.message + '（自动重试中）', error: true });
    }
  }, []);

  const fetchIndices = useCallback(async () => {
    try {
      const data = await fetchJson(API_INDICES);
      setIndices(data.indices || []);
    } catch { /* 指数失败不阻塞表格 */ }
  }, []);

  // 启动加载 + 定时刷新（行情 90s / 指数 60s）
  useEffect(() => {
    fetchData();
    fetchIndices();
    const t1 = setInterval(fetchData, REFRESH_MS);
    const t2 = setInterval(fetchIndices, 60000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchData, fetchIndices]);

  const onSort = (key) => {
    if (sortKey === key) setSortDir(-sortDir);
    else {
      setSortKey(key);
      setSortDir(key === 'symbol' || key === 'name' ? 1 : -1);
    }
  };

  // 配色切换：改文档级 --up/--down 变量。必须写实际色值——原版用 var(--down)/var(--up)
  // 互相赋值会形成循环引用，两个变量同时失效，涨跌色全部退化成默认文字色
  const onToggleColor = (mode) => {
    setColorMode(mode);
    document.documentElement.style.setProperty('--up', mode === 'intl' ? '#26a69a' : '#ef5350');
    document.documentElement.style.setProperty('--down', mode === 'intl' ? '#ef5350' : '#26a69a');
  };

  return (
    <>
      <Starfield />
      <div className="container">
        <header>
          <div className="logo">
            <div className="logo-mark">UMR</div>
            <div>
              <h1>Open<span>UMR</span></h1>
              <div className="tag">美股实时行情 · Nasdaq 数据源</div>
            </div>
          </div>
          <div className="controls">
            <a className="btn" href="index.html">← 返回首页</a>
            <span className="updated" aria-live="polite" style={updated.error ? { color: 'var(--down)' } : undefined}>{updated.text}</span>
            <div className="toggle">
              <button className={colorMode === 'intl' ? 'active' : ''} aria-pressed={colorMode === 'intl'} onClick={() => onToggleColor('intl')}>绿涨红跌</button>
              <button className={colorMode === 'cn' ? 'active' : ''} aria-pressed={colorMode === 'cn'} onClick={() => onToggleColor('cn')}>红涨绿跌</button>
            </div>
            <button className="btn" onClick={() => { fetchData(); fetchIndices(); }}>↻ 刷新</button>
          </div>
        </header>

        <StatsCards rows={rows} indices={indices} />

        <QuotesTable
          rows={rows}
          query={query}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          onQuery={setQuery}
          onOpenKline={(symbol, name) => setKlineTarget({ symbol, name })}
        />

        <footer>
          <div>数据来源：Nasdaq 公开行情 API · 经 OpenUMR 服务转发缓存 · 每 30 秒自动刷新</div>
          <div className="disclaimer">免责声明：本站数据仅供参考，不构成任何投资建议。投资有风险，入市需谨慎。</div>
          <div>© 2026 OpenUMR · openumr.com</div>
        </footer>
      </div>

      <KlineModal target={klineTarget} onClose={() => setKlineTarget(null)} />
    </>
  );
}

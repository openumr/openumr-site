export const API_QUOTES = '/api/quotes';
export const API_INDICES = '/api/indices';
export const REFRESH_MS = 90000;

// 带超时的 JSON 请求：AbortError 统一映射为「请求超时」，避免挂起的 fetch 卡住状态文案
export async function fetchJson(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('请求超时');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// 置顶股票：始终显示在表格最上方，按此顺序排列（不随排序变化）
export const PIN = ['AAPL', 'TSLA', 'AMD', 'NVDA', 'MU', 'SNDK', 'CRCL'];

export const fmt = (n, dp = 2) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
};

export const fmtVol = n => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
};

// 股票代码取色
const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ec4899', '#10b981', '#f43f5e', '#06b6d4', '#a855f7', '#84cc16', '#f97316'];
export const colorFor = s => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
};

// 搜索过滤 + 排序：置顶股票固定顺序排在最前，其余按当前排序规则
export function getSorted(rows, q, key, dir) {
  const query = (q || '').trim().toLowerCase();
  let list = rows;
  if (query) list = list.filter(r =>
    (r.symbol || '').toLowerCase().includes(query) ||
    (r.name || '').toLowerCase().includes(query));
  const cmp = (a, b) => {
    let va = a[key], vb = b[key];
    if (typeof va === 'string') return va.localeCompare(vb) * dir;
    return ((va === null || va === undefined ? -1 : va) - (vb === null || vb === undefined ? -1 : vb)) * dir;
  };
  const pinOrder = new Map(PIN.map((s, i) => [s, i]));
  const pinned = [], rest = [];
  list.forEach(r => { (pinOrder.has(r.symbol) ? pinned : rest).push(r); });
  pinned.sort((a, b) => pinOrder.get(a.symbol) - pinOrder.get(b.symbol));
  rest.sort(cmp);
  return [...pinned, ...rest];
}

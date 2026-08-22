#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OpenUMR 美股行情代理服务
- 从 Nasdaq 公开 API 拉取行情（带浏览器 UA，否则被拒）
- 内存缓存 25 秒，避免频繁请求触发限流
- 并发 6 路抓取 + 失败重试
- 监听 127.0.0.1:8081，由 Nginx 反代 /api/ 暴露
"""
import json
import os
import re
import time
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
CACHE_TTL = 90          # 秒：行情延迟 90 秒完全可接受，避免频繁重建缓存
MAX_WORKERS = 10
RETRIES = 2
WATCHLIST_FILE = "/opt/watchlist.json"

_cache = {}             # key -> (expire_ts, payload)
_lock = threading.Lock()

# 内置默认列表（当 watchlist.json 不存在时使用）
DEFAULT_WATCHLIST = [
    ("AAPL", "Apple", "NASDAQ"), ("MSFT", "Microsoft", "NASDAQ"),
    ("NVDA", "NVIDIA", "NASDAQ"), ("GOOGL", "Alphabet A", "NASDAQ"),
    ("AMZN", "Amazon", "NASDAQ"), ("META", "Meta Platforms", "NASDAQ"),
    ("TSLA", "Tesla", "NASDAQ"), ("AVGO", "Broadcom", "NASDAQ"),
    ("AMD", "AMD", "NASDAQ"), ("NFLX", "Netflix", "NASDAQ"),
    ("INTC", "Intel", "NASDAQ"), ("CRM", "Salesforce", "NYSE"),
    ("ORCL", "Oracle", "NYSE"), ("ADBE", "Adobe", "NASDAQ"),
    ("CSCO", "Cisco", "NASDAQ"), ("QCOM", "Qualcomm", "NASDAQ"),
    ("TXN", "Texas Instruments", "NASDAQ"), ("IBM", "IBM", "NYSE"),
    ("UBER", "Uber", "NYSE"), ("COIN", "Coinbase", "NASDAQ"),
    ("PLTR", "Palantir", "NASDAQ"), ("SHOP", "Shopify", "NYSE"),
    ("SNOW", "Snowflake", "NYSE"), ("DDOG", "Datadog", "NASDAQ"),
    ("MRVL", "Marvell", "NASDAQ"), ("MU", "Micron", "NASDAQ"),
    ("SMCI", "Super Micro", "NASDAQ"), ("ARM", "Arm Holdings", "NASDAQ"),
    ("TSM", "TSMC ADR", "NYSE"), ("BABA", "Alibaba ADR", "NYSE"),
    ("PDD", "Pinduoduo ADR", "NASDAQ"), ("JD", "JD.com ADR", "NASDAQ"),
    ("NIO", "NIO ADR", "NYSE"), ("XPEV", "XPeng ADR", "NYSE"),
    ("LI", "Li Auto ADR", "NASDAQ"), ("WMT", "Walmart", "NYSE"),
    ("COST", "Costco", "NASDAQ"), ("DIS", "Disney", "NYSE"),
    ("JPM", "JPMorgan", "NYSE"), ("BAC", "Bank of America", "NYSE"),
    ("V", "Visa", "NYSE"), ("MA", "Mastercard", "NYSE"),
    ("KO", "Coca-Cola", "NYSE"), ("PEP", "PepsiCo", "NASDAQ"),
    ("MCD", "McDonald's", "NYSE"), ("NKE", "Nike", "NYSE"),
    ("SBUX", "Starbucks", "NASDAQ"), ("BA", "Boeing", "NYSE"),
    ("CAT", "Caterpillar", "NYSE"), ("GE", "GE Aerospace", "NYSE"),
    ("XOM", "Exxon Mobil", "NYSE"), ("CVX", "Chevron", "NYSE"),
]

INDICES = [("NDX", "NASDAQ-100"), ("COMP", "NASDAQ Composite")]


def load_watchlist():
    """优先读取 /opt/watchlist.json（用户可自行编辑），否则用内置默认列表。
    JSON 格式：[[\"AAPL\",\"Apple\",\"NASDAQ\"], ...] 即 [代码, 显示名, 交易所]
    """
    if os.path.exists(WATCHLIST_FILE):
        try:
            with open(WATCHLIST_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            lst = []
            for item in data:
                if isinstance(item, list) and len(item) >= 2:
                    lst.append((str(item[0]).upper(), str(item[1]), str(item[2]) if len(item) > 2 else ""))
                elif isinstance(item, str):
                    lst.append((item.upper(), item, ""))
            if lst:
                return lst
        except Exception as e:
            print("watchlist.json parse error, use default:", e)
    return DEFAULT_WATCHLIST


WATCHLIST = load_watchlist()
NAME_MAP = {s: n for s, n, _ in WATCHLIST}


def fetch_json(url, tries=RETRIES):
    for i in range(tries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=12) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            if i >= tries:
                return None
            time.sleep(0.8 * (i + 1))
    return None


def get_cached(key, producer, ttl=CACHE_TTL):
    now = time.time()
    with _lock:
        hit = _cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
    payload = producer()
    if payload is not None:
        with _lock:
            _cache[key] = (time.time() + ttl, payload)
    return payload


def fetch_quote(sym):
    url = f"https://api.nasdaq.com/api/quote/{sym}/info?assetclass=stocks"
    d = fetch_json(url)
    if not d:
        return None
    data = d.get("data") or {}
    p = data.get("primaryData") or {}
    ks = data.get("keyStats") or {}
    dayrange = (ks.get("dayrange") or {}).get("value", "")
    m = re.match(r"([\d,.]+)\s*-\s*([\d,.]+)", dayrange)
    high = low = None
    if m:
        low = float(m.group(1).replace(",", ""))
        high = float(m.group(2).replace(",", ""))
    price = p.get("lastSalePrice", "")
    chg = p.get("netChange", "")
    pct = p.get("percentageChange", "")
    try:
        price_f = float(price.replace("$", "").replace(",", ""))
    except Exception:
        price_f = None
    try:
        chg_f = float(chg.replace("+", "").replace(",", ""))
    except Exception:
        chg_f = None
    try:
        pct_f = float(pct.replace("%", "").replace("+", ""))
    except Exception:
        pct_f = None
    vol = None
    try:
        vol = float((p.get("volume") or "0").replace(",", ""))
    except Exception:
        pass
    return {
        "symbol": sym,
        "price": price_f,
        "change": chg_f,
        "pct": pct_f,
        "high": high,
        "low": low,
        "volume": vol,
        "market": data.get("marketStatus"),
        "realtime": bool(p.get("isRealTime")),
        "time": p.get("lastTradeTimestamp", ""),
    }


def fetch_all_quotes(symbols):
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        results = list(ex.map(fetch_quote, symbols))
    out = []
    for s, r in zip(symbols, results):
        if r and r.get("price") is not None:
            info = NAME_MAP.get(s, s)
            r["name"] = info
            out.append(r)
    return out


def fetch_indices():
    out = []
    for sym, name in INDICES:
        url = f"https://api.nasdaq.com/api/quote/{sym}/info?assetclass=index"
        d = fetch_json(url)
        if not d:
            continue
        p = (d.get("data") or {}).get("primaryData") or {}
        try:
            price = float((p.get("lastSalePrice") or "0").replace(",", ""))
        except Exception:
            continue
        try:
            pct = float((p.get("percentageChange") or "0").replace("%", "").replace("+", ""))
        except Exception:
            pct = 0.0
        out.append({"symbol": sym, "name": name, "price": price, "pct": pct})
    return out


def fetch_kline(symbol, days=180):
    """拉取美股日K线（OHLCV），数据源 Nasdaq historical API，按天倒序返回。"""
    import datetime as dt
    to = dt.date.today()
    frm = to - dt.timedelta(days=days * 1.6)  # 交易日约为日历日的 60%
    url = (f"https://api.nasdaq.com/api/quote/{symbol}/historical"
           f"?assetclass=stocks&fromdate={frm.isoformat()}&todate={to.isoformat()}&limit={days * 2}")
    d = fetch_json(url)
    if not d:
        return None
    data = d.get("data") or {}
    rows = (data.get("tradesTable") or {}).get("rows") or []
    out = []
    for r in rows:  # 返回为倒序（最新在前），保持原序由前端处理
        def num(v):
            try:
                return float(v.replace("$", "").replace(",", ""))
            except Exception:
                return None
        o, h, l, c = num(r.get("open")), num(r.get("high")), num(r.get("low")), num(r.get("close"))
        if None in (o, h, l, c):
            continue
        try:
            vol = int(r.get("volume", "0").replace(",", ""))
        except Exception:
            vol = 0
        out.append({
            "date": r.get("date", ""),
            "open": o, "high": h, "low": l, "close": c, "volume": vol
        })
    if not out:
        return None
    out.reverse()  # 转为正序（最早在前）
    return {"symbol": symbol.upper(), "rows": out[-days:]}


class Handler(BaseHTTPRequestHandler):
    def _send(self, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/quotes":
            payload = get_cached("quotes", lambda: fetch_all_quotes([s for s, _, _ in WATCHLIST]))
            if payload is None:
                self._send({"ok": False, "error": "upstream failed"})
            else:
                self._send({"ok": True, "updated": int(time.time()), "quotes": payload})
        elif path == "/api/indices":
            payload = get_cached("indices", fetch_indices)
            self._send({"ok": True, "indices": payload or []})
        elif path == "/api/kline":
            from urllib.parse import urlparse, parse_qs
            qs = parse_qs(urlparse(self.path).query)
            sym = (qs.get("symbol") or ["AAPL"])[0].upper().strip()
            days = int((qs.get("days") or ["180"])[0])
            days = min(max(days, 30), 500)
            key = f"kline:{sym}:{days}"
            payload = get_cached(key, lambda: fetch_kline(sym, days), ttl=300)
            if payload is None:
                self._send({"ok": False, "error": "upstream failed"})
            else:
                self._send({"ok": True, **payload})
        elif path == "/api/health":
            self._send({"ok": True, "ts": int(time.time())})
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    # 启动预热：后台拉一次行情缓存，让用户首次访问即可秒回
    def _warmup():
        try:
            syms = [s for s, _, _ in load_watchlist()]
            print(f"[warmup] fetching {len(syms)} symbols...", flush=True)
            payload = fetch_all_quotes(syms)
            if payload:
                with _lock:
                    _cache["quotes"] = (time.time() + CACHE_TTL, payload)
                print(f"[warmup] done: {len(payload)} quotes cached", flush=True)
            idx = fetch_indices()
            if idx:
                with _lock:
                    _cache["indices"] = (time.time() + CACHE_TTL, idx)
        except Exception as e:
            print(f"[warmup] failed: {e}", flush=True)

    threading.Thread(target=_warmup, daemon=True).start()
    ThreadingHTTPServer(("127.0.0.1", 8081), Handler).serve_forever()

#!/bin/bash
# OpenUMR API 部署脚本（在 VPS 上运行）
set -e

# 1. 停掉旧进程（通过端口定位，避免 pkill -f 误杀 SSH）
PID=$(ss -ltnp 2>/dev/null | grep ':8081' | grep -oP 'pid=\K[0-9]+' | head -1 || true)
if [ -n "$PID" ]; then
  kill "$PID" 2>/dev/null || true
  sleep 1
fi

# 2. 启动新进程
cd /opt
nohup python3 /opt/openumr_api.py > /opt/openumr_api.log 2>&1 &
sleep 2

# 3. 健康检查
echo "--- health ---"
curl -s -m 8 http://127.0.0.1:8081/api/health
echo
echo "--- quotes (首次抓取可能需 30-60s) ---"
curl -s -m 120 'http://127.0.0.1:8081/api/quotes' | python3 -c "
import json, sys
d = json.load(sys.stdin)
q = d.get('quotes', [])
print('OK quotes:', len(q))
if q:
    print('sample:', json.dumps(q[0], ensure_ascii=False))
else:
    print('ERROR:', d.get('error'))
"
echo "--- indices ---"
curl -s -m 30 'http://127.0.0.1:8081/api/indices' | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('indices:', json.dumps(d.get('indices'), ensure_ascii=False))
"

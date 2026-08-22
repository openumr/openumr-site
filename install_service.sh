#!/bin/bash
# 安装 systemd 服务并切换
set -e

systemctl daemon-reload
systemctl enable openumr-api 2>&1 | tail -1

# 停掉旧的 nohup 进程（按端口定位）
PID=$(ss -ltnp 2>/dev/null | grep ':8081' | grep -oP 'pid=\K[0-9]+' | head -1 || true)
if [ -n "$PID" ]; then
  kill "$PID" 2>/dev/null || true
  sleep 1
fi

systemctl start openumr-api
sleep 2
echo "STATUS: $(systemctl is-active openumr-api)"
curl -s -m 8 http://127.0.0.1:8081/api/health
echo

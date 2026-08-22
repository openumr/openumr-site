#!/bin/bash
# 在 Nginx 配置中加入 /api/ 反代到本地行情服务
set -e
CONF=/etc/nginx/sites-enabled/openumr

# 若已存在则跳过
if grep -q "location /api/" "$CONF"; then
  echo "already configured"
  exit 0
fi

# 用 python 在第一个 server 块的 "location / {" 前插入反代配置
python3 - <<'EOF'
path = "/etc/nginx/sites-enabled/openumr"
with open(path) as f:
    content = f.read()

block = """    # OpenUMR 行情 API 反代（本地服务 127.0.0.1:8081）
    location /api/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }

"""
old = "    location / {\n        try_files $uri $uri/ =404;\n    }\n"
assert old in content, "anchor not found"
content = content.replace(old, block + old, 1)

with open(path, "w") as f:
    f.write(content)
print("nginx config updated")
EOF

nginx -t && systemctl reload nginx && echo "=== NGINX RELOADED ==="
sleep 1
curl -s -m 90 "https://openumr.com/api/quotes" | python3 -c "
import json, sys
d = json.load(sys.stdin)
q = d.get('quotes', [])
print('public /api/quotes OK:', len(q), 'quotes')
if q: print('sample:', q[0]['symbol'], q[0]['price'], q[0]['pct'])
"

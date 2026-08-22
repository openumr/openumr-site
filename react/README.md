# OpenUMR 前端（React 版）

线上 openumr.com 运行的就是本目录的构建产物（仓库根目录的 index.html / quotes.html / assets/）。

```bash
npm install
npm run dev     # 本地开发（/api 代理到 openumr.com）
npm run build   # 产物在 dist/，把 dist/ 内容同步到仓库根目录并部署到 /var/www/openumr
npm run lint
```

- 首页：星球交互开场（Canvas 2D 程序化渲染，点击/Enter 进入）
- 数据大厅：quotes.html（多页入口，与首页共享 React 运行时 chunk）
- 部署目标：greencloud VPS 的 /var/www/openumr（nginx 静态 + /api 反代 127.0.0.1:8081）

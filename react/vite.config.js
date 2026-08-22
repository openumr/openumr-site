import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 让产物用相对路径，可部署到任意静态目录（GitHub Pages / 子路径）
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      // 多页应用：首页 + 数据大厅各自一个入口，保持原站 URL（/ 与 /quotes.html）
      input: {
        main: 'index.html',
        quotes: 'quotes.html',
      },
    },
  },
  server: {
    // 仅本地开发：把 /api 代理到线上后端，用真实数据调试数据大厅（不影响构建产物）
    proxy: {
      '/api': 'https://openumr.com',
    },
  },
});

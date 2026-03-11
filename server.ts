/**
 * server.ts — 灵感菇 轻量服务层
 *
 * 迁移说明:
 * - 原来: Express + better-sqlite3 (本地SQLite)
 * - 现在: Vite dev server 直连 Supabase
 *
 * 所有数据库操作已移至 src/lib/api.ts，通过 Supabase Client SDK 直接在前端完成。
 * 这个文件只负责启动 Vite 开发服务器，生产环境直接用静态部署即可。
 */

import { createServer as createViteServer } from 'vite';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000');

  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: '灵感菇 running with Supabase backend' });
  });

  if (process.env.NODE_ENV !== 'production') {
    // Development: use Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built files
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🍄 灵感菇 running on http://localhost:${PORT}`);
    console.log(`📦 Database: Supabase (${process.env.VITE_SUPABASE_URL || 'configure .env'})`);
    console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer();

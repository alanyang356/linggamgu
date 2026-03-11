# 🍄 灵感菇 — Supabase 版接入指南

## 架构变化

| 项目 | 原版 (AI Studio) | 新版 (Supabase) |
|------|-----------------|----------------|
| 数据库 | SQLite (本地文件) | Supabase PostgreSQL (云端) |
| 认证 | 无 (MOCK_USER) | Supabase Auth (邮箱注册/登录) |
| 后端 | Express + better-sqlite3 | Supabase Client SDK (无需自己写API) |
| 实时消息 | 无 | Supabase Realtime |
| 部署 | 本地运行 | 可部署到 Vercel/Netlify/任意平台 |

---

## 第一步：创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com) 注册/登录
2. 点击 **New Project**，填写项目名称（如 `linggamgu`）
3. 设置数据库密码（保存好）
4. 选择离你最近的 Region（推荐 `Southeast Asia`）
5. 等待项目初始化（约1分钟）

---

## 第二步：初始化数据库

1. 在 Supabase Dashboard 左侧找到 **SQL Editor**
2. 点击 **New query**
3. 将 `supabase/schema.sql` 文件的全部内容粘贴进去
4. 点击 **Run**（或按 Ctrl/Cmd+Enter）
5. 看到 `Success` 即可

> 这一步会创建所有表、索引、RLS安全策略、触发器。

---

## 第三步：获取 API Keys

1. 在 Dashboard 左侧点击 **Settings** → **API**
2. 复制以下两个值：
   - **Project URL**（形如 `https://xxxxx.supabase.co`）
   - **anon public key**（很长的 JWT 字符串）

---

## 第四步：配置本地环境

```bash
# 进入项目目录
cd linggamgu-supabase

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的值
```

`.env` 文件内容：
```env
VITE_SUPABASE_URL=https://你的项目id.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_public_key
```

---

## 第五步：安装依赖并启动

```bash
# 安装依赖（新增了 @supabase/supabase-js，移除了 better-sqlite3）
npm install

# 启动开发服务器
npm run dev

# 浏览器访问 http://localhost:3000
```

---

## 第六步：首次使用

1. 打开 `http://localhost:3000`
2. 会看到登录界面（不再是直接进入首页）
3. 点击 **注册** 标签，填写邮箱/密码/昵称
4. 查收注册确认邮件，点击链接确认（**重要！**）
5. 回到页面登录

> **跳过邮件确认（开发阶段）**：
> 在 Supabase Dashboard → Authentication → Providers → Email，
> 关闭 **Confirm email** 选项即可无需确认邮件。

---

## 文件变更清单

### 新增文件
| 文件 | 说明 |
|------|------|
| `supabase/schema.sql` | 数据库建表SQL，在Supabase SQL Editor执行 |
| `src/lib/supabase.ts` | Supabase 客户端初始化 |
| `src/lib/api.ts` | 所有数据操作函数（替代原Express API） |
| `src/lib/AuthContext.tsx` | 用户认证状态管理 |
| `src/screens/Auth.tsx` | 登录/注册界面 |

### 修改文件
| 文件 | 变化 |
|------|------|
| `src/App.tsx` | 集成 AuthProvider，传 currentUserId 给各屏幕 |
| `server.ts` | 移除SQLite，只保留Vite dev server |
| `package.json` | 新增 `@supabase/supabase-js`，移除 `better-sqlite3` |
| `.env.example` | 更新为 Supabase 配置说明 |

### 各屏幕接口变化（新增 `currentUserId` prop）
所有需要知道"当前登录用户是谁"的屏幕，现在通过 `currentUserId: string` prop 接收，
并调用 `src/lib/api.ts` 中的函数替代原 `fetch('/api/...')` 调用。

---

## 主要功能对应关系

| 原 Express 路由 | 新 Supabase API 函数 |
|----------------|---------------------|
| `GET /api/inspirations` | `getInspirations()` |
| `POST /api/inspirations` | `createInspiration()` |
| `POST /api/inspirations/:id/like` | `likeInspiration()` |
| `POST /api/inspirations/:id/collect` | `collectInspiration()` |
| `GET /api/notifications` | `getNotifications()` |
| `POST /api/notifications/mark-read` | `markNotificationsRead()` |
| `POST /api/users/follow` | `followUser()` |
| `GET /api/stats` | `getStats()` |

---

## 生产部署

### 部署到 Vercel（推荐）

```bash
npm install -g vercel
vercel

# 在 Vercel 项目设置中添加环境变量:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

### 部署到 Netlify

```bash
npm run build
# 将 dist/ 目录上传到 Netlify
# 同样在控制台配置环境变量
```

---

## 常见问题

**Q: 登录后数据还是空的？**
A: 检查 `.env` 文件是否正确配置，以及 `schema.sql` 是否成功执行。

**Q: 上传图片后图片消失？**
A: 目前图片以 base64 存储在数据库，大图片可能超出限制。建议后续接入 Supabase Storage。

**Q: 提示 "new row violates row-level security policy"？**
A: RLS 策略要求用户登录才能写入数据，确保已正确登录。

**Q: 消息实时推送不工作？**
A: 确认 Supabase 项目开启了 Realtime，在 Dashboard → Database → Replication 中启用 `messages` 表。

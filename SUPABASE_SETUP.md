# Supabase 数据库启用步骤

当前项目支持两种模式：

- 未配置 Supabase：继续使用内置演示数据。
- 配置 Supabase：发布、编辑、删除、提前归档和回声使用云端数据。

## 1. 创建项目

在 Supabase 创建一个项目，然后进入 **Authentication > Providers > Anonymous Sign-Ins**，开启匿名登录。匿名登录仅用于当前作品集原型，后续可以替换为手机号或微信登录。

## 2. 建表

打开 Supabase 的 **SQL Editor**，执行：

`supabase/migrations/001_initial_schema.sql`

然后继续执行图片存储迁移：

`supabase/migrations/002_moment_images.sql`

最后执行回应线程迁移：

`supabase/migrations/003_reply_threads.sql`

脚本会创建：

- `profiles`：用户资料
- `moments`：此刻与回声
- `reactions`：我也是
- `replies`：回应
- `drafts`：草稿
- `moment-images`：私有图片存储桶

同时会创建索引、匿名用户资料触发器和行级安全策略。

## 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，填入 Supabase 项目设置中的 URL 和 anon key：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Anon key 可以放在前端，数据权限由数据库的 RLS 策略控制。不要在前端使用 `service_role` key。

## 4. 启动

```powershell
npm run dev
```

配置完成后，首次访问会自动创建匿名用户。用户发布的内容刷新后仍会保留；公开内容仅在 `expires_at > now()` 时进入首页，自己的过期内容会在回声中查询到。

## 当前范围

首轮已接通最核心的内容闭环：读取、发布、编辑、删除、提前归档和过期查询。数据库已为回应、共鸣和草稿建立表结构，但这三个界面目前仍沿用本地原型交互，后续再接数据服务。

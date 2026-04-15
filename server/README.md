# lowtrello-api

最小可运行后端骨架：Fastify + Prisma(PostgreSQL) + Access/Refresh 鉴权（JWT Access + 可轮换 Refresh Token）。

## 本地启动

1. 启动数据库（需要 Docker）

- `docker compose up -d`

2. 配置环境变量

- 复制 `server/.env.example` 为 `server/.env` 并修改 `JWT_SECRET`

3. 安装依赖并初始化数据库

- `cd server`
- `npm install`
- `npm run prisma:generate`
- `npm run prisma:migrate`

4. 启动 API

- `npm run dev`

默认监听：`http://localhost:8787/api/health`

## 已提供接口（初版）

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me` (Bearer Token)
- `GET /api/workspaces` (Bearer Token)
- `POST /api/workspaces` (Bearer Token)

说明：

- Refresh Token 默认通过 HttpOnly Cookie 下发（cookie 名：`REFRESH_TOKEN_COOKIE_NAME`）。
- `register`/`login`/`refresh` 的响应不再返回 `refreshToken` 字段（只走 HttpOnly Cookie）。
- 已启用 refresh token 重用检测：如果一个已被撤销的 refresh token 再次被使用，会吊销该用户所有 refresh token，强制重新登录。

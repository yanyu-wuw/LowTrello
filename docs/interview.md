# lowTrello（全栈升级版）面试讲解稿

> 目标：把当前的 LowTrello 从“前端本地 Demo”升级到“企业级全栈项目”的雏形：有后端、有数据库、有权限与可扩展的架构。

## 1. 项目一句话介绍

- LowTrello 是一个 Trello 风格的任务管理系统，支持看板/列表/卡片/附件/活动流，并提供工作区导出。
- 目前仓库包含：Web（Vue3）+ API（Fastify/Prisma/Postgres）+ 本地数据库编排（docker compose）。

## 2. 架构概览（你可以这么说）

- 前端：Vue 3 + Vite + Pinia + Element Plus，负责交互与状态管理。
- 后端：Node.js + Fastify（TypeScript），提供 REST API。
- 数据库：PostgreSQL（Prisma ORM 管理 schema 与迁移）。
- 鉴权：JWT Bearer Token（初版，后续可扩展 Refresh Token / SSO）。

为什么这样选：
- Fastify 性能好、插件生态够用、在 Node 里工程化成本低。
- Prisma 迁移与类型体验好，适合快速演进数据模型。
- Postgres 在企业里通用，事务/索引/约束完善。

## 3. 数据模型（核心表/集合）

当前初版 schema 在 server/prisma/schema.prisma，核心实体：
- User：用户
- Workspace / WorkspaceMember：工作区与成员关系（role：admin/member/observer）
- Board / List / Card：看板、列表、卡片
- Attachment：附件元信息（后续可对接对象存储）
- Activity：活动流（审计/回溯）
- Notification：通知
- ExportJob：导出任务（异步化的基础）

## 4. API 设计（初版）

已落地的接口（后端前缀 /api）：
- GET /health：健康检查
- POST /auth/register：注册
- POST /auth/login：登录
- GET /me：获取当前用户（需要 Bearer Token）
- GET /workspaces：获取我加入的工作区（需要 Bearer Token）
- POST /workspaces：创建工作区（需要 Bearer Token）

你可以补充一句：后续会补齐 board/list/card 的 CRUD，以及导出、通知、搜索等。

## 5. 企业级要补齐的能力清单（路线图）

### 5.1 功能层
- 多用户协作：共享工作区/看板权限、邀请与移除成员
- 权限模型：RBAC + 资源级校验（workspace/board/list/card）
- 通知中心：评论、@提及、到期提醒、权限变更
- 全局搜索：按 workspace 范围搜索 card/board
- 导出：改为后端生成 ZIP（可排队、可重试、可下载历史导出）
- 附件：从 base64 本地存储升级到对象存储（MinIO/S3）

### 5.2 工程与稳定性
- 数据库迁移：严格版本化，CI 中跑 migrate
- API 规范：OpenAPI/Swagger、错误码规范、统一响应格式
- 日志与审计：结构化日志（pino），Activity/AuditLog 分层
- 性能：分页/索引、读写分离思路、缓存（Redis）
- 安全：密码哈希、速率限制、CSRF（如用 Cookie）、输入校验、CORS
- 部署：Dockerfile + Compose（dev），K8s（prod）
- 可观测：metrics（Prometheus）、trace（OpenTelemetry）

## 6. 难点 / 踩坑 / 解决方案（大学生口吻）

### 难点 1：从“本地存储”迁移到“后端 DB”
- 踩坑：前端 Pinia 里到处直接读写 localStorage，后端接入后容易出现“双写不一致”。
- 解决：先做“最小链路”（登录 -> 拉 workspace），逐步把 board/list/card 的数据读取切到 API；必要时做一次性迁移脚本，把旧数据导入数据库。

### 难点 2：TypeScript + Node ESM 的 import 规则
- 踩坑：tsconfig 用 NodeNext 后，本地相对路径 import 必须写 .js 扩展名，不然 tsc 直接报错。
- 解决：把 server/src 下的相对 import 全部改成 *.js（例如 ./lib/env.js），保证编译输出符合 Node ESM 规范。

### 难点 3：导出 ZIP 的可扩展性
- 踩坑：纯前端导出在数据量大时会卡 UI，而且附件如果是 base64 会让内存飙升。
- 解决：做成后端 ExportJob：入队 -> 后台生成 -> 返回下载地址；附件用对象存储链接或打包原文件。

## 7. 面试官常问 & 你怎么答

- Q：你怎么做权限校验？
  - A：每个请求从 JWT 解析 userId，然后在 service 层校验用户是否是 workspace/board 成员；把“资源校验”封装成可复用中间件/函数，避免漏。

- Q：怎么保证拖拽排序不乱？
  - A：前端乐观更新 position，后端用事务更新受影响区间（或用稀疏 position，例如 1000/2000/3000），减少全量重排。

- Q：导出为什么要异步？
  - A：ZIP 生成和附件读取都可能很慢，同步会导致请求超时；异步可排队、可重试、可追踪状态。

- Q：如果并发很多怎么办？
  - A：读接口加分页与索引；写接口做幂等；导出/通知这类重任务放到 worker；必要时用 Redis 做队列。

## 8. 你可以展示的“可运行证明”

- 数据库：根目录 docker compose 启 Postgres
- API：server/ 下 `npm run dev`
- Web：根目录 `npm run dev`

（如果要展示效果：注册 -> 登录 -> 创建 workspace -> 在前端接入拉取 workspace 列表）

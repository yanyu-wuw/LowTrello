# lowTrello 部署到公网（VPS + Docker + HTTPS）

这个仓库已经内置了 Docker Compose（Postgres + API + Web）。Web 容器里跑的是 Nginx，并且会把 `/api/*` 反代到 `api:8787`，因此建议线上用“同域名同站点”部署（对 refresh cookie 最友好）。

## 0. 准备

- 一台 VPS（Ubuntu 22.04/24.04 都行）
- 一个域名（例如 `lowtrello.example.com`）并把 DNS A 记录指向 VPS 公网 IP
- VPS 防火墙放行 80/443

## 1. 在 VPS 安装 Docker

Ubuntu 上常见做法：

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 重新登录一次，让 docker 组生效
```

确认：

```bash
docker version
docker compose version
```

## 2. 上传代码到 VPS

任选一种：

- 用 git：`git clone <你的仓库地址> lowtrello`
- 或者把项目目录打包 scp 上去

进入项目目录：

```bash
cd lowtrello
```

## 3. 写生产环境 .env（很关键）

在项目根目录创建 `.env`（与 `docker-compose.yml` 同级），至少包含：

```bash
# 对外域名（给 Caddy 自动签证书用）
DOMAIN=lowtrello.example.com
ACME_EMAIL=you@example.com

# Postgres
POSTGRES_USER=lowtrello
POSTGRES_PASSWORD=PLEASE_CHANGE_ME
POSTGRES_DB=lowtrello
DATABASE_URL=postgresql://lowtrello:PLEASE_CHANGE_ME@postgres:5432/lowtrello?schema=public

# API
JWT_SECRET=PLEASE_USE_A_LONG_RANDOM_SECRET
CORS_ORIGIN=https://lowtrello.example.com

# SMTP（线上务必换成真实邮箱服务；否则注册/找回密码收不到验证码）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_FROM=no-reply@lowtrello.example.com

# Prisma：首次上线可以用 db push（无迁移），但默认不允许破坏性变更
PRISMA_DB_PUSH=1
PRISMA_ACCEPT_DATA_LOSS=0
```

说明：
- `JWT_SECRET` 建议用随机长串（例如 32+ 字节）。
- 当前仓库没有 `prisma/migrations`，所以更像“原型/试运行”部署；正式生产建议补迁移并改用 `prisma migrate deploy`。

## 4. 启动（带 HTTPS）

使用生产覆盖文件启动：

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

访问：
- `https://lowtrello.example.com/`
- API 健康检查：`https://lowtrello.example.com/api/health`

查看状态与日志：

```bash
docker compose ps
docker compose logs -f --tail=200 caddy web api
```

## 5. 更新部署

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 6. 备份数据库（建议至少做这个）

示例（导出到当前目录）：

```bash
docker exec -t lowtrello-postgres pg_dump -U lowtrello lowtrello > lowtrello_$(date +%F).sql
```

## 常见坑

- 构建卡在代理：基础 compose 里默认把 `HTTP_PROXY/HTTPS_PROXY` 指到 `http.docker.internal`，这对很多 VPS 不存在。生产覆盖文件已强制置空。
- HTTPS 反代下 refresh cookie 不 secure：外层 HTTPS 终止时，要把 `X-Forwarded-Proto=https` 一路传到 API。仓库内的 Nginx 已做了“如果上游有 x-forwarded-proto 就沿用”的处理。
- 邮件验证码收不到：生产不要用 MailHog，必须配置真实 SMTP。

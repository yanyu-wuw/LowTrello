# lowTrello (Vue 3)

lowTrello is a Trello-inspired task management prototype built with Vue 3, Pinia, Element Plus, and vuedraggable.

lowTrello 是一个基于 Vue 3 的 Trello 风格任务管理原型，支持看板、列表、卡片和拖拽。

## 1. 双语支持 / Bilingual

- Language switch: Chinese and English.
- 语言切换：支持中文与英文。
- Scope: unauthenticated landing, login page, and workspace core text.
- 覆盖范围：未登录页、登录页、工作区核心文案。

## 2. 登录页设计（仿 Trello 登录视觉）

### 中文

- 布局：三栏结构，中央为登录卡片，左右为装饰插画区域。
- 卡片结构：品牌区、邮箱输入、记住我、继续按钮、第三方登录按钮组、辅助链接、语言切换。
- 视觉：浅灰背景 + 白色登录卡片 + 蓝色主按钮，高对比引导提交。
- 交互：支持邮箱登录和第三方快速登录（Demo），登录成功后进入工作区。

### English

- Layout: three-column composition with a centered auth card and decorative side areas.
- Card sections: brand, email input, remember-me, primary continue button, provider stack, helper links, language toggles.
- Visual style: light gray backdrop, white card, blue primary CTA for clear conversion focus.
- Interaction: email sign-in and provider quick sign-in (demo), then redirect to workspace.

## 3. 未登录界面详细布局与应用分析

### 3.1 整体结构 / Overall

- 中文：采用 SaaS 单页营销结构，从“认知 -> 价值 -> 转化”逐层推进。
- English: Uses a SaaS one-page marketing flow from awareness to value explanation to conversion.

### 3.2 顶部通知与导航 / Notice + Navigation

- 中文：顶部通知条用于传达新功能；导航区左侧品牌，右侧登录注册入口与语言切换，缩短转化路径。
- English: Top notice highlights updates; navigation places brand on the left and conversion actions on the right.

### 3.3 英雄区 / Hero Section

- 中文：左侧核心价值主张 + CTA 按钮，右侧可视化“看板模型”，快速建立产品心智。
- English: Left side communicates core value and CTAs; right side shows a board mockup for immediate product context.

### 3.4 功能区 / Feature Blocks

- 中文：三卡片并列，分别传达“消息转任务、自动化、协作透明度”，保证信息分层清晰。
- English: Three feature cards explain message-to-task, automation, and collaboration transparency.

### 3.5 解析区与 CTA / Analysis + Final CTA

- 中文：在 CTA 前加入布局解析模块，帮助用户理解页面组织逻辑；最终 CTA 使用高对比卡片强化注册行为。
- English: An analysis section clarifies layout logic before a high-contrast CTA that drives signup intent.

### 3.6 适用场景 / Applicability

- 中文：适用于项目管理、任务协作、团队 SaaS 首屏，强调“快速理解 + 快速注册 + 快速进入产品”。
- English: Fits project/task collaboration SaaS homepages emphasizing quick understanding and fast onboarding.

## 4. 开发运行

### 4.1 全栈启动（数据库 + 后端 + 前端）

Docker 一键启动（web + api + db，推荐）：

```bash
docker compose up -d --build
```

- Web：`http://localhost:8080/`
- API：`http://localhost:8787/api/health`

说明：

- `docker-compose.yml` 里内置了一个开发用 `JWT_SECRET`，真实部署请通过环境变量覆盖：

	```bash
	JWT_SECRET=your_strong_secret docker compose up -d --build
	```

- API 容器启动时会执行一次 `prisma db push` 来初始化/同步表结构（无迁移版）。如需关闭：

	```bash
	PRISMA_DB_PUSH=0 docker compose up -d
	```

启动数据库（PostgreSQL，需要 Docker）：

```bash
docker compose up -d
```

启动后端 API：

```bash
cd server
copy .env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

默认 API：`http://localhost:8787/api/health`

启动前端 Web：

```bash
cd ..
npm install
npm run dev
```

默认 Web：`http://localhost:5173/`

### 4.2 仅前端启动

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## 5. 技术栈

- Vue 3 + Vite
- Pinia
- Vue Router
- Element Plus
- vuedraggable

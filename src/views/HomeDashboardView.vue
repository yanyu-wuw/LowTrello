<template>
  <section class="home-page">
    <aside class="home-sidebar">
      <nav class="home-nav">
        <button
          v-if="effectiveSidebar.homeNav.recent"
          type="button"
          :class="['home-nav-item', { active: activeNav === 'recent' }]"
          @click="activeNav = 'recent'"
        >
          <span class="home-nav-label">最近</span>
        </button>
        <button
          v-if="effectiveSidebar.homeNav.notifications"
          type="button"
          :class="['home-nav-item', { active: activeNav === 'notifications' }]"
          @click="activeNav = 'notifications'"
        >
          <span class="home-nav-label">通知</span>
        </button>

        <button
          v-if="effectiveSidebar.homeNav.apps"
          type="button"
          :class="['home-nav-item', { active: activeNav === 'all-apps' }]"
          @click="activeNav = 'all-apps'"
        >
          <span class="home-nav-label">查看所有应用</span>
        </button>

        <div v-if="enabledShortcuts.length" class="home-nav-divider"></div>

        <div v-if="enabledShortcuts.length" class="home-shortcuts">
          <p class="home-shortcuts-title">应用快捷方式</p>
          <button
            v-for="s in enabledShortcuts"
            :key="s.key"
            type="button"
            class="home-shortcut-item"
            @click="noop"
          >
            {{ s.label }}
          </button>
        </div>

        <button
          type="button"
          class="home-nav-item"
          @click="openCustomize"
        >
          <span class="home-nav-label">自定义侧边栏</span>
        </button>
      </nav>
    </aside>

    <main class="home-main">
      <section v-if="activeNav === 'recent'" class="home-content">
        <header class="home-content-header">
          <h1 class="home-content-title">最近</h1>
          <div class="home-tabs">
            <button :class="['home-tab', { active: recentTab === 'done' }]" @click="recentTab = 'done'">已处理</button>
            <button :class="['home-tab', { active: recentTab === 'seen' }]" @click="recentTab = 'seen'">已查看</button>
          </div>
        </header>

        <el-input v-model="recentKeyword" class="home-filter" placeholder="Filter by title" />

        <ul class="home-list">
          <li v-for="item in filteredRecent" :key="item.id" class="home-list-item">
            <div class="home-list-main">
              <p class="home-list-title">{{ item.title }}</p>
              <p class="home-list-sub">{{ item.meta }}</p>
            </div>
            <span class="home-list-time">{{ item.time }}</span>
          </li>
        </ul>
      </section>

      <section v-else-if="activeNav === 'notifications'" class="home-content">
        <header class="home-content-header">
          <h1 class="home-content-title">通知</h1>
          <div class="home-unread">
            <span>仅显示未读</span>
            <el-switch v-model="onlyUnread" />
          </div>
        </header>

        <div class="home-filter-row">
          <el-select v-model="notifyTime" class="home-filter-select">
            <el-option label="全部" value="all" />
            <el-option label="今天" value="today" />
          </el-select>

          <el-select v-model="notifyType" class="home-filter-select">
            <el-option label="直接" value="direct" />
            <el-option label="已关注" value="watching" />
          </el-select>

          <el-select v-model="notifyApp" class="home-filter-select">
            <el-option label="所有应用" value="all" />
            <el-option label="项目管理" value="jira" />
            <el-option label="文档协作" value="confluence" />
          </el-select>
        </div>

        <ul v-if="notificationItems.length" class="home-list">
          <li v-for="item in notificationItems" :key="item.id" class="home-list-item">
            <div class="home-list-main">
              <p class="home-list-title">{{ item.message }}</p>
            </div>
            <span class="home-list-time">{{ item.time }}</span>
          </li>
        </ul>

        <div v-else class="home-empty-state">
          <div class="home-empty-flag" aria-hidden="true"></div>
          <p class="home-empty-title">您在过去 30 天内没有任何通知</p>
          <div class="home-empty-links">
            <a href="#" @click.prevent>可浏览所有通知</a>
            <a href="#" @click.prevent>查看所有快捷键</a>
          </div>
        </div>
      </section>

      <section v-else-if="activeNav === 'all-apps'" class="home-content">
        <header class="home-content-header">
          <h1 class="home-content-title">应用</h1>
          <el-select v-model="appsSort" class="home-filter-select">
            <el-option label="按使用频率排序" value="usage" />
          </el-select>
        </header>

        <section class="home-section">
          <header class="home-section-header">
            <h3>您的应用</h3>
          </header>

          <div class="home-app-grid">
            <button type="button" class="home-app-card" @click="goWorkspace">LowTrello 看板</button>
          </div>
        </section>

        <section class="home-section">
          <header class="home-section-header">
              <h3>更多应用推荐</h3>
          </header>

          <ul class="home-app-list">
            <li v-for="item in moreApps" :key="item" class="home-app-list-item">{{ item }}</li>
          </ul>
        </section>
      </section>
    </main>

    <el-dialog v-model="customizeVisible" title="自定义侧边栏" width="520px" :close-on-click-modal="false">
      <p class="home-dialog-desc">
        在此自定义侧边栏。更改将实时反映在侧边栏中，并且仅影响当前用户，不会影响其他用户。
      </p>

      <div class="home-dialog-group">
        <h4>主页导航</h4>
        <el-checkbox v-model="draftSidebar.homeNav.recent">最近</el-checkbox>
        <el-checkbox v-model="draftSidebar.homeNav.notifications">通知</el-checkbox>
        <el-checkbox v-model="draftSidebar.homeNav.apps">查看所有应用</el-checkbox>
      </div>

      <div class="home-dialog-group">
        <h4>应用快捷方式</h4>
        <el-checkbox v-model="draftSidebar.appShortcuts.jira">项目管理</el-checkbox>
        <el-checkbox v-model="draftSidebar.appShortcuts.confluence">文档协作</el-checkbox>
        <el-checkbox v-model="draftSidebar.appShortcuts.loom">录屏工具</el-checkbox>
        <el-checkbox v-model="draftSidebar.appShortcuts.focus">专注工具</el-checkbox>
        <el-checkbox v-model="draftSidebar.appShortcuts.talent">人才管理</el-checkbox>
        <el-checkbox v-model="draftSidebar.appShortcuts.jpd">产品洞察</el-checkbox>
      </div>

      <template #footer>
        <div class="home-dialog-actions">
          <el-button @click="cancelCustomize">取消</el-button>
          <el-button type="primary" @click="saveCustomize">保存更改</el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const SIDEBAR_KEY = 'lowtrello.home.sidebar.v1'
const savedSidebar = loadFromStorage(SIDEBAR_KEY, {
  homeNav: {
    recent: true,
    notifications: true,
    apps: true
  },
  appShortcuts: {
    jira: true,
    confluence: true,
    loom: true,
    focus: true,
    talent: true,
    jpd: true
  }
})

const sidebar = ref(savedSidebar)
const draftSidebar = reactive(JSON.parse(JSON.stringify(savedSidebar)))

const customizeVisible = ref(false)
const activeNav = ref('recent')

const recentTab = ref('done')
const recentKeyword = ref('')

const recentItems = ref([])
const recentLoading = ref(false)

const notifyTime = ref('all')
const notifyType = ref('direct')
const notifyApp = ref('all')
const onlyUnread = ref(false)

const notificationItems = ref([])
const notificationsLoading = ref(false)

const appsSort = ref('usage')

watch(
  customizeVisible,
  (visible) => {
    if (visible) {
      Object.assign(draftSidebar, JSON.parse(JSON.stringify(sidebar.value)))
    }
  },
  { immediate: false }
)

const effectiveSidebar = computed(() => (customizeVisible.value ? draftSidebar : sidebar.value))

const enabledShortcuts = computed(() => {
  const cfg = effectiveSidebar.value?.appShortcuts || {}
  const items = [
    { key: 'jira', label: '项目管理' },
    { key: 'confluence', label: '文档协作' },
    { key: 'loom', label: '录屏工具' },
    { key: 'focus', label: '专注工具' },
    { key: 'talent', label: '人才管理' },
    { key: 'jpd', label: '产品洞察' }
  ]

  return items.filter((it) => Boolean(cfg[it.key]))
})

function formatRelativeTime(isoString) {
  const date = new Date(isoString)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`

  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}小时前`

  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return '昨天'

  return date.toISOString().slice(0, 10)
}

async function authedGetJson(url) {
  const token = String(userStore.accessToken || '')
  const doFetch = async (t) => {
    return await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${t}`
      }
    })
  }

  let response = await doFetch(token)
  if (response.status === 401) {
    const refreshed = await userStore.refreshAccessToken()
    if (refreshed) {
      response = await doFetch(String(userStore.accessToken || ''))
    }
  }

  if (response.ok) return await response.json()
  throw new Error(`HTTP_${response.status}`)
}

async function loadRecent() {
  if (!userStore.isAuthenticated || !userStore.accessToken) return
  recentLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('tab', recentTab.value)
    const q = recentKeyword.value.trim()
    if (q) params.set('q', q)

    const data = await authedGetJson(`/api/home/recent?${params.toString()}`)
    recentItems.value = Array.isArray(data?.items)
      ? data.items.map((it) => ({
          id: it.id,
          title: it.title,
          meta: it.meta,
          time: formatRelativeTime(it.createdAt),
          status: it.status
        }))
      : []
  } finally {
    recentLoading.value = false
  }
}

async function loadNotifications() {
  if (!userStore.isAuthenticated || !userStore.accessToken) return
  notificationsLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('time', notifyTime.value)
    params.set('kind', notifyType.value)
    params.set('app', notifyApp.value)
    if (onlyUnread.value) params.set('unreadOnly', '1')

    const data = await authedGetJson(`/api/home/notifications?${params.toString()}`)
    notificationItems.value = Array.isArray(data?.items)
      ? data.items.map((it) => ({
          id: it.id,
          message: it.message,
          time: formatRelativeTime(it.createdAt),
          readAt: it.readAt
        }))
      : []
  } finally {
    notificationsLoading.value = false
  }
}

const filteredRecent = computed(() => {
  const status = recentTab.value
  return recentItems.value.filter((item) => {
    if (status === 'done' && item.status !== 'done') return false
    if (status === 'seen' && item.status !== 'seen') return false
    return true
  })
})

const moreApps = computed(() => {
  return [
    '账户设置',
    '帮助与支持',
    '社区论坛',
    '许可与订阅',
    '文档中心',
    '尝试更多应用',
    'LowTrello 官网'
  ]
})

function openCustomize() {
  customizeVisible.value = true
}

function cancelCustomize() {
  Object.assign(draftSidebar, JSON.parse(JSON.stringify(sidebar.value)))
  customizeVisible.value = false
}

function saveCustomize() {
  sidebar.value = JSON.parse(JSON.stringify(draftSidebar))
  saveToStorage(SIDEBAR_KEY, sidebar.value)
  customizeVisible.value = false
}

watch(
  effectiveSidebar,
  (cfg) => {
    if (!cfg.homeNav.recent && activeNav.value === 'recent') {
      if (cfg.homeNav.notifications) activeNav.value = 'notifications'
      else if (cfg.homeNav.apps) activeNav.value = 'all-apps'
    }

    if (!cfg.homeNav.notifications && activeNav.value === 'notifications') {
      if (cfg.homeNav.recent) activeNav.value = 'recent'
      else if (cfg.homeNav.apps) activeNav.value = 'all-apps'
    }

    if (!cfg.homeNav.apps && activeNav.value === 'all-apps') {
      if (cfg.homeNav.recent) activeNav.value = 'recent'
      else if (cfg.homeNav.notifications) activeNav.value = 'notifications'
    }
  },
  { deep: true }
)

watch(
  () => route.query?.nav,
  (nav) => {
    const key = String(nav || '').trim()
    if (key === 'all-apps') {
      activeNav.value = 'all-apps'
    }
  },
  { immediate: true }
)

let recentTimer = null
watch(
  [activeNav, recentTab, recentKeyword],
  ([nav]) => {
    if (nav !== 'recent') return
    if (recentTimer) clearTimeout(recentTimer)
    recentTimer = setTimeout(() => {
      loadRecent().catch(() => {})
    }, 200)
  },
  { immediate: true }
)

let notificationsTimer = null
watch(
  [activeNav, notifyTime, notifyType, notifyApp, onlyUnread],
  ([nav]) => {
    if (nav !== 'notifications') return
    if (notificationsTimer) clearTimeout(notificationsTimer)
    notificationsTimer = setTimeout(() => {
      loadNotifications().catch(() => {})
    }, 200)
  },
  { immediate: false }
)

function goWorkspace() {
  router.push({ name: 'workspace' })
}

function noop() {}
</script>

<style scoped>
.home-page {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: calc(100vh - 56px);
  background: #f3f4f6;
}

.home-sidebar {
  border-right: 1px solid #d7dde8;
  background: #f1f2f4;
  padding: 18px 14px;
}

.home-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.home-nav-item {
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 10px 10px;
  background: transparent;
  color: #20344f;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.home-nav-item:hover {
  background: #e6e9ef;
}

.home-nav-item.active {
  background: #dce7f6;
  color: #0a61e1;
}

.home-nav-label {
  font-size: 14px;
  font-weight: 600;
}

.home-nav-divider {
  height: 1px;
  background: #dde2ea;
  margin: 10px 0;
}

.home-shortcuts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.home-shortcuts-title {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 900;
  color: #5e708f;
  padding: 0 10px;
}

.home-shortcut-item {
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 10px 10px;
  background: transparent;
  color: #20344f;
  text-align: left;
  cursor: pointer;
  font-weight: 700;
}

.home-shortcut-item:hover {
  background: #e6e9ef;
}

.home-nav-chip {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e9e6ff;
  color: #6355d6;
}

.home-main {
  padding: 20px;
}

.home-content {
  background: #ffffff;
  border: 1px solid #d7dde8;
  border-radius: 14px;
  padding: 14px;
}

.home-content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.home-content-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1f2d40;
}

.home-filter {
  margin-top: 12px;
}

.home-filter-row {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.home-filter-select {
  width: 100%;
}

.home-unread {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #566b87;
  font-size: 13px;
  font-weight: 700;
}

.home-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.home-list-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #dde2ea;
  border-radius: 12px;
  padding: 10px 12px;
  background: #f6f7f9;
}

.home-list-title {
  margin: 0;
  font-weight: 800;
  color: #1f2d40;
}

.home-list-sub {
  margin: 4px 0 0;
  color: #5e708f;
  font-size: 12px;
  font-weight: 600;
}

.home-list-time {
  color: #5e708f;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.home-empty-state {
  margin-top: 14px;
  border: 1px dashed #cfe1ff;
  background: #f3f8ff;
  border-radius: 14px;
  padding: 18px;
  text-align: center;
}

.home-empty-flag {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #0a61e1;
  margin: 0 auto 10px;
}

.home-empty-title {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #1f2d40;
}

.home-empty-links {
  margin-top: 10px;
  display: inline-flex;
  gap: 14px;
}

.home-empty-links a {
  color: #0a61e1;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
}

.home-section {
  margin-top: 18px;
  background: #ffffff;
  border: 1px solid #d7dde8;
  border-radius: 14px;
  padding: 14px;
}

.home-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.home-section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #1f2d40;
}

.home-section-link {
  color: #0a61e1;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
}

.home-app-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.home-app-card {
  border: 1px solid #dde2ea;
  border-radius: 12px;
  background: #f6f7f9;
  padding: 12px;
  cursor: pointer;
  font-weight: 700;
  color: #1f2d40;
}

.home-app-card:hover {
  background: #e9f2ff;
  border-color: #cfe1ff;
}

.home-tabs {
  display: inline-flex;
  border: 1px solid #dde2ea;
  border-radius: 999px;
  overflow: hidden;
}

.home-tab {
  border: 0;
  background: #ffffff;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  color: #566b87;
}

.home-tab.active {
  background: #e9f2ff;
  color: #0a61e1;
}

.home-app-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home-app-list-item {
  border: 1px solid #dde2ea;
  border-radius: 12px;
  padding: 10px 12px;
  background: #f6f7f9;
  font-weight: 700;
  color: #1f2d40;
}

.home-dialog-desc {
  margin: 0 0 12px;
  color: #5e708f;
  font-size: 13px;
  line-height: 1.5;
}

.home-dialog-group {
  border: 1px solid #dde2ea;
  border-radius: 12px;
  padding: 12px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home-dialog-group h4 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 900;
  color: #1f2d40;
}

.home-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 960px) {
  .home-page {
    grid-template-columns: 1fr;
  }

  .home-sidebar {
    border-right: 0;
    border-bottom: 1px solid #d7dde8;
  }

  .home-app-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-filter-row {
    grid-template-columns: 1fr;
  }
}
</style>

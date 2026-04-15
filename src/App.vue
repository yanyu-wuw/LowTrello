<template>
  <div v-if="hasWorkspaceShell" class="app-shell">
    <header :class="['app-header', 'lowtrello-topbar', { 'board-topbar': isBoardRoute }]">
      <div class="topbar-left">
        <el-popover
          v-if="!isBoardRoute"
          v-model:visible="appMenuVisible"
          trigger="click"
          placement="bottom-start"
          :width="343"
          popper-class="appmenu-popover"
        >
          <template #reference>
            <button class="topbar-icon-btn" type="button" :aria-label="t('workspaceHome.appMenuAria')">
              <el-icon><Grid /></el-icon>
            </button>
          </template>

          <section class="appmenu">
            <div class="appmenu-nav">
              <button class="appmenu-nav-item" type="button" @click="navigateAppMenu('home')">
                <span class="appmenu-nav-left">
                  <span class="appmenu-item-icon home" aria-hidden="true">
                    <el-icon><House /></el-icon>
                  </span>
                  <span class="appmenu-nav-text">{{ t('appMenu.navHome') }}</span>
                </span>
              </button>

              <button class="appmenu-nav-item active" type="button" @click="navigateAppMenu('trello')">
                <span class="appmenu-nav-left">
                  <span class="appmenu-item-icon trello" aria-hidden="true">
                    <span class="trello-col"></span>
                    <span class="trello-col"></span>
                  </span>
                  <span class="appmenu-nav-text">{{ t('appMenu.navTrello') }}</span>
                </span>
              </button>
            </div>

            <div class="appmenu-dev">
              {{ t('appMenu.developing') }}
            </div>

            <button class="appmenu-footer" type="button" @click="navigateAppMenu('all-apps')">
              <span class="appmenu-nav-left">
                <el-icon><Grid /></el-icon>
                <span>{{ t('appMenu.moreApps') }}</span>
              </span>
            </button>
          </section>
        </el-popover>

        <button class="brand-tile" type="button" @click="goInitial" :aria-label="t('common.brand')">T</button>
        <button class="brand-word" type="button" @click="goInitial">{{ t('common.brand') }}</button>
      </div>

      <div class="topbar-center">
        <div class="topbar-center-inner">
          <label class="topbar-search" :aria-label="t('workspaceHome.searchPlaceholder')">
            <el-icon class="topbar-search-icon"><Search /></el-icon>
            <input
              type="search"
              v-model="topSearchQuery"
              :placeholder="t('workspaceHome.searchPlaceholder')"
              class="topbar-search-input"
              @search="submitTopSearch"
              @keydown.enter="submitTopSearch"
              @blur="submitTopSearch"
            >
          </label>

          <el-popover
            v-model:visible="createMenuVisible"
            trigger="click"
            placement="bottom"
            :width="360"
            popper-class="create-menu-popover"
          >
            <template #reference>
              <el-button type="primary" class="topbar-create-btn">{{ t('workspaceHome.createAction') }}</el-button>
            </template>

            <div class="create-menu">
              <button class="create-menu-item" type="button" @click="handleCreateMenu('board')">
                <span class="create-menu-icon board" aria-hidden="true">
                  <span></span><span></span><span></span><span></span>
                </span>
                <span class="create-menu-copy">
                  <strong>{{ t('topbarCreateMenu.createBoardTitle') }}</strong>
                  <span>{{ t('topbarCreateMenu.createBoardDesc') }}</span>
                </span>
              </button>

              <button class="create-menu-item" type="button" @click="handleCreateMenu('workspace_view')">
                <span class="create-menu-icon workspace" aria-hidden="true">
                  <span v-for="n in 9" :key="`ws-${n}`"></span>
                </span>
                <span class="create-menu-copy">
                  <strong>{{ t('topbarCreateMenu.createWorkspaceViewTitle') }}</strong>
                  <span>{{ t('topbarCreateMenu.createWorkspaceViewDesc') }}</span>
                </span>
              </button>

              <button class="create-menu-item" type="button" @click="handleCreateMenu('template')">
                <span class="create-menu-icon template" aria-hidden="true">
                  <span class="doc"></span>
                  <span class="plus">+</span>
                </span>
                <span class="create-menu-copy">
                  <strong>{{ t('topbarCreateMenu.startFromTemplateTitle') }}</strong>
                  <span>{{ t('topbarCreateMenu.startFromTemplateDesc') }}</span>
                </span>
              </button>
            </div>
          </el-popover>
        </div>
      </div>

      <div class="topbar-right">
        <button v-if="!isBoardRoute" class="topbar-utility-btn" type="button" :aria-label="t('workspaceHome.feedbackAria')" @click="showFeedback">
          <el-icon><Promotion /></el-icon>
        </button>
        <button class="topbar-utility-btn" type="button" :aria-label="t('workspaceHome.notifyAria')" @click="showNotifications">
          <el-icon><Bell /></el-icon>
        </button>
        <button v-if="!isBoardRoute" class="topbar-utility-btn" type="button" :aria-label="t('workspaceHome.helpAria')" @click="showHelp">
          <el-icon><QuestionFilled /></el-icon>
        </button>

        <el-popover
          v-model:visible="accountMenuVisible"
          trigger="click"
          placement="bottom-end"
          :width="320"
          popper-class="account-popover"
        >
          <template #reference>
            <button class="topbar-avatar-btn" type="button" :aria-label="t('workspaceHome.accountAria')">
              {{ accountInitial }}
            </button>
          </template>

          <section class="account-menu">
            <p class="menu-section-label">{{ t('accountMenu.accountSection') }}</p>
            <div class="account-identity">
              <p class="account-name">{{ accountName }}</p>
              <p class="account-email">{{ accountEmail }}</p>
            </div>

            <div class="menu-divider"></div>

            <button class="menu-item-btn" type="button" @click="switchAccount">
              <span class="menu-item-left">
                <el-icon><SwitchButton /></el-icon>
                {{ t('accountMenu.switchAccount') }}
              </span>
            </button>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('manage-account')">
              <span class="menu-item-left">{{ t('accountMenu.manageAccount') }}</span>
              <el-icon class="menu-item-right"><EditPen /></el-icon>
            </button>

            <div class="menu-divider"></div>

            <p class="menu-section-label upper">{{ t('accountMenu.trelloSection') }}</p>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('profile-visibility')">
              <span class="menu-item-left">{{ t('accountMenu.profileVisibility') }}</span>
            </button>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('activity')">
              <span class="menu-item-left">{{ t('accountMenu.activity') }}</span>
            </button>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('cards')">
              <span class="menu-item-left">{{ t('accountMenu.cards') }}</span>
            </button>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('settings')">
              <span class="menu-item-left">{{ t('accountMenu.settings') }}</span>
            </button>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('labs')">
              <span class="menu-item-left">{{ t('accountMenu.labs') }}</span>
              <span class="menu-chip">{{ t('accountMenu.labsTag') }}</span>
            </button>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('theme')">
              <span class="menu-item-left">{{ t('accountMenu.theme') }}</span>
              <el-icon class="menu-item-right"><ArrowRight /></el-icon>
            </button>

            <div class="menu-divider"></div>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('create-workspace')">
              <span class="menu-item-left">
                <el-icon><User /></el-icon>
                {{ t('accountMenu.createWorkspace') }}
              </span>
            </button>

            <div class="menu-divider"></div>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('help')">
              <span class="menu-item-left">{{ t('accountMenu.help') }}</span>
            </button>

            <button class="menu-item-btn" type="button" @click="openSettingsSection('shortcuts')">
              <span class="menu-item-left">{{ t('accountMenu.shortcuts') }}</span>
            </button>

            <div class="menu-divider"></div>

            <p class="menu-section-label upper">{{ t('accountMenu.lowtrelloSection') }}</p>

            <div class="account-row">
              <span class="account-label">{{ t('common.language') }}</span>
              <div class="lang-switch">
                <button :class="['lang-pill', { active: locale === 'zh' }]" @click="setLang('zh')">{{ t('common.chinese') }}</button>
                <button :class="['lang-pill', { active: locale === 'en' }]" @click="setLang('en')">{{ t('common.english') }}</button>
              </div>
            </div>

            <div class="account-row">
              <span class="account-label">{{ t('common.dropPresetLabel') }}</span>
              <div class="drop-preset-switch">
                <button
                  :class="['drop-preset-pill', { active: dropIndicatorPreset === 'soft' }]"
                  @click="setDropIndicatorPreset('soft')"
                >
                  {{ t('common.dropPresetSoft') }}
                </button>
                <button
                  :class="['drop-preset-pill', { active: dropIndicatorPreset === 'standard' }]"
                  @click="setDropIndicatorPreset('standard')"
                >
                  {{ t('common.dropPresetStandard') }}
                </button>
                <button
                  :class="['drop-preset-pill', { active: dropIndicatorPreset === 'strong' }]"
                  @click="setDropIndicatorPreset('strong')"
                >
                  {{ t('common.dropPresetStrong') }}
                </button>
              </div>
            </div>

            <button class="menu-item-btn" type="button" @click="migrateHistoryData">
              <span class="menu-item-left">{{ t('common.migrateData') }}</span>
            </button>

            <div class="menu-divider"></div>

            <button class="menu-item-btn danger" type="button" @click="logout">
              <span class="menu-item-left">{{ t('common.logout') }}</span>
            </button>
          </section>
        </el-popover>
      </div>
    </header>

    <main :class="['app-main', { 'dashboard-main': hasWorkspaceShell }]">
      <RouterView />
    </main>

    <el-drawer
      v-model="feedbackPanelVisible"
      class="topbar-panel-drawer"
      :title="t('topbarPanels.feedbackTitle')"
      direction="rtl"
      size="360px"
    >
      <div class="topbar-panel">
        <el-input
          v-model="feedbackDraft"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          :placeholder="t('topbarPanels.feedbackPlaceholder')"
        />
        <div class="topbar-panel-actions">
          <el-button type="primary" @click="submitFeedback">{{ t('topbarPanels.feedbackSubmit') }}</el-button>
          <el-button plain @click="clearFeedback">{{ t('topbarPanels.clear') }}</el-button>
        </div>

        <ul v-if="feedbackItems.length" class="topbar-panel-list">
          <li v-for="item in feedbackItems" :key="item.id" class="topbar-panel-item">
            <p class="topbar-panel-message">{{ item.message }}</p>
            <span class="topbar-panel-time">{{ formatDateTime(item.createdAt) }}</span>
          </li>
        </ul>
        <p v-else class="topbar-panel-empty">{{ t('topbarPanels.feedbackEmpty') }}</p>
      </div>
    </el-drawer>

    <el-drawer
      v-model="notificationsPanelVisible"
      class="topbar-panel-drawer"
      :title="t('topbarPanels.notificationsTitle')"
      direction="rtl"
      size="360px"
    >
      <div class="topbar-panel">
        <div class="topbar-panel-actions">
          <el-button plain @click="markAllNotificationsRead">{{ t('topbarPanels.notificationsMarkAllRead') }}</el-button>
        </div>

        <ul v-if="notificationItems.length" class="topbar-panel-list">
          <li v-for="item in notificationItems" :key="item.key" class="topbar-panel-item">
            <p class="topbar-panel-message">
              <strong class="topbar-panel-board">{{ item.boardTitle }}</strong>
              <span> · {{ item.message }}</span>
            </p>
            <div class="topbar-panel-meta">
              <el-tag v-if="isNotificationUnread(item)" size="small" type="warning">{{ t('topbarPanels.notificationsUnread') }}</el-tag>
              <span class="topbar-panel-time">{{ formatDateTime(item.createdAt) }}</span>
            </div>
          </li>
        </ul>
        <p v-else class="topbar-panel-empty">{{ t('topbarPanels.notificationsEmpty') }}</p>
      </div>
    </el-drawer>

    <el-drawer
      v-model="helpPanelVisible"
      class="topbar-panel-drawer"
      :title="t('topbarPanels.helpTitle')"
      direction="rtl"
      size="360px"
    >
      <div class="topbar-panel">
        <p class="topbar-panel-help-intro">{{ t('topbarPanels.helpIntro') }}</p>
        <ul class="topbar-panel-help-list">
          <li>{{ t('topbarPanels.helpTipArchive') }}</li>
          <li>{{ t('topbarPanels.helpTipActivity') }}</li>
          <li>{{ t('topbarPanels.helpTipMigrate') }}</li>
        </ul>
      </div>
    </el-drawer>
  </div>

  <RouterView v-else />
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import {
  ArrowRight,
  Bell,
  EditPen,
  Grid,
  House,
  Promotion,
  QuestionFilled,
  Search,
  SwitchButton,
  User
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBoardStore } from './stores/board'
import { useUserStore } from './stores/user'
import { applyDropIndicatorPreset, getSavedDropIndicatorPreset } from './utils/dropIndicatorPreset'
import { createId } from './utils/id'
import { loadFromStorage, loadString, saveString, saveToStorage } from './utils/storage'
import { applyThemePreset, getSavedThemePreset } from './utils/themePreset'

const route = useRoute()
const router = useRouter()
const boardStore = useBoardStore()
const userStore = useUserStore()

onMounted(() => {
  boardStore.init()
  dropIndicatorPreset.value = applyDropIndicatorPreset(dropIndicatorPreset.value)
  applyThemePreset(getSavedThemePreset())

  if (!userStore.isAuthenticated) {
    userStore.restoreSession().catch(() => {})
  }
})

const hasWorkspaceShell = computed(() => route.meta?.shell === 'workspace')
const isBoardRoute = computed(() => route.name === 'board')
const locale = computed(() => userStore.locale)
const t = userStore.t
const dropIndicatorPreset = ref(getSavedDropIndicatorPreset())
const accountMenuVisible = ref(false)
const appMenuVisible = ref(false)
const topSearchQuery = ref('')
const createMenuVisible = ref(false)
const feedbackPanelVisible = ref(false)
const notificationsPanelVisible = ref(false)
const helpPanelVisible = ref(false)

const FEEDBACK_STORAGE_KEY = 'lowtrello.feedback.v1'
const NOTIFICATIONS_READ_AT_KEY = 'lowtrello.notifications.readAt.v1'
const HELP_LAST_OPENED_AT_KEY = 'lowtrello.help.lastOpenedAt.v1'

const feedbackDraft = ref('')
const feedbackItems = ref(loadFromStorage(FEEDBACK_STORAGE_KEY, []))
const notificationsReadAt = ref(loadString(NOTIFICATIONS_READ_AT_KEY, ''))
const helpLastOpenedAt = ref(loadString(HELP_LAST_OPENED_AT_KEY, ''))
const accountName = computed(() => {
  return userStore.currentUser?.name || t('accountMenu.nameFallback')
})
const accountEmail = computed(() => {
  return userStore.currentUser?.email || t('accountMenu.emailFallback')
})
const accountInitial = computed(() => {
  const source = String(accountName.value || '').trim()
  return source ? source.charAt(0).toUpperCase() : 'U'
})

watch(
  [() => route.fullPath, locale],
  () => {
    if (typeof route.meta?.titleKey === 'string') {
      document.title = t(route.meta.titleKey)
    }
  },
  { immediate: true }
)

watch(
  () => route.query.q,
  (query) => {
    topSearchQuery.value = String(query || '').trim()
  },
  { immediate: true }
)

function goInitial() {
  const nextHref = router.resolve({ name: 'workspace' }).href
  window.location.href = nextHref
}

function navigateAppMenu(target) {
  appMenuVisible.value = false
  const key = String(target || '').trim()

  if (key === 'home') {
    router.push({ name: 'home' })
    return
  }

  if (key === 'trello') {
    goInitial()
  }

  if (key === 'all-apps') {
    router.push({
      name: 'home',
      query: {
        nav: 'all-apps'
      }
    })
  }
}

function openExternalUrl(url) {
  const safeUrl = String(url || '').trim()
  if (!safeUrl) {
    return
  }

  window.open(safeUrl, '_blank', 'noopener')
}

function handleCreateMenu(type) {
  createMenuVisible.value = false

  const createType = String(type || '').trim()
  if (!createType) {
    return
  }

  router.push({
    name: 'workspace',
    query: {
      ...route.query,
      create: createType
    }
  })
}

function submitTopSearch() {
  const keyword = topSearchQuery.value.trim()
  const currentKeyword = String(route.query.q || '').trim()

  if (route.name !== 'workspace') {
    router.push({
      name: 'workspace',
      query: keyword ? { q: keyword } : {}
    })
    return
  }

  if (keyword === currentKeyword) {
    return
  }

  const nextQuery = {
    ...route.query
  }

  if (keyword) {
    nextQuery.q = keyword
  } else {
    delete nextQuery.q
  }

  router.replace({
    name: 'workspace',
    query: nextQuery
  })
}

function setLang(nextLocale) {
  userStore.setLocale(nextLocale)
}

function setDropIndicatorPreset(nextPreset) {
  dropIndicatorPreset.value = applyDropIndicatorPreset(nextPreset)
}

function showFeedback() {
  feedbackPanelVisible.value = true
}

function showNotifications() {
  notificationsPanelVisible.value = true
}

function showHelp() {
  helpLastOpenedAt.value = new Date().toISOString()
  saveString(HELP_LAST_OPENED_AT_KEY, helpLastOpenedAt.value)
  helpPanelVisible.value = true
}

const notificationItems = computed(() => {
  const viewer = userStore.currentUser || {}
  const visibleBoards = boardStore.getVisibleBoards(viewer)
  const items = []

  visibleBoards.forEach((board) => {
    const boardTitle = String(board.title || '').trim() || t('boardView.untitledBoard')
    const activity = Array.isArray(board.activity) ? board.activity : []

    activity.forEach((entry) => {
      items.push({
        key: `${board.id}-${entry.id}`,
        id: entry.id,
        message: entry.message,
        createdAt: entry.createdAt,
        boardId: board.id,
        boardTitle
      })
    })
  })

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items.slice(0, 60)
})

function persistFeedback() {
  const normalized = Array.isArray(feedbackItems.value) ? feedbackItems.value : []
  saveToStorage(FEEDBACK_STORAGE_KEY, normalized)
}

function submitFeedback() {
  const message = String(feedbackDraft.value || '').trim()
  if (!message) {
    return
  }

  const nextItem = {
    id: createId('feedback'),
    message,
    createdAt: new Date().toISOString()
  }

  const list = Array.isArray(feedbackItems.value) ? feedbackItems.value : []
  feedbackItems.value = [nextItem, ...list].slice(0, 50)
  feedbackDraft.value = ''
  persistFeedback()
}

function clearFeedback() {
  feedbackItems.value = []
  persistFeedback()
}

function markAllNotificationsRead() {
  notificationsReadAt.value = new Date().toISOString()
  saveString(NOTIFICATIONS_READ_AT_KEY, notificationsReadAt.value)
}

function isNotificationUnread(item) {
  const readAt = notificationsReadAt.value
  if (!readAt) {
    return true
  }

  const readTime = new Date(readAt).getTime()
  const itemTime = new Date(item?.createdAt).getTime()
  return Number.isFinite(itemTime) && itemTime > readTime
}

function formatDateTime(dateValue) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return '--'
  }

  return parsed.toLocaleString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch(
  () => notificationsPanelVisible.value,
  (visible, wasVisible) => {
    if (wasVisible && !visible) {
      markAllNotificationsRead()
    }
  }
)

async function migrateHistoryData() {
  try {
    await ElMessageBox.confirm(
      t('common.migrateConfirmContent'),
      t('common.migrateConfirmTitle'),
      {
        type: 'warning',
        confirmButtonText: t('common.migrateData'),
        cancelButtonText: t('common.cancel')
      }
    )
  } catch {
    return
  }

  const { changeCount } = boardStore.migrateDataToCurrentLocale()
  if (changeCount > 0) {
    ElMessage.success(t('common.migrateSuccess', { count: changeCount }))
    return
  }

  ElMessage.info(t('common.migrateNoChanges'))
}

function logout() {
  accountMenuVisible.value = false
  userStore.logout()
  router.push({ name: 'landing' })
}

function switchAccount() {
  accountMenuVisible.value = false
  userStore.logout()
  router.push({ name: 'login' })
}

function openSettingsSection(sectionKey) {
  accountMenuVisible.value = false
  router.push({
    name: 'settings-section',
    params: {
      section: sectionKey
    }
  })
}
</script>

<style scoped>
.lowtrello-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid #d4d8de;
  background: #f6f7f9;
}

.board-topbar {
  border-bottom-color: rgba(255, 255, 255, 0.2);
  background: rgba(38, 23, 72, 0.5);
  backdrop-filter: blur(8px);
}

.topbar-left,
.topbar-center,
.topbar-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.topbar-center {
  flex: 1;
  justify-content: center;
}

.topbar-center-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.topbar-right {
  justify-content: flex-end;
}

.topbar-icon-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #3f4f65;
  cursor: pointer;
}

.topbar-icon-btn:hover {
  background: #e6eaf0;
}

.brand-tile {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 6px;
  background: linear-gradient(180deg, #0e66e6, #0a56c5);
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.brand-word {
  padding: 0;
  border: 0;
  background: transparent;
  color: #1f2f47;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.board-topbar .brand-word {
  color: #ffffff;
}

.topbar-search {
  position: relative;
  display: block;
  width: 782px;
  min-width: 320px;
  max-width: 782px;
  height: 32px;
}

:deep(.appmenu-popover) {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #d7dde8;
  box-shadow: 0 14px 34px rgba(20, 43, 74, 0.18);
  box-sizing: border-box;
  height: 600px;
}

:deep(.appmenu-popover .el-popper__arrow) {
  display: none;
}

.appmenu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.appmenu-dev {
  flex: 1;
  min-height: 0;
  color: #6c7c92;
  font-size: 12px;
  display: flex;
  align-items: flex-start;
}

.appmenu-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.appmenu-nav-item,
.appmenu-footer {
  width: 303px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #1f2f46;
  height: 32px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: background-color 85ms ease, color 85ms ease;
}

.appmenu-nav-item:hover,
.appmenu-footer:hover {
  background: #f6f7f9;
}

.appmenu-nav-item.active {
  background: #e9f2ff;
  color: #0f63e6;
}

.appmenu-nav-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 303px;
}

.appmenu-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.appmenu-item-icon.home {
  background: #ebecf0;
  color: #1f2d40;
}

.appmenu-item-icon.trello {
  background: linear-gradient(180deg, #0e66e6, #0a56c5);
  gap: 4px;
  padding: 6px;
}

.appmenu-item-icon.trello .trello-col {
  width: 8px;
  height: 100%;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.96);
  display: block;
}

.appmenu-nav-text {
  width: 263px;
  height: 20px;
  line-height: 20px;
  display: inline-block;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.topbar-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c7c92;
}

.topbar-search-input {
  width: 100%;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #c5ccd6;
  background: #ffffff;
  color: #203451;
  font-size: 14px;
  padding: 0 10px 0 34px;
  outline: none;
}

.topbar-search-input:focus {
  border-color: #0f63e6;
  box-shadow: 0 0 0 2px rgba(15, 99, 230, 0.14);
}

.board-topbar .topbar-search-icon {
  color: #d8ddf2;
}

.board-topbar .topbar-search-input {
  border-color: rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.board-topbar .topbar-search-input::placeholder {
  color: rgba(255, 255, 255, 0.82);
}

.board-topbar .topbar-search-input:focus {
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.16);
}

.topbar-create-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-weight: 600;
}

:global(.create-menu-popover) {
  padding: 8px;
}

.create-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.create-menu-item {
  width: 100%;
  border: 1px solid #e3e7ee;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  text-align: left;
  cursor: pointer;
}

.create-menu-item:hover {
  background: #f6f7f9;
}

.create-menu-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #d7dde8;
  background: #f6f7f9;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
}

.create-menu-icon.board {
  grid-template-columns: repeat(2, 8px);
  grid-template-rows: repeat(2, 8px);
  gap: 4px;
}

.create-menu-icon.board span {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: #0f63e6;
  display: block;
}

.create-menu-icon.workspace {
  grid-template-columns: repeat(3, 6px);
  grid-template-rows: repeat(3, 6px);
  gap: 3px;
}

.create-menu-icon.workspace span {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: #5e86c6;
  display: block;
}

.create-menu-icon.template .doc {
  width: 16px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid #aeb9ca;
  background: #ffffff;
  display: block;
}

.create-menu-icon.template .plus {
  position: absolute;
  right: 5px;
  bottom: 3px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #0f63e6;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  display: grid;
  place-items: center;
}

.create-menu-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.create-menu-copy strong {
  color: #1f2f47;
  font-size: 13px;
  font-weight: 700;
}

.create-menu-copy span {
  color: #6c7c92;
  font-size: 12px;
  line-height: 1.4;
}

.topbar-utility-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #3f4f65;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.topbar-utility-btn:hover {
  background: #dfe5ee;
}

.board-topbar .topbar-utility-btn {
  color: #f4f5ff;
}

.board-topbar .topbar-utility-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.topbar-avatar-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: #d9e6fa;
  color: #1f3f66;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.board-topbar .topbar-avatar-btn {
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}

.lang-switch {
  display: inline-flex;
  border: 1px solid #d6e2f0;
  border-radius: 999px;
  overflow: hidden;
}

.lang-pill {
  border: 0;
  background: #ffffff;
  color: #37567f;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
}

.lang-pill.active {
  background: #0f63e6;
  color: #ffffff;
}

.drop-preset-switch {
  display: inline-flex;
  border: 1px solid #d6e2f0;
  border-radius: 999px;
  overflow: hidden;
}

.drop-preset-pill {
  border: 0;
  background: #ffffff;
  color: #37567f;
  font-size: 12px;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  cursor: pointer;
}

.drop-preset-pill.active {
  background: #0c66e4;
  color: #ffffff;
}

:deep(.account-popover) {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #d7dde8;
  box-shadow: 0 14px 34px rgba(20, 43, 74, 0.18);
}

:deep(.account-popover .el-popper__arrow) {
  display: none;
}

.account-menu {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.menu-section-label {
  margin: 0;
  color: #6f8099;
  font-size: 11px;
  font-weight: 600;
}

.menu-section-label.upper {
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.account-identity {
  padding: 6px 0 4px;
}

.account-name {
  margin: 0;
  color: #172b4d;
  font-size: 14px;
  font-weight: 600;
}

.account-email {
  margin: 2px 0 0;
  color: #6f8099;
  font-size: 12px;
}

.menu-divider {
  height: 1px;
  background: #e4e8ef;
  margin: 8px 0;
}

.account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 0;
}

.account-label {
  font-size: 12px;
  color: #526784;
  min-width: 64px;
}

.menu-item-btn {
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2f46;
  min-height: 32px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 8px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: background-color 85ms ease, color 85ms ease;
}

.menu-item-btn:hover {
  background: #e9f2ff;
  color: #1868db;
}

.menu-item-btn.danger {
  color: #b42323;
}

.menu-item-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.menu-item-right {
  color: #7a8aa1;
}

.menu-chip {
  background: #e9e6ff;
  color: #6355d6;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1;
  padding: 3px 8px;
}

.dashboard-main {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
}

@media (max-width: 960px) {
  .lowtrello-topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .topbar-center {
    order: 3;
  }

  .topbar-right {
    order: 2;
  }

  .topbar-search {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .topbar-center-inner {
    width: 100%;
  }

  .topbar-search-input {
    width: 100%;
  }

  .topbar-right {
    flex: initial;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>

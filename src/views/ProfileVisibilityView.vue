<template>
  <section class="profile-settings-page">
    <aside class="settings-sidebar">
      <button class="back-link" type="button" @click="goWorkspace">
        <el-icon><ArrowLeft /></el-icon>
        <span>{{ t('profileVisibility.backToWorkspace') }}</span>
      </button>

      <div class="settings-menu">
        <button
          v-for="item in personalSections"
          :key="item.key"
          type="button"
          :class="['settings-item', { active: section === item.key }]"
          @click="openSection(item.key)"
        >
          {{ t(item.labelKey) }}
        </button>
      </div>

      <p class="workspace-heading">{{ t('profileVisibility.workspaceSettings') }}</p>

      <div class="settings-menu compact">
        <button
          v-for="item in workspaceSections"
          :key="item.key"
          type="button"
          :class="['settings-item', { active: section === item.key }]"
          @click="openSection(item.key)"
        >
          {{ t(item.labelKey) }}
        </button>
      </div>

      <span class="premium-badge">{{ t('profileVisibility.premium') }}</span>
    </aside>

    <main class="settings-main">
      <h1>{{ currentSectionTitle }}</h1>

      <template v-if="section === 'profile-visibility'">
        <section class="profile-banner">
          <div class="banner-art">🐺</div>
          <div class="banner-squares">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </section>

        <section class="settings-card">
          <h2>{{ t('profileVisibility.manageInfoTitle') }}</h2>
          <p>{{ t('profileVisibility.manageInfoDesc') }}</p>
          <div class="link-row">
            <a href="#" @click.prevent="openPlaceholderLink(t('profileVisibility.atlassianProfile'))">{{ t('profileVisibility.atlassianProfile') }}</a>
            <a href="#" @click.prevent="openPlaceholderLink(t('profileVisibility.privacyPolicy'))">{{ t('profileVisibility.privacyPolicy') }}</a>
          </div>
        </section>

        <section class="settings-card">
          <h2>{{ t('profileVisibility.aboutTitle') }}</h2>

          <el-form label-position="top">
            <el-form-item :label="t('profileVisibility.usernameLabel')">
              <el-input v-model="username" maxlength="24" />
              <p class="field-hint">{{ t('profileVisibility.usernameHint') }}</p>
            </el-form-item>

            <el-form-item :label="t('profileVisibility.bioLabel')">
              <el-input
                v-model="bio"
                type="textarea"
                :rows="4"
                maxlength="220"
                :placeholder="t('profileVisibility.bioPlaceholder')"
              />
              <p class="field-hint">{{ t('profileVisibility.bioHint') }}</p>
            </el-form-item>
          </el-form>

          <div class="actions-row">
            <el-button type="primary" @click="saveProfile">{{ t('common.save') }}</el-button>
          </div>
        </section>
      </template>

      <section v-else-if="section === 'manage-account'" class="settings-card">
        <h2>{{ t('profileVisibility.manageAccountTitle') }}</h2>
        <p>{{ t('profileVisibility.manageAccountDesc') }}</p>

        <el-form label-position="top">
          <el-form-item :label="t('profileVisibility.accountNameLabel')">
            <el-input v-model="accountForm.name" maxlength="32" />
          </el-form-item>

          <el-form-item :label="t('profileVisibility.accountEmailLabel')">
            <el-input v-model="accountForm.email" maxlength="120" />
          </el-form-item>
        </el-form>

        <div class="actions-row">
          <el-button type="primary" @click="saveAccount">{{ t('common.save') }}</el-button>
        </div>
      </section>

      <section v-else-if="section === 'activity'" class="settings-card">
        <h2>{{ t('profileVisibility.activityTitle') }}</h2>
        <p>{{ t('profileVisibility.activityDesc') }}</p>

        <ul v-if="activityItems.length" class="activity-list">
          <li v-for="item in activityItems" :key="item.id">
            <strong>{{ item.title }}</strong>
            <span>{{ item.time }}</span>
          </li>
        </ul>

        <p v-else class="empty-copy">{{ t('profileVisibility.noActivity') }}</p>
      </section>

      <section v-else-if="section === 'cards'" class="settings-card">
        <h2>{{ t('profileVisibility.cardsTitle') }}</h2>
        <p>{{ t('profileVisibility.cardsDesc') }}</p>

        <div class="toggle-list">
          <div class="toggle-item">
            <span>{{ t('profileVisibility.cardShowDueDate') }}</span>
            <el-switch v-model="cardPrefs.showDueDate" />
          </div>
          <div class="toggle-item">
            <span>{{ t('profileVisibility.cardShowAttachmentCount') }}</span>
            <el-switch v-model="cardPrefs.showAttachmentCount" />
          </div>
          <div class="toggle-item">
            <span>{{ t('profileVisibility.cardCompactMode') }}</span>
            <el-switch v-model="cardPrefs.compactMode" />
          </div>
        </div>

        <div class="actions-row">
          <el-button type="primary" @click="saveCardPrefs">{{ t('common.save') }}</el-button>
        </div>
      </section>

      <section v-else-if="section === 'settings'" class="settings-card">
        <h2>{{ t('profileVisibility.appSettingsTitle') }}</h2>
        <p>{{ t('profileVisibility.appSettingsDesc') }}</p>

        <div class="toggle-list">
          <div class="toggle-item">
            <span>{{ t('profileVisibility.appEnableNotifications') }}</span>
            <el-switch v-model="appPrefs.notifications" />
          </div>
          <div class="toggle-item">
            <span>{{ t('profileVisibility.appSoundEffects') }}</span>
            <el-switch v-model="appPrefs.sound" />
          </div>
          <div class="toggle-item">
            <span>{{ t('profileVisibility.appShowHints') }}</span>
            <el-switch v-model="appPrefs.hints" />
          </div>
        </div>

        <div class="actions-row">
          <el-button type="primary" @click="saveAppPrefs">{{ t('common.save') }}</el-button>
        </div>
      </section>

      <section v-else-if="section === 'labs'" class="settings-card">
        <h2>{{ t('profileVisibility.labsTitle') }}</h2>
        <p>{{ t('profileVisibility.labsDesc') }}</p>

        <div class="toggle-list">
          <div class="toggle-item">
            <span>{{ t('profileVisibility.labsSmartSort') }}</span>
            <el-switch v-model="labsPrefs.smartSort" />
          </div>
          <div class="toggle-item">
            <span>{{ t('profileVisibility.labsQuickAdd') }}</span>
            <el-switch v-model="labsPrefs.quickAdd" />
          </div>
          <div class="toggle-item">
            <span>{{ t('profileVisibility.labsBoardInsights') }}</span>
            <el-switch v-model="labsPrefs.insights" />
          </div>
        </div>

        <div class="actions-row">
          <el-button type="primary" @click="saveLabsPrefs">{{ t('common.save') }}</el-button>
        </div>
      </section>

      <section v-else-if="section === 'theme'" class="settings-card">
        <h2>{{ t('profileVisibility.themeTitle') }}</h2>
        <p>{{ t('profileVisibility.themeDesc') }}</p>

        <div class="theme-grid">
          <button
            v-for="theme in themeOptions"
            :key="theme.key"
            type="button"
            :class="['theme-item', { active: selectedTheme === theme.key }]"
            @click="selectedTheme = theme.key"
          >
            <span :class="['theme-dot', theme.key]"></span>
            <span>{{ theme.label }}</span>
          </button>
        </div>

        <div class="actions-row">
          <el-button type="primary" @click="saveTheme">{{ t('common.save') }}</el-button>
        </div>
      </section>

      <section v-else-if="section === 'create-workspace'" class="settings-card">
        <h2>{{ t('profileVisibility.createWorkspaceTitle') }}</h2>
        <p>{{ t('profileVisibility.createWorkspaceDesc') }}</p>

        <el-form label-position="top">
          <el-form-item :label="t('profileVisibility.workspaceNameLabel')">
            <el-input v-model="workspaceForm.name" maxlength="36" />
          </el-form-item>

          <el-form-item :label="t('profileVisibility.workspaceDescLabel')">
            <el-input
              v-model="workspaceForm.description"
              type="textarea"
              :rows="3"
              maxlength="220"
              :placeholder="t('profileVisibility.workspaceDescPlaceholder')"
            />
          </el-form-item>
        </el-form>

        <div class="actions-row">
          <el-button type="primary" @click="createWorkspace">{{ t('profileVisibility.createWorkspaceNow') }}</el-button>
        </div>
      </section>

      <section v-else-if="section === 'help'" class="settings-card">
        <h2>{{ t('profileVisibility.helpTitle') }}</h2>
        <p>{{ t('profileVisibility.helpDesc') }}</p>
        <div class="link-row">
          <a href="#" @click.prevent="openPlaceholderLink(t('profileVisibility.helpDocs'))">{{ t('profileVisibility.helpDocs') }}</a>
          <a href="#" @click.prevent="openPlaceholderLink(t('profileVisibility.helpCommunity'))">{{ t('profileVisibility.helpCommunity') }}</a>
          <a href="#" @click.prevent="openPlaceholderLink(t('profileVisibility.helpSupport'))">{{ t('profileVisibility.helpSupport') }}</a>
        </div>
      </section>

      <section v-else-if="section === 'shortcuts'" class="settings-card">
        <h2>{{ t('profileVisibility.shortcutsTitle') }}</h2>
        <p>{{ t('profileVisibility.shortcutsDesc') }}</p>

        <ul class="shortcut-list">
          <li>
            <span>{{ t('profileVisibility.shortcutSearch') }}</span>
            <kbd>/</kbd>
          </li>
          <li>
            <span>{{ t('profileVisibility.shortcutCreate') }}</span>
            <kbd>C</kbd>
          </li>
          <li>
            <span>{{ t('profileVisibility.shortcutOpenMenu') }}</span>
            <kbd>M</kbd>
          </li>
          <li>
            <span>{{ t('profileVisibility.shortcutSave') }}</span>
            <kbd>Ctrl</kbd> + <kbd>S</kbd>
          </li>
        </ul>
      </section>
    </main>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import { useBoardStore } from '../stores/board'
import { loadFromStorage, saveToStorage } from '../utils/storage'
import { applyThemePreset, getSavedThemePreset } from '../utils/themePreset'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const boardStore = useBoardStore()
const t = userStore.t

const CARD_PREFS_KEY = 'lowtrello.cards.prefs.v1'
const APP_PREFS_KEY = 'lowtrello.app.prefs.v1'
const LAB_PREFS_KEY = 'lowtrello.labs.prefs.v1'

const VALID_SECTIONS = [
  'manage-account',
  'profile-visibility',
  'activity',
  'cards',
  'settings',
  'labs',
  'theme',
  'create-workspace',
  'help',
  'shortcuts'
]

const personalSections = [
  { key: 'profile-visibility', labelKey: 'accountMenu.profileVisibility' },
  { key: 'activity', labelKey: 'accountMenu.activity' },
  { key: 'cards', labelKey: 'accountMenu.cards' },
  { key: 'settings', labelKey: 'accountMenu.settings' },
  { key: 'labs', labelKey: 'accountMenu.labs' }
]

const workspaceSections = [
  { key: 'create-workspace', labelKey: 'accountMenu.createWorkspace' },
  { key: 'theme', labelKey: 'accountMenu.theme' },
  { key: 'manage-account', labelKey: 'accountMenu.manageAccount' },
  { key: 'help', labelKey: 'accountMenu.help' },
  { key: 'shortcuts', labelKey: 'accountMenu.shortcuts' }
]

const SECTION_TITLE_KEY_MAP = {
  'manage-account': 'accountMenu.manageAccount',
  'profile-visibility': 'profileVisibility.title',
  activity: 'accountMenu.activity',
  cards: 'accountMenu.cards',
  settings: 'accountMenu.settings',
  labs: 'accountMenu.labs',
  theme: 'accountMenu.theme',
  'create-workspace': 'accountMenu.createWorkspace',
  help: 'accountMenu.help',
  shortcuts: 'accountMenu.shortcuts'
}

const username = ref('')
const bio = ref('')
const selectedTheme = ref(getSavedThemePreset())

const accountForm = reactive({
  name: '',
  email: ''
})

const workspaceForm = reactive({
  name: '',
  description: ''
})

const cardPrefs = reactive(loadFromStorage(CARD_PREFS_KEY, {
  showDueDate: true,
  showAttachmentCount: true,
  compactMode: false
}))

const appPrefs = reactive(loadFromStorage(APP_PREFS_KEY, {
  notifications: true,
  sound: false,
  hints: true
}))

const labsPrefs = reactive(loadFromStorage(LAB_PREFS_KEY, {
  smartSort: false,
  quickAdd: true,
  insights: false
}))

const section = computed(() => {
  const routeSection = String(route.params.section || 'profile-visibility')
  return VALID_SECTIONS.includes(routeSection) ? routeSection : 'profile-visibility'
})

const currentSectionTitle = computed(() => {
  const key = SECTION_TITLE_KEY_MAP[section.value] || 'profileVisibility.title'
  return t(key)
})

const themeOptions = computed(() => {
  return [
    { key: 'classic', label: t('profileVisibility.themeClassic') },
    { key: 'ocean', label: t('profileVisibility.themeOcean') },
    { key: 'sunset', label: t('profileVisibility.themeSunset') }
  ]
})

const activityItems = computed(() => {
  const entries = []

  boardStore.boards.slice(0, 3).forEach((board) => {
    const listCount = Array.isArray(board.lists) ? board.lists.length : 0
    entries.push({
      id: `${board.id}-lists`,
      title: t('profileVisibility.activityBoardLists', { title: board.title, count: listCount }),
      time: formatDate(board.createdAt)
    })
  })

  if (userStore.currentUser?.email) {
    entries.unshift({
      id: 'profile-email',
      title: t('profileVisibility.activityEmailLinked', { email: userStore.currentUser.email }),
      time: t('profileVisibility.activityNow')
    })
  }

  return entries
})

onMounted(() => {
  if (!userStore.isAuthenticated) {
    router.replace({ name: 'login' })
    return
  }

  boardStore.init()
  syncFromProfile()
  ensureValidRouteSection()
})

watch(
  () => route.params.section,
  () => {
    ensureValidRouteSection()
  }
)

watch(
  () => userStore.currentUser,
  () => {
    syncFromProfile()
  },
  { deep: true }
)

function ensureValidRouteSection() {
  if (!VALID_SECTIONS.includes(String(route.params.section || ''))) {
    router.replace({
      name: 'settings-section',
      params: {
        section: 'profile-visibility'
      }
    })
  }
}

function syncFromProfile() {
  const profile = userStore.currentUser || {}
  username.value = profile.name || ''
  bio.value = profile.bio || ''
  accountForm.name = profile.name || ''
  accountForm.email = profile.email || ''
  workspaceForm.name = profile.workspaceName || t('workspaceHome.workspaceName')
  workspaceForm.description = profile.workspaceDescription || ''
}

function goWorkspace() {
  router.push({ name: 'workspace' })
}

function openSection(nextSection) {
  if (nextSection === section.value) {
    return
  }

  router.push({
    name: 'settings-section',
    params: {
      section: nextSection
    }
  })
}

function saveProfile() {
  const nextName = username.value.trim()
  if (!nextName) {
    ElMessage.warning(t('profileVisibility.usernameRequired'))
    return
  }

  userStore.updateProfile({
    name: nextName,
    bio: bio.value.trim()
  })

  ElMessage.success(t('profileVisibility.saved'))
}

function saveAccount() {
  const name = accountForm.name.trim()
  const email = accountForm.email.trim()

  if (!name) {
    ElMessage.warning(t('profileVisibility.usernameRequired'))
    return
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    ElMessage.warning(t('auth.emailRequired'))
    return
  }

  userStore.updateProfile({
    name,
    email
  })
  ElMessage.success(t('profileVisibility.accountSaved'))
}

function saveCardPrefs() {
  saveToStorage(CARD_PREFS_KEY, { ...cardPrefs })
  ElMessage.success(t('profileVisibility.preferencesSaved'))
}

function saveAppPrefs() {
  saveToStorage(APP_PREFS_KEY, { ...appPrefs })
  ElMessage.success(t('profileVisibility.settingsSaved'))
}

function saveLabsPrefs() {
  saveToStorage(LAB_PREFS_KEY, { ...labsPrefs })
  ElMessage.success(t('profileVisibility.labsSaved'))
}

function saveTheme() {
  selectedTheme.value = applyThemePreset(selectedTheme.value)
  ElMessage.success(t('profileVisibility.themeSaved'))
}

function createWorkspace() {
  const workspaceName = workspaceForm.name.trim()
  if (!workspaceName) {
    ElMessage.warning(t('profileVisibility.workspaceNameRequired'))
    return
  }

  userStore.updateProfile({
    workspaceName,
    workspaceDescription: workspaceForm.description.trim()
  })

  ElMessage.success(t('profileVisibility.workspaceCreated', { name: workspaceName }))
  router.push({ name: 'workspace' })
}

function openPlaceholderLink(label) {
  const action = String(label || '').trim() || t('profileVisibility.helpTitle')
  ElMessage.info(t('accountMenu.actionHint', { action }))
}

function formatDate(dateValue) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return t('profileVisibility.activityNow')
  }

  return parsed.toLocaleString(userStore.locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.profile-settings-page {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: calc(100vh - 64px);
  background: #f4f5f7;
}

.settings-sidebar {
  border-right: 1px solid #d9dee6;
  background: #f1f2f4;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.back-link {
  border: 0;
  background: transparent;
  color: #2c4364;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
}

.back-link:hover {
  background: #e5eaf2;
}

.settings-menu {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-menu.compact {
  margin-top: 6px;
}

.settings-item {
  border: 0;
  background: transparent;
  color: #22354f;
  text-align: left;
  font-size: 14px;
  line-height: 1.2;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.settings-item:hover {
  background: #e7ecf5;
}

.settings-item.active {
  background: #e9f2ff;
  color: #1868db;
  font-weight: 600;
}

.workspace-heading {
  margin: 16px 8px 4px;
  color: #6f8099;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.premium-badge {
  margin-top: auto;
  width: fit-content;
  font-size: 11px;
  color: #ffffff;
  border-radius: 999px;
  background: linear-gradient(130deg, #246adf, #0f4eb3);
  padding: 4px 10px;
}

.settings-main {
  padding: 26px 30px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settings-main h1 {
  margin: 0;
  color: #1f334f;
  font-size: 30px;
}

.profile-banner {
  border-radius: 12px;
  border: 1px solid #dbe3ef;
  background: linear-gradient(150deg, #f0f5ff, #f7f0ff);
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.banner-art {
  font-size: 40px;
}

.banner-squares {
  display: grid;
  grid-template-columns: repeat(2, 18px);
  gap: 6px;
}

.banner-squares span {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}

.banner-squares span:nth-child(1) {
  background: #5d7dfa;
}

.banner-squares span:nth-child(2) {
  background: #fa7f7f;
}

.banner-squares span:nth-child(3) {
  background: #73d7a2;
}

.banner-squares span:nth-child(4) {
  background: #f3c254;
}

.settings-card {
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  padding: 14px;
}

.settings-card h2 {
  margin: 0;
  color: #213450;
  font-size: 18px;
}

.settings-card p {
  margin: 8px 0 0;
  color: #4f6585;
  font-size: 14px;
}

.link-row {
  margin-top: 8px;
  display: inline-flex;
  gap: 14px;
  flex-wrap: wrap;
}

.link-row a {
  color: #0f63e6;
  text-decoration: none;
  font-size: 13px;
}

.link-row a:hover {
  text-decoration: underline;
}

.field-hint {
  margin: 6px 0 0;
  color: #6a7f9c;
  font-size: 12px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
}

.toggle-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-item {
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  padding: 9px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #1f334f;
  font-size: 14px;
}

.theme-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 8px;
}

.theme-item {
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #1f334f;
}

.theme-item.active {
  border-color: #0f63e6;
  box-shadow: 0 0 0 2px rgba(15, 99, 230, 0.14);
}

.theme-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.theme-dot.classic {
  background: #0052d9;
}

.theme-dot.ocean {
  background: #0a5d8d;
}

.theme-dot.sunset {
  background: #b45309;
}

.activity-list,
.shortcut-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-list li,
.shortcut-list li {
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  padding: 9px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.activity-list li strong {
  font-size: 14px;
  color: #213451;
}

.activity-list li span {
  font-size: 12px;
  color: #6a7f9c;
}

.shortcut-list kbd {
  border: 1px solid #cbd8ea;
  border-radius: 6px;
  background: #f6f9ff;
  padding: 1px 6px;
  font-size: 12px;
  color: #2f4767;
}

.empty-copy {
  margin-top: 10px;
  color: #6a7f9c;
}

@media (max-width: 980px) {
  .profile-settings-page {
    grid-template-columns: 1fr;
  }

  .settings-sidebar {
    border-right: 0;
    border-bottom: 1px solid #d9dee6;
  }

  .settings-main {
    padding: 14px;
  }
}
</style>

import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { createId } from '../utils/id'
import { loadFromStorage, loadString, saveString, saveToStorage } from '../utils/storage'
import { normalizeBoardBackground } from '../utils/boardBackgrounds'
import { useUserStore } from './user'
import http from '../lib/http'

const BOARDS_KEY = 'lowtrello.boards.v1'
const CURRENT_BOARD_KEY = 'lowtrello.current_board_id.v1'
const LOCALE_KEY = 'lowtrello.locale.v1'

const LOCALIZED_TEXTS = {
  zh: {
    labelFeature: '功能',
    labelBug: '问题',
    labelBlocked: '阻塞',
    attachment: '附件',
    untitledTask: '未命名任务',
    untitledList: '未命名列表',
    untitledBoard: '未命名看板',
    labelName: '标签',
    demoUser: '演示用户',
    designPartner: '设计协作',
    boardTitle: '产品冲刺',
    boardDescription: '这是你的首个计划看板示例。',
    todo: '待处理',
    doing: '进行中',
    done: '已完成',
    card1Title: '整理入门流程草稿',
    card1Desc: '完成新用户引导清单的第一版文案。',
    card2Title: '排查首页按钮问题',
    card2Desc: '修复首屏 CTA 点击无响应的问题。',
    card3Title: '准备周报',
    card3Desc: '整理核心指标并更新项目面板。',
    card4Title: '项目启动会',
    card4Desc: '统一目标范围并对齐里程碑。',
    newList: '新列表',
    checklistUntitled: '未命名检查项',
    commentUntitledAuthor: '成员',
    activityCardUpdated: '更新了卡片内容',
    activityBoardUpdated: '更新了看板信息',
    activityListAdded: '添加了列表“{title}”',
    activityListArchived: '归档了列表“{title}”',
    activityListRestored: '恢复了列表“{title}”',
    activityListDeleted: '永久删除了列表“{title}”',
    activityCardCreated: '创建了卡片“{title}”',
    activityCardArchived: '归档了卡片“{title}”',
    activityCardRestored: '恢复了卡片“{title}”',
    activityCardDeleted: '永久删除了卡片“{title}”',
    activityBoardCommentAdded: '在卡片“{title}”添加了评论',
    activityBoardAttachmentAdded: '为卡片“{title}”上传了附件',
    activityBoardAssigneesUpdated: '更新了卡片“{title}”的指派成员',
    activityCommentAdded: '添加了一条评论',
    activityChecklistAdded: '添加了检查项',
    activityChecklistToggled: '更新了检查项状态',
    activityChecklistRemoved: '移除了检查项',
    activityAssigneesUpdated: '更新了指派成员',
    activityAttachmentAdded: '上传了附件',
    activityDueReminder: '自动化提醒：卡片即将到期',
    activityAutoMoved: '自动化：检查项完成后移动到已完成列表',
    activityRuleTriggered: '自动化规则已触发',
    automationBot: '自动化助手',
    automationCommentTemplate: '自动化规则“{ruleName}”已执行。',
    ruleDueReminderName: '到期提醒',
    ruleChecklistMoveName: '清单完成后移动到 Done',
    integrationSlack: '消息平台',
    integrationDrive: '云端网盘',
    integrationGithub: '代码仓库',
    integrationWebhook: 'Webhook'
  },
  en: {
    labelFeature: 'Feature',
    labelBug: 'Bug',
    labelBlocked: 'Blocked',
    attachment: 'Attachment',
    untitledTask: 'Untitled task',
    untitledList: 'Untitled list',
    untitledBoard: 'Untitled board',
    labelName: 'Label',
    demoUser: 'Demo User',
    designPartner: 'Design Partner',
    boardTitle: 'Product Sprint',
    boardDescription: 'Sample board for your first planning session.',
    todo: 'Todo',
    doing: 'Doing',
    done: 'Done',
    card1Title: 'Draft onboarding flow',
    card1Desc: 'Create first-pass copy for onboarding checklist.',
    card2Title: 'Triage homepage bug',
    card2Desc: 'Fix broken CTA action in the hero section.',
    card3Title: 'Prepare weekly report',
    card3Desc: 'Collect metrics and update PM dashboard.',
    card4Title: 'Project kickoff',
    card4Desc: 'Align stakeholders and define scope.',
    newList: 'New list',
    checklistUntitled: 'Untitled checklist item',
    commentUntitledAuthor: 'Member',
    activityCardUpdated: 'Updated card details',
    activityBoardUpdated: 'Updated board details',
    activityListAdded: 'Added list "{title}"',
    activityListArchived: 'Archived list "{title}"',
    activityListRestored: 'Restored list "{title}"',
    activityListDeleted: 'Deleted list "{title}" permanently',
    activityCardCreated: 'Created card "{title}"',
    activityCardArchived: 'Archived card "{title}"',
    activityCardRestored: 'Restored card "{title}"',
    activityCardDeleted: 'Deleted card "{title}" permanently',
    activityBoardCommentAdded: 'Added a comment on card "{title}"',
    activityBoardAttachmentAdded: 'Uploaded an attachment for card "{title}"',
    activityBoardAssigneesUpdated: 'Updated assignees for card "{title}"',
    activityCommentAdded: 'Added a comment',
    activityChecklistAdded: 'Added a checklist item',
    activityChecklistToggled: 'Updated checklist status',
    activityChecklistRemoved: 'Removed a checklist item',
    activityAssigneesUpdated: 'Updated assignees',
    activityAttachmentAdded: 'Uploaded an attachment',
    activityDueReminder: 'Automation reminder: card is due soon',
    activityAutoMoved: 'Automation: moved card to done list after checklist completion',
    activityRuleTriggered: 'Automation rule triggered',
    automationBot: 'Automation Bot',
    automationCommentTemplate: 'Automation rule "{ruleName}" has been applied.',
    ruleDueReminderName: 'Due reminder',
    ruleChecklistMoveName: 'Move to done when checklist completed',
    integrationSlack: 'Chat tool',
    integrationDrive: 'Cloud drive',
    integrationGithub: 'Code hosting',
    integrationWebhook: 'Webhook'
  }
}

const BOARD_VISIBILITY_VALUES = ['workspace', 'private', 'public']
const DEFAULT_WORKSPACE_KEY = 'default-workspace'

const MIGRATABLE_TEXT_KEYS = [
  'labelFeature',
  'labelBug',
  'labelBlocked',
  'attachment',
  'untitledTask',
  'untitledList',
  'untitledBoard',
  'labelName',
  'demoUser',
  'designPartner',
  'boardTitle',
  'boardDescription',
  'todo',
  'doing',
  'done',
  'card1Title',
  'card1Desc',
  'card2Title',
  'card2Desc',
  'card3Title',
  'card3Desc',
  'card4Title',
  'card4Desc',
  'newList'
]

const MIGRATABLE_VALUE_TO_KEY = Object.values(LOCALIZED_TEXTS).reduce((valueMap, dictionary) => {
  MIGRATABLE_TEXT_KEYS.forEach((key) => {
    const value = dictionary[key]
    if (typeof value === 'string' && value.length) {
      valueMap.set(value, key)
    }
  })
  return valueMap
}, new Map())

function getLocale() {
  return loadString(LOCALE_KEY, 'zh') === 'en' ? 'en' : 'zh'
}

function localizedText(key) {
  const locale = getLocale()
  return LOCALIZED_TEXTS[locale]?.[key] || LOCALIZED_TEXTS.zh[key] || key
}

function localizedTextWithParams(key, params = {}) {
  const template = localizedText(key)
  return String(template).replace(/\{(\w+)\}/g, (_, token) => {
    if (Object.prototype.hasOwnProperty.call(params, token)) {
      return String(params[token])
    }

    return `{${token}}`
  })
}

function translateMigratableValue(value) {
  if (typeof value !== 'string') {
    return value
  }

  const matchedKey = MIGRATABLE_VALUE_TO_KEY.get(value)
  if (!matchedKey) {
    return value
  }

  return localizedText(matchedKey)
}

function nowIsoString() {
  return new Date().toISOString()
}

function normalizeSearchKeywordTokens(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((item, index, source) => item && source.indexOf(item) === index)
    .slice(0, 8)
}

function countOccurrences(text, token) {
  if (!text || !token) {
    return 0
  }

  let count = 0
  let start = 0
  while (start < text.length) {
    const index = text.indexOf(token, start)
    if (index < 0) {
      break
    }

    count += 1
    start = index + token.length
  }

  return count
}

function scoreTextByTokens(text, tokens = [], weight = 1) {
  const normalized = String(text || '').toLowerCase()
  if (!normalized || !tokens.length) {
    return 0
  }

  return tokens.reduce((score, token) => {
    const occurrences = countOccurrences(normalized, token)
    if (!occurrences) {
      return score
    }

    let nextScore = score + occurrences * weight
    if (normalized.startsWith(token)) {
      nextScore += weight
    }

    if (normalized === token) {
      nextScore += weight * 2
    }

    return nextScore
  }, 0)
}

function hasTokenMatch(text, tokens = []) {
  const normalized = String(text || '').toLowerCase()
  if (!tokens.length) {
    return true
  }

  return tokens.some((token) => normalized.includes(token))
}

const AUTOMATION_CONDITION_TYPES = ['due_within_days', 'checklist_completed', 'label_includes', 'assignee_includes']
const AUTOMATION_ACTION_TYPES = ['append_activity', 'move_to_done_list', 'add_comment']

function createDefaultLabels() {
  return [
    { id: 'label-feature', name: localizedText('labelFeature'), color: '#2f86eb' },
    { id: 'label-bug', name: localizedText('labelBug'), color: '#ff6b6b' },
    { id: 'label-blocked', name: localizedText('labelBlocked'), color: '#ffb020' }
  ]
}

function normalizeAttachment(attachment = {}) {
  return {
    id: attachment.id || createId('attachment'),
    name: attachment.name || localizedText('attachment'),
    url: attachment.url || '',
    type: attachment.type || '',
    size: Number.isFinite(Number(attachment.size)) ? Number(attachment.size) : 0,
    createdAt: attachment.createdAt || new Date().toISOString()
  }
}

function normalizeChecklistItem(item = {}) {
  return {
    id: item.id || createId('check'),
    text: String(item.text || localizedText('checklistUntitled')).trim() || localizedText('checklistUntitled'),
    done: Boolean(item.done),
    createdAt: item.createdAt || new Date().toISOString()
  }
}

function normalizeComment(comment = {}) {
  return {
    id: comment.id || createId('comment'),
    author: String(comment.author || localizedText('commentUntitledAuthor')).trim() || localizedText('commentUntitledAuthor'),
    content: String(comment.content || '').trim(),
    createdAt: comment.createdAt || new Date().toISOString()
  }
}

function normalizeActivity(activity = {}) {
  return {
    id: activity.id || createId('activity'),
    type: String(activity.type || 'update').trim() || 'update',
    message: String(activity.message || localizedText('activityCardUpdated')).trim() || localizedText('activityCardUpdated'),
    meta: activity.meta && typeof activity.meta === 'object' ? { ...activity.meta } : {},
    createdAt: activity.createdAt || new Date().toISOString()
  }
}

function normalizeKeywordList(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback
  return source
    .map((item) => String(item || '').trim().toLowerCase())
    .filter((item, index, list) => item && list.indexOf(item) === index)
}

function createDefaultAutomationRules() {
  return [
    {
      id: 'rule-due-reminder',
      name: localizedText('ruleDueReminderName'),
      enabled: true,
      condition: {
        type: 'due_within_days',
        days: 1
      },
      action: {
        type: 'append_activity',
        message: localizedText('activityDueReminder')
      }
    },
    {
      id: 'rule-checklist-move-done',
      name: localizedText('ruleChecklistMoveName'),
      enabled: true,
      condition: {
        type: 'checklist_completed'
      },
      action: {
        type: 'move_to_done_list',
        doneListKeywords: ['done', '已完成']
      }
    }
  ]
}

function normalizeAutomationCondition(condition = {}, fallback = {}) {
  const fallbackType = AUTOMATION_CONDITION_TYPES.includes(fallback?.type)
    ? fallback.type
    : 'due_within_days'
  const conditionType = AUTOMATION_CONDITION_TYPES.includes(condition?.type)
    ? condition.type
    : fallbackType

  if (conditionType === 'due_within_days') {
    const fallbackDays = Number.isFinite(Number(fallback?.days)) ? Number(fallback.days) : 1
    const sourceDays = Number.isFinite(Number(condition?.days)) ? Number(condition.days) : fallbackDays

    return {
      type: conditionType,
      days: Math.max(0, Math.min(30, Math.floor(sourceDays)))
    }
  }

  if (conditionType === 'label_includes') {
    return {
      type: conditionType,
      labelId: String(condition?.labelId || fallback?.labelId || '').trim()
    }
  }

  if (conditionType === 'assignee_includes') {
    return {
      type: conditionType,
      assignee: String(condition?.assignee || fallback?.assignee || '').trim()
    }
  }

  return {
    type: 'checklist_completed'
  }
}

function normalizeAutomationAction(action = {}, fallback = {}) {
  const fallbackType = AUTOMATION_ACTION_TYPES.includes(fallback?.type)
    ? fallback.type
    : 'append_activity'
  const actionType = AUTOMATION_ACTION_TYPES.includes(action?.type)
    ? action.type
    : fallbackType

  if (actionType === 'move_to_done_list') {
    const fallbackKeywords = normalizeKeywordList(fallback?.doneListKeywords, ['done', '已完成'])
    const doneListKeywords = normalizeKeywordList(action?.doneListKeywords, fallbackKeywords)

    return {
      type: actionType,
      doneListKeywords: doneListKeywords.length ? doneListKeywords : ['done', '已完成']
    }
  }

  if (actionType === 'add_comment') {
    const comment = String(action?.comment || fallback?.comment || '').trim()
    return {
      type: actionType,
      comment
    }
  }

  return {
    type: 'append_activity',
    message: String(action?.message || fallback?.message || localizedText('activityRuleTriggered')).trim()
      || localizedText('activityRuleTriggered')
  }
}

function normalizeAutomationRule(rule = {}, fallback = {}, index = 0) {
  return {
    id: String(rule.id || fallback.id || createId('rule')).trim() || createId('rule'),
    name: String(rule.name || fallback.name || `Rule ${index + 1}`).trim() || `Rule ${index + 1}`,
    enabled: typeof rule.enabled === 'boolean'
      ? rule.enabled
      : (typeof fallback.enabled === 'boolean' ? fallback.enabled : true),
    condition: normalizeAutomationCondition(rule.condition, fallback.condition),
    action: normalizeAutomationAction(rule.action, fallback.action)
  }
}

function normalizeLegacyAutomationRules(value = {}) {
  const defaults = createDefaultAutomationRules()
  const dueRule = {
    ...defaults[0],
    enabled: typeof value.dueReminderEnabled === 'boolean'
      ? value.dueReminderEnabled
      : defaults[0].enabled,
    condition: {
      ...defaults[0].condition,
      days: Number.isFinite(Number(value.dueReminderDays))
        ? Math.max(0, Math.min(30, Math.floor(Number(value.dueReminderDays))))
        : defaults[0].condition.days
    }
  }

  const legacyDoneKeywords = normalizeKeywordList(value.doneListKeywords, defaults[1].action.doneListKeywords)
  const moveDoneRule = {
    ...defaults[1],
    enabled: typeof value.autoMoveDoneEnabled === 'boolean'
      ? value.autoMoveDoneEnabled
      : defaults[1].enabled,
    action: {
      ...defaults[1].action,
      doneListKeywords: legacyDoneKeywords.length
        ? legacyDoneKeywords
        : defaults[1].action.doneListKeywords
    }
  }

  return [dueRule, moveDoneRule]
}

function createDefaultAutomationConfig() {
  return {
    rules: createDefaultAutomationRules()
  }
}

function normalizeAutomationConfig(value = {}) {
  const defaults = createDefaultAutomationRules()
  const sourceRules = Array.isArray(value.rules) && value.rules.length
    ? value.rules
    : normalizeLegacyAutomationRules(value)
  const normalizedRules = sourceRules
    .map((rule, index) => normalizeAutomationRule(rule, defaults[index % defaults.length], index))
    .filter((rule, index, source) => rule.id && source.findIndex((item) => item.id === rule.id) === index)

  return {
    rules: normalizedRules.length
      ? normalizedRules
      : defaults.map((rule, index) => normalizeAutomationRule(rule, rule, index))
  }
}

function createDefaultIntegrationsConfig() {
  return {
    slack: {
      connected: false,
      channel: ''
    },
    googleDrive: {
      connected: false,
      folder: ''
    },
    github: {
      connected: false,
      repository: ''
    },
    webhook: {
      enabled: false,
      url: ''
    }
  }
}

function normalizeIntegrationsConfig(value = {}) {
  const fallback = createDefaultIntegrationsConfig()
  return {
    slack: {
      connected: Boolean(value?.slack?.connected),
      channel: String(value?.slack?.channel || '').trim()
    },
    googleDrive: {
      connected: Boolean(value?.googleDrive?.connected),
      folder: String(value?.googleDrive?.folder || '').trim()
    },
    github: {
      connected: Boolean(value?.github?.connected),
      repository: String(value?.github?.repository || '').trim()
    },
    webhook: {
      enabled: Boolean(value?.webhook?.enabled),
      url: String(value?.webhook?.url || '').trim()
    }
  }
}

function normalizeCardAutomationMeta(value = {}) {
  const reminderHistory = Array.isArray(value?.dueReminderHistory)
    ? value.dueReminderHistory
      .map((item) => String(item || '').trim())
      .filter((item, index, source) => item && source.indexOf(item) === index)
      .slice(0, 60)
    : []

  const ruleHistory = Array.isArray(value?.ruleHistory)
    ? value.ruleHistory
      .map((item) => String(item || '').trim())
      .filter((item, index, source) => item && source.indexOf(item) === index)
      .slice(0, 160)
    : []

  return {
    dueReminderHistory: reminderHistory,
    ruleHistory
  }
}

function appendCardActivity(card, payload = {}) {
  if (!card || typeof card !== 'object') {
    return
  }

  const nextActivity = normalizeActivity(payload)
  const current = Array.isArray(card.activity) ? card.activity : []
  card.activity = [nextActivity, ...current].slice(0, 120)
}

function appendBoardActivity(board, payload = {}) {
  if (!board || typeof board !== 'object') {
    return
  }

  const nextActivity = normalizeActivity(payload)
  const current = Array.isArray(board.activity) ? board.activity : []
  board.activity = [nextActivity, ...current].slice(0, 240)
}

function normalizeAssignees(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => String(item || '').trim())
    .filter((item, index, source) => item && source.indexOf(item) === index)
}

function normalizeCard(card = {}) {
  const createdAt = card.createdAt || nowIsoString()

  return {
    id: card.id || createId('card'),
    title: String(card.title || localizedText('untitledTask')).trim() || localizedText('untitledTask'),
    description: card.description || '',
    archived: Boolean(card.archived),
    archivedAt: typeof card.archivedAt === 'string' ? card.archivedAt : '',
    dueDate: card.dueDate || '',
    labelIds: Array.isArray(card.labelIds) ? [...new Set(card.labelIds)] : [],
    assignees: normalizeAssignees(card.assignees),
    checklist: Array.isArray(card.checklist) ? card.checklist.map((item) => normalizeChecklistItem(item)) : [],
    comments: Array.isArray(card.comments)
      ? card.comments.map((item) => normalizeComment(item)).filter((item) => item.content)
      : [],
    activity: Array.isArray(card.activity) ? card.activity.map((item) => normalizeActivity(item)) : [],
    automationMeta: normalizeCardAutomationMeta(card.automationMeta),
    attachments: Array.isArray(card.attachments)
      ? card.attachments.map((item) => normalizeAttachment(item))
      : [],
    createdAt,
    updatedAt: card.updatedAt || createdAt
  }
}

function normalizeArchivedCardEntry(entry = {}) {
  const rawCard = entry.card && typeof entry.card === 'object' ? entry.card : entry
  const normalizedCard = normalizeCard(rawCard)
  const archivedAt = typeof entry.archivedAt === 'string'
    ? entry.archivedAt
    : (typeof rawCard.archivedAt === 'string' ? rawCard.archivedAt : nowIsoString())

  return {
    id: entry.id || normalizedCard.id,
    card: normalizedCard,
    fromListId: String(entry.fromListId || entry.listId || rawCard.fromListId || '').trim(),
    fromListTitle: String(entry.fromListTitle || entry.listTitle || rawCard.fromListTitle || '').trim(),
    archivedAt
  }
}

function normalizeList(list = {}) {
  return {
    id: list.id || createId('list'),
    title: String(list.title || localizedText('untitledList')).trim() || localizedText('untitledList'),
    archived: Boolean(list.archived),
    cards: Array.isArray(list.cards) ? list.cards.map((card) => normalizeCard(card)) : []
  }
}

function normalizeBoardVisibility(value) {
  return BOARD_VISIBILITY_VALUES.includes(value) ? value : 'workspace'
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeWorkspaceKey(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized || DEFAULT_WORKSPACE_KEY
}

function normalizeViewerContext(viewer = {}) {
  return {
    email: normalizeEmail(viewer.email),
    workspaceKey: normalizeWorkspaceKey(viewer.workspaceKey)
  }
}

function canViewerAccessBoard(board, viewer = {}) {
  const accessViewer = normalizeViewerContext(viewer)

  if (!board || typeof board !== 'object') {
    return false
  }

  if (board.visibility === 'public') {
    return true
  }

  if (board.visibility === 'private') {
    if (!board.ownerEmail || !accessViewer.email) {
      return false
    }

    return board.ownerEmail === accessViewer.email
  }

  if (board.workspaceKey === DEFAULT_WORKSPACE_KEY) {
    return true
  }

  return board.workspaceKey === accessViewer.workspaceKey
}

function normalizeBoard(board = {}) {
  const createdAt = board.createdAt || nowIsoString()

  return {
    id: board.id || createId('board'),
    title: String(board.title || localizedText('untitledBoard')).trim() || localizedText('untitledBoard'),
    description: board.description || '',
    background: normalizeBoardBackground(board.background),
    visibility: normalizeBoardVisibility(board.visibility),
    ownerEmail: normalizeEmail(board.ownerEmail),
    workspaceKey: normalizeWorkspaceKey(board.workspaceKey),
    members: Array.isArray(board.members) ? board.members : [localizedText('demoUser')],
    labels: Array.isArray(board.labels) && board.labels.length
      ? board.labels.map((label) => ({
          id: label.id || createId('label'),
          name: String(label.name || localizedText('labelName')).trim() || localizedText('labelName'),
          color: label.color || '#2f86eb'
        }))
      : createDefaultLabels().map((label) => ({ ...label })),
    automation: normalizeAutomationConfig(board.automation),
    integrations: normalizeIntegrationsConfig(board.integrations),
    lists: Array.isArray(board.lists) ? board.lists.map((list) => normalizeList(list)) : [],
    archivedLists: Array.isArray(board.archivedLists) ? board.archivedLists.map((list) => normalizeList(list)) : [],
    archivedCards: Array.isArray(board.archivedCards) ? board.archivedCards.map((item) => normalizeArchivedCardEntry(item)) : [],
    activity: Array.isArray(board.activity) ? board.activity.map((item) => normalizeActivity(item)) : [],
    createdAt,
    updatedAt: board.updatedAt || createdAt
  }
}

function createTemplateLists() {
  return [
    {
      title: localizedText('todo'),
      cards: []
    },
    {
      title: localizedText('doing'),
      cards: []
    },
    {
      title: localizedText('done'),
      cards: []
    }
  ]
}

function createDefaultBoard() {
  return normalizeBoard({
    title: localizedText('boardTitle'),
    description: localizedText('boardDescription'),
    visibility: 'workspace',
    ownerEmail: '',
    workspaceKey: DEFAULT_WORKSPACE_KEY,
    members: [localizedText('demoUser'), localizedText('designPartner')],
    labels: createDefaultLabels(),
    lists: [
      {
        title: localizedText('todo'),
        cards: [
          {
            title: localizedText('card1Title'),
            description: localizedText('card1Desc'),
            labelIds: ['label-feature']
          },
          {
            title: localizedText('card2Title'),
            description: localizedText('card2Desc'),
            labelIds: ['label-bug'],
            dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10)
          }
        ]
      },
      {
        title: localizedText('doing'),
        cards: [
          {
            title: localizedText('card3Title'),
            description: localizedText('card3Desc'),
            labelIds: ['label-feature']
          }
        ]
      },
      {
        title: localizedText('done'),
        cards: [
          {
            title: localizedText('card4Title'),
            description: localizedText('card4Desc'),
            labelIds: ['label-feature']
          }
        ]
      }
    ]
  })
}

export const useBoardStore = defineStore('board', () => {
  const userStore = useUserStore()
  const boards = ref([])
  const currentBoardId = ref('')
  const initialized = ref(false)

  const remoteEnabled = computed(() => Boolean(userStore.isAuthenticated && userStore.accessToken))
  const remoteLoading = ref(false)
  const remoteLoadedOnce = ref(false)
  const reorderTimer = ref(null)
  const reorderPendingBoardId = ref('')

  const currentBoard = computed(() => boards.value.find((board) => board.id === currentBoardId.value) || null)

  async function ensureWorkspaceId() {
    const existing = String(userStore.currentWorkspaceId || '').trim()
    if (existing) return existing
    try {
      await userStore.loadWorkspaces()
    } catch {
      // ignore
    }
    return String(userStore.currentWorkspaceId || '').trim()
  }

  function pickLocalBoardMeta(boardId) {
    const local = boards.value.find((b) => b.id === boardId) || null
    return local && typeof local === 'object' ? local : null
  }

  function mergeCardMeta(serverCard, localCard) {
    if (!serverCard || typeof serverCard !== 'object') return serverCard
    if (!localCard || typeof localCard !== 'object') return serverCard

    return {
      ...serverCard,
      labelIds: Array.isArray(localCard.labelIds) ? localCard.labelIds : serverCard.labelIds,
      assignees: Array.isArray(localCard.assignees) ? localCard.assignees : serverCard.assignees,
      checklist: Array.isArray(localCard.checklist) ? localCard.checklist : serverCard.checklist,
      comments: Array.isArray(localCard.comments) ? localCard.comments : serverCard.comments,
      activity: Array.isArray(localCard.activity) ? localCard.activity : serverCard.activity,
      automationMeta: localCard.automationMeta && typeof localCard.automationMeta === 'object'
        ? localCard.automationMeta
        : serverCard.automationMeta
    }
  }

  function mergeBoardMeta(serverBoard) {
    const localBoard = pickLocalBoardMeta(serverBoard?.id)
    if (!localBoard) return serverBoard

    const mergeLists = (serverLists, localLists) => {
      if (!Array.isArray(serverLists)) return serverLists
      const localMap = new Map(
        Array.isArray(localLists)
          ? localLists.map((l) => [l.id, l])
          : []
      )

      return serverLists.map((list) => {
        const localList = localMap.get(list.id)
        const localCardMap = new Map(
          Array.isArray(localList?.cards)
            ? localList.cards.map((c) => [c.id, c])
            : []
        )

        return {
          ...list,
          cards: Array.isArray(list.cards)
            ? list.cards.map((c) => mergeCardMeta(c, localCardMap.get(c.id)))
            : list.cards
        }
      })
    }

    return {
      ...serverBoard,
      ownerEmail: typeof localBoard.ownerEmail === 'string' ? localBoard.ownerEmail : serverBoard.ownerEmail,
      members: Array.isArray(localBoard.members) ? localBoard.members : serverBoard.members,
      labels: Array.isArray(localBoard.labels) ? localBoard.labels : serverBoard.labels,
      automation: localBoard.automation && typeof localBoard.automation === 'object' ? localBoard.automation : serverBoard.automation,
      integrations: localBoard.integrations && typeof localBoard.integrations === 'object' ? localBoard.integrations : serverBoard.integrations,
      activity: Array.isArray(localBoard.activity) ? localBoard.activity : serverBoard.activity,
      lists: mergeLists(serverBoard.lists, localBoard.lists),
      archivedLists: mergeLists(serverBoard.archivedLists, localBoard.archivedLists),
      archivedCards: Array.isArray(serverBoard.archivedCards)
        ? serverBoard.archivedCards.map((entry) => {
            const localEntry = Array.isArray(localBoard.archivedCards)
              ? localBoard.archivedCards.find((e) => e?.id === entry?.id)
              : null
            const localCard = localEntry?.card
            return {
              ...entry,
              card: mergeCardMeta(entry.card, localCard)
            }
          })
        : serverBoard.archivedCards
    }
  }

  async function loadRemoteBoards() {
    if (!remoteEnabled.value) return false
    if (remoteLoading.value) return false

    const workspaceId = await ensureWorkspaceId()
    if (!workspaceId) return false

    remoteLoading.value = true
    try {
      const data = await http.authedJson(`/api/workspaces/${workspaceId}/boards`)
      const items = Array.isArray(data?.items) ? data.items : []

      // Bootstrap: keep UX consistent with the local prototype (at least 1 board).
      if (!items.length) {
        const boardId = createId('board')
        const payload = {
          id: boardId,
          title: localizedText('boardTitle'),
          description: localizedText('boardDescription'),
          visibility: 'workspace',
          lists: [
            { id: createId('list'), title: localizedText('todo'), position: 0 },
            { id: createId('list'), title: localizedText('doing'), position: 1 },
            { id: createId('list'), title: localizedText('done'), position: 2 }
          ]
        }
        await http.authedJson(`/api/workspaces/${workspaceId}/boards`, { method: 'POST', body: payload })
        const again = await http.authedJson(`/api/workspaces/${workspaceId}/boards`)
        const nextItems = Array.isArray(again?.items) ? again.items : []
        boards.value = nextItems.map((b) => normalizeBoard(mergeBoardMeta(b)))
      } else {
        boards.value = items.map((b) => normalizeBoard(mergeBoardMeta(b)))
      }

      const savedBoardId = loadString(CURRENT_BOARD_KEY, '')
      const hasSavedBoard = boards.value.some((board) => board.id === savedBoardId)
      currentBoardId.value = hasSavedBoard ? savedBoardId : boards.value[0]?.id || ''
      persist()
      remoteLoadedOnce.value = true
      return true
    } catch {
      return false
    } finally {
      remoteLoading.value = false
    }
  }

  function scheduleRemoteReorder(boardId = currentBoardId.value) {
    if (!remoteEnabled.value) return
    const id = String(boardId || '').trim()
    if (!id) return

    reorderPendingBoardId.value = id
    if (reorderTimer.value) {
      clearTimeout(reorderTimer.value)
    }

    reorderTimer.value = setTimeout(() => {
      const targetBoard = findBoard(reorderPendingBoardId.value)
      if (!targetBoard) return

      const lists = Array.isArray(targetBoard.lists)
        ? targetBoard.lists.map((l, idx) => ({ id: l.id, position: idx }))
        : []

      const cards = []
      ;(targetBoard.lists || []).forEach((l) => {
        ;(l.cards || []).forEach((c, idx) => {
          cards.push({ id: c.id, listId: l.id, position: idx })
        })
      })

      http
        .authedJson(`/api/boards/${targetBoard.id}/reorder`, {
          method: 'POST',
          body: { lists, cards }
        })
        .catch(() => {})
    }, 250)
  }

  function persist() {
    saveToStorage(BOARDS_KEY, boards.value)
    saveString(CURRENT_BOARD_KEY, currentBoardId.value || '')
  }

  function touch() {
    const board = findBoard(currentBoardId.value)
    if (board) {
      touchBoard(board)
    }

    persist()
    scheduleRemoteReorder(currentBoardId.value)
  }

  function init() {
    if (initialized.value) {
      return
    }

    const rawBoards = loadFromStorage(BOARDS_KEY, [])
    boards.value = Array.isArray(rawBoards) && rawBoards.length
      ? rawBoards.map((item) => normalizeBoard(item))
      : [createDefaultBoard()]

    const savedBoardId = loadString(CURRENT_BOARD_KEY, '')
    const hasSavedBoard = boards.value.some((board) => board.id === savedBoardId)
    currentBoardId.value = hasSavedBoard ? savedBoardId : boards.value[0]?.id || ''

    persist()
    initialized.value = true

    // If authenticated, switch to server-backed boards.
    if (remoteEnabled.value) {
      loadRemoteBoards().catch(() => {})
    }
  }

  watch(
    remoteEnabled,
    (enabled) => {
      if (enabled) {
        loadRemoteBoards().catch(() => {})
      } else if (remoteLoadedOnce.value) {
        // Fallback to local cached boards when logging out.
        const rawBoards = loadFromStorage(BOARDS_KEY, [])
        boards.value = Array.isArray(rawBoards) && rawBoards.length
          ? rawBoards.map((item) => normalizeBoard(item))
          : [createDefaultBoard()]
        const savedBoardId = loadString(CURRENT_BOARD_KEY, '')
        const hasSavedBoard = boards.value.some((board) => board.id === savedBoardId)
        currentBoardId.value = hasSavedBoard ? savedBoardId : boards.value[0]?.id || ''
        persist()
      }
    },
    { immediate: false }
  )

  function setCurrentBoard(boardId) {
    if (!boards.value.some((board) => board.id === boardId)) {
      return
    }

    currentBoardId.value = boardId
    persist()
  }

  function findBoard(boardId = currentBoardId.value) {
    return boards.value.find((board) => board.id === boardId) || null
  }

  function canAccessBoard(boardInput, viewer = {}) {
    const board = typeof boardInput === 'string' ? findBoard(boardInput) : boardInput
    return canViewerAccessBoard(board, viewer)
  }

  function getVisibleBoards(viewer = {}) {
    return boards.value.filter((board) => canViewerAccessBoard(board, viewer))
  }

  function findList(boardId, listId) {
    const board = findBoard(boardId)
    if (!board) {
      return null
    }

    const list = board.lists.find((item) => item.id === listId)
    return list ? { board, list } : null
  }

  function findCard(boardId, listId, cardId) {
    const listResult = findList(boardId, listId)
    if (!listResult) {
      return null
    }

    const card = listResult.list.cards.find((item) => item.id === cardId)
    return card ? { board: listResult.board, list: listResult.list, card } : null
  }

  function parseDateStart(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return null
    }

    date.setHours(0, 0, 0, 0)
    return date
  }

  function touchBoard(board, timestamp = nowIsoString()) {
    if (!board || typeof board !== 'object') {
      return
    }

    board.updatedAt = timestamp
  }

  function touchCard(card, timestamp = nowIsoString()) {
    if (!card || typeof card !== 'object') {
      return
    }

    card.updatedAt = timestamp
  }

  function touchCardAndBoard(board, card) {
    const timestamp = nowIsoString()
    touchCard(card, timestamp)
    touchBoard(board, timestamp)
    return timestamp
  }

  function readCardRuleHistory(card) {
    return Array.isArray(card?.automationMeta?.ruleHistory)
      ? card.automationMeta.ruleHistory
      : []
  }

  function appendCardRuleHistory(card, historyKey) {
    const normalizedHistoryKey = String(historyKey || '').trim()
    if (!card || !normalizedHistoryKey) {
      return
    }

    const currentMeta = normalizeCardAutomationMeta(card.automationMeta)
    card.automationMeta = normalizeCardAutomationMeta({
      ...currentMeta,
      ruleHistory: [normalizedHistoryKey, ...currentMeta.ruleHistory]
    })
  }

  function appendDueReminderHistory(card, reminderKey) {
    const normalizedReminderKey = String(reminderKey || '').trim()
    if (!card || !normalizedReminderKey) {
      return
    }

    const currentMeta = normalizeCardAutomationMeta(card.automationMeta)
    card.automationMeta = normalizeCardAutomationMeta({
      ...currentMeta,
      dueReminderHistory: [normalizedReminderKey, ...currentMeta.dueReminderHistory],
      ruleHistory: currentMeta.ruleHistory
    })
  }

  function isChecklistCompleted(card) {
    if (!Array.isArray(card?.checklist) || !card.checklist.length) {
      return false
    }

    return card.checklist.every((item) => item.done)
  }

  function findDoneList(board, keywordCandidates = []) {
    if (!board || !Array.isArray(board.lists) || !board.lists.length) {
      return null
    }

    const keywordPool = normalizeKeywordList(
      [...keywordCandidates, 'done', '已完成', localizedText('done').toLowerCase()],
      ['done', '已完成']
    )

    return board.lists.find((list) => {
      const listTitle = String(list.title || '').trim().toLowerCase()
      return keywordPool.some((keyword) => listTitle.includes(keyword))
    }) || null
  }

  function evaluateAutomationCondition(rule, card) {
    const condition = rule?.condition || {}
    const conditionType = condition.type

    if (conditionType === 'due_within_days') {
      const dueDate = parseDateStart(card?.dueDate)
      const today = parseDateStart(new Date())
      if (!dueDate || !today) {
        return { matched: false }
      }

      const days = Number.isFinite(Number(condition.days))
        ? Math.max(0, Math.min(30, Math.floor(Number(condition.days))))
        : 1
      const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000)
      if (diffDays > days) {
        return { matched: false }
      }

      return {
        matched: true,
        historyKey: `rule::${rule.id}::due::${card.dueDate}::${days}`,
        dueReminderKey: `${card.dueDate}::${rule.id}::${days}`,
        meta: {
          dueDate: card.dueDate,
          thresholdDays: days,
          diffDays
        }
      }
    }

    if (conditionType === 'checklist_completed') {
      if (!isChecklistCompleted(card)) {
        return { matched: false }
      }

      const checklistTotal = Array.isArray(card?.checklist) ? card.checklist.length : 0
      const checklistDone = Array.isArray(card?.checklist)
        ? card.checklist.filter((item) => item.done).length
        : 0

      return {
        matched: true,
        historyKey: `rule::${rule.id}::checklist::${checklistDone}::${checklistTotal}`,
        meta: {
          checklistDone,
          checklistTotal
        }
      }
    }

    if (conditionType === 'label_includes') {
      const labelId = String(condition.labelId || '').trim()
      if (!labelId || !Array.isArray(card?.labelIds) || !card.labelIds.includes(labelId)) {
        return { matched: false }
      }

      const labelSnapshot = [...card.labelIds]
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .sort()
        .join('|')

      return {
        matched: true,
        historyKey: `rule::${rule.id}::label::${labelId}::${labelSnapshot}`,
        meta: {
          labelId
        }
      }
    }

    if (conditionType === 'assignee_includes') {
      const assignee = String(condition.assignee || '').trim()
      if (!assignee || !Array.isArray(card?.assignees) || !card.assignees.includes(assignee)) {
        return { matched: false }
      }

      const assigneeSnapshot = [...card.assignees]
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean)
        .sort()
        .join('|')

      return {
        matched: true,
        historyKey: `rule::${rule.id}::assignee::${assignee.toLowerCase()}::${assigneeSnapshot}`,
        meta: {
          assignee
        }
      }
    }

    return {
      matched: false
    }
  }

  function runAutomationAction(rule, board, sourceList, card, conditionResult = {}) {
    const action = rule?.action || {}

    if (action.type === 'move_to_done_list') {
      const doneList = findDoneList(board, action.doneListKeywords)
      if (!doneList || !sourceList || doneList.id === sourceList.id) {
        return {
          changed: false,
          nextList: sourceList
        }
      }

      const sourceIndex = sourceList.cards.findIndex((item) => item.id === card.id)
      if (sourceIndex < 0) {
        return {
          changed: false,
          nextList: sourceList
        }
      }

      sourceList.cards.splice(sourceIndex, 1)
      doneList.cards.unshift(card)
      appendCardActivity(card, {
        type: 'automation_move_done',
        message: localizedText('activityAutoMoved'),
        meta: {
          ruleId: rule.id,
          fromListId: sourceList.id,
          toListId: doneList.id,
          ...conditionResult.meta
        }
      })

      return {
        changed: true,
        nextList: doneList
      }
    }

    if (action.type === 'add_comment') {
      const comment = String(action.comment || '').trim()
        || localizedTextWithParams('automationCommentTemplate', { ruleName: rule.name })

      if (!comment) {
        return {
          changed: false,
          nextList: sourceList
        }
      }

      card.comments.push(normalizeComment({
        id: createId('comment'),
        author: localizedText('automationBot'),
        content: comment,
        createdAt: nowIsoString()
      }))
      appendCardActivity(card, {
        type: 'automation_add_comment',
        message: localizedText('activityRuleTriggered'),
        meta: {
          ruleId: rule.id,
          comment,
          ...conditionResult.meta
        }
      })

      return {
        changed: true,
        nextList: sourceList
      }
    }

    const message = String(action.message || '').trim() || localizedText('activityRuleTriggered')
    appendCardActivity(card, {
      type: 'automation_append_activity',
      message,
      meta: {
        ruleId: rule.id,
        ...conditionResult.meta
      }
    })

    return {
      changed: true,
      nextList: sourceList
    }
  }

  function runAutomationForCard(board, sourceList, card, options = {}) {
    if (!board || !sourceList || !card) {
      return false
    }

    const automation = normalizeAutomationConfig(board.automation)
    const ruleIdSet = Array.isArray(options?.ruleIds) && options.ruleIds.length
      ? new Set(options.ruleIds.map((item) => String(item || '').trim()).filter(Boolean))
      : null
    const activeRules = Array.isArray(automation.rules)
      ? automation.rules.filter((rule) => {
          if (ruleIdSet) {
            return ruleIdSet.has(String(rule.id || '').trim())
          }

          return rule.enabled
        })
      : []

    if (!activeRules.length) {
      return false
    }

    let changed = false

    let currentList = sourceList
    activeRules.forEach((rule) => {
      const conditionResult = evaluateAutomationCondition(rule, card)
      if (!conditionResult.matched) {
        return
      }

      if (conditionResult.historyKey && readCardRuleHistory(card).includes(conditionResult.historyKey)) {
        return
      }

      const actionResult = runAutomationAction(rule, board, currentList, card, conditionResult)
      if (!actionResult.changed) {
        return
      }

      if (conditionResult.historyKey) {
        appendCardRuleHistory(card, conditionResult.historyKey)
      }

      if (conditionResult.dueReminderKey) {
        appendDueReminderHistory(card, conditionResult.dueReminderKey)
      }

      changed = true
      currentList = actionResult.nextList || currentList
    })

    if (changed) {
      touchCardAndBoard(board, card)
    }

    return changed
  }

  function createBoard(payload = {}) {
    const hasTemplateLists = Array.isArray(payload.templateLists)
    const nextBoard = normalizeBoard({
      title: payload.title || localizedText('untitledBoard'),
      description: payload.description || '',
      background: payload.background,
      visibility: payload.visibility,
      ownerEmail: payload.ownerEmail,
      workspaceKey: payload.workspaceKey,
      members: [localizedText('demoUser')],
      labels: createDefaultLabels(),
      lists: hasTemplateLists ? payload.templateLists : (payload.fromTemplate ? createTemplateLists() : [])
    })

    boards.value.unshift(nextBoard)
    currentBoardId.value = nextBoard.id
    persist()

    if (remoteEnabled.value) {
      const send = (workspaceId) => {
        const wid = String(workspaceId || '').trim()
        if (!wid) return

        const listsPayload = Array.isArray(nextBoard.lists)
          ? nextBoard.lists.map((l, idx) => ({
              id: l.id,
              title: l.title,
              position: idx,
              cards: Array.isArray(l.cards)
                ? l.cards.map((c, cIdx) => ({
                    id: c.id,
                    title: c.title,
                    description: c.description || '',
                    position: cIdx,
                    dueDate: c.dueDate || ''
                  }))
                : []
            }))
          : []

        http
          .authedJson(`/api/workspaces/${wid}/boards`, {
            method: 'POST',
            body: {
              id: nextBoard.id,
              title: nextBoard.title,
              description: nextBoard.description || '',
              visibility: nextBoard.visibility,
              background: nextBoard.background,
              lists: listsPayload
            }
          })
          .then(() => loadRemoteBoards())
          .catch(() => {})
      }

      const existingWorkspaceId = String(userStore.currentWorkspaceId || '').trim()
      if (existingWorkspaceId) {
        send(existingWorkspaceId)
      } else {
        userStore
          .loadWorkspaces()
          .then(() => send(String(userStore.currentWorkspaceId || '').trim()))
          .catch(() => {})
      }
    }

    return nextBoard
  }

  function updateBoard(boardId, payload = {}) {
    const board = findBoard(boardId)
    if (!board) {
      return
    }

    let changed = false

    if (typeof payload.title === 'string') {
      const nextTitle = payload.title.trim() || board.title
      if (nextTitle !== board.title) {
        board.title = nextTitle
        changed = true
      }
    }

    if (typeof payload.description === 'string') {
      if (payload.description !== board.description) {
        board.description = payload.description
        changed = true
      }
    }

    if (typeof payload.visibility === 'string') {
      const nextVisibility = normalizeBoardVisibility(payload.visibility)
      if (nextVisibility !== board.visibility) {
        board.visibility = nextVisibility
        changed = true
      }
    }

    if (payload.background && typeof payload.background === 'object') {
      board.background = normalizeBoardBackground(payload.background)
      changed = true
    }

    if (Array.isArray(payload.members)) {
      board.members = payload.members
      changed = true
    }

    if (payload.automation && typeof payload.automation === 'object') {
      board.automation = normalizeAutomationConfig({
        ...board.automation,
        ...payload.automation
      })
      changed = true
    }

    if (payload.integrations && typeof payload.integrations === 'object') {
      board.integrations = normalizeIntegrationsConfig({
        ...board.integrations,
        ...payload.integrations
      })
      changed = true
    }

    if (changed) {
      appendBoardActivity(board, {
        type: 'board_updated',
        message: localizedText('activityBoardUpdated')
      })
      touchBoard(board)
    }

    persist()

    if (remoteEnabled.value) {
      const body = {}
      if (typeof payload.title === 'string') body.title = board.title
      if (typeof payload.description === 'string') body.description = board.description
      if (typeof payload.visibility === 'string') body.visibility = board.visibility
      if (payload.background && typeof payload.background === 'object') body.background = board.background

      if (Object.keys(body).length) {
        http.authedJson(`/api/boards/${boardId}`, { method: 'PATCH', body }).catch(() => {})
      }
    }
  }

  function deleteBoard(boardId) {
    boards.value = boards.value.filter((board) => board.id !== boardId)

    if (!boards.value.length) {
      boards.value = [createDefaultBoard()]
    }

    if (!boards.value.some((board) => board.id === currentBoardId.value)) {
      currentBoardId.value = boards.value[0]?.id || ''
    }

    persist()

    if (remoteEnabled.value) {
      http
        .authedJson(`/api/boards/${boardId}`, { method: 'DELETE' })
        .then(() => loadRemoteBoards())
        .catch(() => {})
    }
  }

  function addList(boardId, title) {
    const board = findBoard(boardId)
    if (!board) {
      return null
    }

    const nextList = normalizeList({
      title: title || localizedText('newList'),
      cards: []
    })

    board.lists.push(nextList)
    appendBoardActivity(board, {
      type: 'list_added',
      message: localizedTextWithParams('activityListAdded', { title: nextList.title }),
      meta: {
        listId: nextList.id
      }
    })
    touchBoard(board)
    persist()

    if (remoteEnabled.value) {
      const position = Math.max(0, board.lists.length - 1)
      http
        .authedJson(`/api/boards/${boardId}/lists`, {
          method: 'POST',
          body: { id: nextList.id, title: nextList.title, position }
        })
        .catch(() => {})
    }
    return nextList
  }

  function cloneCardForCopy(card = {}) {
    return {
      title: card.title,
      description: card.description,
      dueDate: card.dueDate,
      labelIds: Array.isArray(card.labelIds) ? [...card.labelIds] : [],
      assignees: Array.isArray(card.assignees) ? [...card.assignees] : [],
      checklist: Array.isArray(card.checklist)
        ? card.checklist.map((item) => ({
            text: item.text,
            done: Boolean(item.done)
          }))
        : [],
      comments: Array.isArray(card.comments)
        ? card.comments.map((item) => ({
            author: item.author,
            content: item.content
          }))
        : [],
      attachments: Array.isArray(card.attachments)
        ? card.attachments.map((item) => ({
            name: item.name,
            url: item.url,
            type: item.type,
            size: item.size
          }))
        : []
    }
  }

  function copyList(boardId, listId) {
    const listResult = findList(boardId, listId)
    if (!listResult) {
      return null
    }

    const sourceIndex = listResult.board.lists.findIndex((item) => item.id === listId)
    if (sourceIndex < 0) {
      return null
    }

    const nextList = normalizeList({
      title: `${listResult.list.title}`,
      cards: listResult.list.cards.map((card) => cloneCardForCopy(card))
    })

    listResult.board.lists.splice(sourceIndex + 1, 0, nextList)
    touchBoard(listResult.board)
    persist()

    if (remoteEnabled.value) {
      const position = Math.max(0, sourceIndex + 1)
      http
        .authedJson(`/api/boards/${boardId}/lists`, {
          method: 'POST',
          body: {
            id: nextList.id,
            title: nextList.title,
            position,
            cards: Array.isArray(nextList.cards)
              ? nextList.cards.map((c, idx) => ({
                  id: c.id,
                  title: c.title,
                  description: c.description || '',
                  position: idx,
                  dueDate: c.dueDate || ''
                }))
              : []
          }
        })
        .catch(() => {})
    }
    return nextList
  }

  function moveList(boardId, listId, targetPosition) {
    const board = findBoard(boardId)
    if (!board) {
      return null
    }

    const sourceIndex = board.lists.findIndex((item) => item.id === listId)
    if (sourceIndex < 0) {
      return null
    }

    const normalizedPosition = Number.isFinite(Number(targetPosition))
      ? Math.floor(Number(targetPosition)) - 1
      : sourceIndex
    const boundedPosition = Math.max(0, Math.min(board.lists.length - 1, normalizedPosition))

    if (boundedPosition === sourceIndex) {
      return board.lists[sourceIndex]
    }

    const [nextList] = board.lists.splice(sourceIndex, 1)
    board.lists.splice(boundedPosition, 0, nextList)
    touchBoard(board)
    persist()
    return nextList
  }

  function archiveList(boardId, listId) {
    const board = findBoard(boardId)
    if (!board) {
      return null
    }

    const sourceIndex = board.lists.findIndex((item) => item.id === listId)
    if (sourceIndex < 0) {
      return null
    }

    const [nextList] = board.lists.splice(sourceIndex, 1)
    nextList.archived = true
    board.archivedLists = Array.isArray(board.archivedLists) ? board.archivedLists : []
    board.archivedLists.unshift(nextList)
    appendBoardActivity(board, {
      type: 'list_archived',
      message: localizedTextWithParams('activityListArchived', { title: nextList.title }),
      meta: {
        listId: nextList.id
      }
    })
    touchBoard(board)
    persist()

    if (remoteEnabled.value) {
      http.authedJson(`/api/lists/${listId}`, { method: 'PATCH', body: { archived: true } }).catch(() => {})
    }
    return nextList
  }

  function restoreArchivedList(boardId, listId, targetPosition) {
    const board = findBoard(boardId)
    if (!board) {
      return null
    }

    board.archivedLists = Array.isArray(board.archivedLists) ? board.archivedLists : []
    const sourceIndex = board.archivedLists.findIndex((item) => item.id === listId)
    if (sourceIndex < 0) {
      return null
    }

    const [nextList] = board.archivedLists.splice(sourceIndex, 1)
    nextList.archived = false

    const normalizedPosition = Number.isFinite(Number(targetPosition))
      ? Math.floor(Number(targetPosition)) - 1
      : board.lists.length
    const boundedPosition = Math.max(0, Math.min(board.lists.length, normalizedPosition))

    board.lists.splice(boundedPosition, 0, nextList)
    appendBoardActivity(board, {
      type: 'list_restored',
      message: localizedTextWithParams('activityListRestored', { title: nextList.title }),
      meta: {
        listId: nextList.id
      }
    })
    touchBoard(board)
    persist()

    if (remoteEnabled.value) {
      http.authedJson(`/api/lists/${listId}`, { method: 'PATCH', body: { archived: false } }).catch(() => {})
    }
    return nextList
  }

  function deleteArchivedList(boardId, listId) {
    const board = findBoard(boardId)
    if (!board) {
      return false
    }

    board.archivedLists = Array.isArray(board.archivedLists) ? board.archivedLists : []
    const sourceIndex = board.archivedLists.findIndex((item) => item.id === listId)
    if (sourceIndex < 0) {
      return false
    }

    const [deletedList] = board.archivedLists.splice(sourceIndex, 1)
    appendBoardActivity(board, {
      type: 'list_deleted',
      message: localizedTextWithParams('activityListDeleted', { title: deletedList.title }),
      meta: {
        listId
      }
    })

    touchBoard(board)
    persist()

    if (remoteEnabled.value) {
      http.authedJson(`/api/lists/${listId}`, { method: 'DELETE' }).catch(() => {})
    }
    return true
  }

  function renameList(boardId, listId, title) {
    const listResult = findList(boardId, listId)
    if (!listResult) {
      return
    }

    listResult.list.title = String(title || '').trim() || listResult.list.title
    touchBoard(listResult.board)
    persist()

    if (remoteEnabled.value) {
      http
        .authedJson(`/api/lists/${listId}`, {
          method: 'PATCH',
          body: { title: listResult.list.title }
        })
        .catch(() => {})
    }
  }

  function deleteList(boardId, listId) {
    const board = findBoard(boardId)
    if (!board) {
      return
    }

    board.lists = board.lists.filter((list) => list.id !== listId)
    touchBoard(board)
    persist()

    if (remoteEnabled.value) {
      http.authedJson(`/api/lists/${listId}`, { method: 'DELETE' }).catch(() => {})
    }
  }

  function addCard(boardId, listId, payload = {}) {
    const listResult = findList(boardId, listId)
    if (!listResult) {
      return null
    }

    const nextCard = normalizeCard({
      title: payload.title || localizedText('untitledTask'),
      description: payload.description || '',
      dueDate: payload.dueDate || '',
      labelIds: payload.labelIds || [],
      assignees: payload.assignees || [],
      checklist: payload.checklist || [],
      comments: payload.comments || [],
      activity: payload.activity || [],
      attachments: payload.attachments || []
    })

    listResult.list.cards.unshift(nextCard)
    appendCardActivity(nextCard, {
      type: 'card_created',
      message: localizedTextWithParams('activityCardCreated', { title: nextCard.title })
    })
    appendBoardActivity(listResult.board, {
      type: 'card_created',
      message: localizedTextWithParams('activityCardCreated', { title: nextCard.title }),
      meta: {
        cardId: nextCard.id,
        listId: listResult.list.id
      }
    })
    touchCardAndBoard(listResult.board, nextCard)
    runAutomationForCard(listResult.board, listResult.list, nextCard)
    persist()

    if (remoteEnabled.value) {
      http
        .authedJson(`/api/lists/${listId}/cards`, {
          method: 'POST',
          body: {
            id: nextCard.id,
            title: nextCard.title,
            description: nextCard.description || '',
            position: 0,
            dueDate: nextCard.dueDate || ''
          }
        })
        .catch(() => {})
    }
    return nextCard
  }

  function updateCard(boardId, listId, cardId, payload = {}) {
    const cardResult = findCard(boardId, listId, cardId)
    if (!cardResult) {
      return
    }

    let changed = false

    if (typeof payload.title === 'string') {
      cardResult.card.title = payload.title.trim() || localizedText('untitledTask')
      changed = true
    }

    if (typeof payload.description === 'string') {
      cardResult.card.description = payload.description
      changed = true
    }

    if (typeof payload.dueDate === 'string') {
      cardResult.card.dueDate = payload.dueDate
      changed = true
    }

    if (Array.isArray(payload.labelIds)) {
      cardResult.card.labelIds = [...new Set(payload.labelIds)]
      changed = true
    }

    if (Array.isArray(payload.assignees)) {
      cardResult.card.assignees = normalizeAssignees(payload.assignees)
      changed = true
    }

    if (Array.isArray(payload.checklist)) {
      cardResult.card.checklist = payload.checklist.map((item) => normalizeChecklistItem(item))
      changed = true
    }

    if (Array.isArray(payload.comments)) {
      cardResult.card.comments = payload.comments
        .map((item) => normalizeComment(item))
        .filter((item) => item.content)
      changed = true
    }

    if (Array.isArray(payload.activity)) {
      cardResult.card.activity = payload.activity.map((item) => normalizeActivity(item))
      changed = true
    }

    if (payload.automationMeta && typeof payload.automationMeta === 'object') {
      cardResult.card.automationMeta = normalizeCardAutomationMeta(payload.automationMeta)
      changed = true
    }

    if (Array.isArray(payload.attachments)) {
      cardResult.card.attachments = payload.attachments.map((item) => normalizeAttachment(item))
      changed = true
    }

    if (!changed) {
      return
    }

    if (payload.logActivity !== false) {
      appendCardActivity(cardResult.card, {
        type: 'card_updated',
        message: localizedText('activityCardUpdated')
      })
    }

    touchCardAndBoard(cardResult.board, cardResult.card)
    runAutomationForCard(cardResult.board, cardResult.list, cardResult.card)

    persist()

    if (remoteEnabled.value) {
      const body = {}
      if (typeof payload.title === 'string') body.title = cardResult.card.title
      if (typeof payload.description === 'string') body.description = cardResult.card.description
      if (typeof payload.dueDate === 'string') body.dueDate = cardResult.card.dueDate
      if (typeof payload.archived === 'boolean') body.archived = payload.archived
      if (typeof payload.listId === 'string') body.listId = payload.listId
      if (typeof payload.position === 'number') body.position = payload.position

      if (Object.keys(body).length) {
        http.authedJson(`/api/cards/${cardId}`, { method: 'PATCH', body }).catch(() => {})
      }
    }
  }

  function deleteCard(boardId, listId, cardId) {
    const listResult = findList(boardId, listId)
    if (!listResult) {
      return
    }

    const matchedCard = listResult.list.cards.find((card) => card.id === cardId)

    listResult.list.cards = listResult.list.cards.filter((card) => card.id !== cardId)
    if (matchedCard) {
      appendBoardActivity(listResult.board, {
        type: 'card_deleted',
        message: localizedTextWithParams('activityCardDeleted', { title: matchedCard.title }),
        meta: {
          cardId,
          listId
        }
      })
    }
    touchBoard(listResult.board)
    persist()

    if (remoteEnabled.value) {
      http.authedJson(`/api/cards/${cardId}`, { method: 'DELETE' }).catch(() => {})
    }
  }

  function archiveCard(boardId, listId, cardId) {
    const cardResult = findCard(boardId, listId, cardId)
    if (!cardResult) {
      return null
    }

    const sourceIndex = cardResult.list.cards.findIndex((item) => item.id === cardId)
    if (sourceIndex < 0) {
      return null
    }

    const [nextCard] = cardResult.list.cards.splice(sourceIndex, 1)
    nextCard.archived = true
    nextCard.archivedAt = nowIsoString()

    cardResult.board.archivedCards = Array.isArray(cardResult.board.archivedCards) ? cardResult.board.archivedCards : []
    const entry = normalizeArchivedCardEntry({
      id: nextCard.id,
      card: nextCard,
      fromListId: cardResult.list.id,
      fromListTitle: cardResult.list.title,
      archivedAt: nextCard.archivedAt
    })
    cardResult.board.archivedCards.unshift(entry)

    appendCardActivity(nextCard, {
      type: 'card_archived',
      message: localizedTextWithParams('activityCardArchived', { title: nextCard.title }),
      meta: {
        fromListId: cardResult.list.id
      }
    })
    appendBoardActivity(cardResult.board, {
      type: 'card_archived',
      message: localizedTextWithParams('activityCardArchived', { title: nextCard.title }),
      meta: {
        cardId: nextCard.id,
        fromListId: cardResult.list.id
      }
    })

    touchBoard(cardResult.board)
    persist()

    if (remoteEnabled.value) {
      http.authedJson(`/api/cards/${cardId}`, { method: 'PATCH', body: { archived: true } }).catch(() => {})
    }
    return entry
  }

  function restoreArchivedCard(boardId, cardId, targetListId) {
    const board = findBoard(boardId)
    if (!board) {
      return null
    }

    board.archivedCards = Array.isArray(board.archivedCards) ? board.archivedCards : []
    const sourceIndex = board.archivedCards.findIndex((item) => item.id === cardId)
    if (sourceIndex < 0) {
      return null
    }

    const [entry] = board.archivedCards.splice(sourceIndex, 1)
    const nextCard = normalizeCard(entry.card)
    nextCard.archived = false
    nextCard.archivedAt = ''

    let targetList = null
    if (typeof targetListId === 'string' && targetListId.trim()) {
      targetList = board.lists.find((list) => list.id === targetListId) || null
    }

    if (!targetList && entry.fromListId) {
      targetList = board.lists.find((list) => list.id === entry.fromListId) || null
    }

    if (!targetList) {
      if (!board.lists.length) {
        const createdList = normalizeList({
          title: localizedText('newList'),
          cards: []
        })
        board.lists.push(createdList)
      }

      targetList = board.lists[0] || null
    }

    if (!targetList) {
      return null
    }

    targetList.cards.unshift(nextCard)

    appendCardActivity(nextCard, {
      type: 'card_restored',
      message: localizedTextWithParams('activityCardRestored', { title: nextCard.title }),
      meta: {
        targetListId: targetList.id
      }
    })
    appendBoardActivity(board, {
      type: 'card_restored',
      message: localizedTextWithParams('activityCardRestored', { title: nextCard.title }),
      meta: {
        cardId: nextCard.id,
        targetListId: targetList.id
      }
    })

    touchBoard(board)
    persist()

    if (remoteEnabled.value) {
      http
        .authedJson(`/api/cards/${cardId}`, {
          method: 'PATCH',
          body: { archived: false, listId: targetList.id, position: 0 }
        })
        .catch(() => {})
    }
    return {
      card: nextCard,
      listId: targetList.id
    }
  }

  function deleteArchivedCard(boardId, cardId) {
    const board = findBoard(boardId)
    if (!board) {
      return false
    }

    board.archivedCards = Array.isArray(board.archivedCards) ? board.archivedCards : []
    const sourceIndex = board.archivedCards.findIndex((item) => item.id === cardId)
    if (sourceIndex < 0) {
      return false
    }

    const [entry] = board.archivedCards.splice(sourceIndex, 1)
    const title = entry?.card?.title || ''
    appendBoardActivity(board, {
      type: 'archived_card_deleted',
      message: localizedTextWithParams('activityCardDeleted', { title }),
      meta: {
        cardId
      }
    })

    touchBoard(board)
    persist()

    if (remoteEnabled.value) {
      http.authedJson(`/api/cards/${cardId}`, { method: 'DELETE' }).catch(() => {})
    }
    return true
  }

  function addLabel(boardId, payload = {}) {
    const board = findBoard(boardId)
    if (!board) {
      return null
    }

    const nextLabel = {
      id: createId('label'),
      name: String(payload.name || localizedText('labelName')).trim() || localizedText('labelName'),
      color: payload.color || '#2f86eb'
    }

    board.labels.push(nextLabel)
    touchBoard(board)
    persist()
    return nextLabel
  }

  function removeLabel(boardId, labelId) {
    const board = findBoard(boardId)
    if (!board) {
      return
    }

    board.labels = board.labels.filter((label) => label.id !== labelId)

    board.lists.forEach((list) => {
      list.cards.forEach((card) => {
        card.labelIds = card.labelIds.filter((id) => id !== labelId)
        touchCard(card)
      })
    })

    touchBoard(board)
    persist()
  }

  function addAttachment(boardId, listId, cardId, payload = {}) {
    const cardResult = findCard(boardId, listId, cardId)
    if (!cardResult) {
      return null
    }

    const nextAttachment = normalizeAttachment({
      id: createId('attachment'),
      name: payload.name || localizedText('attachment'),
      url: payload.url || '',
      type: payload.type || '',
      size: payload.size || 0
    })

    cardResult.card.attachments.unshift(nextAttachment)
    appendCardActivity(cardResult.card, {
      type: 'attachment_added',
      message: localizedText('activityAttachmentAdded'),
      meta: {
        attachmentId: nextAttachment.id,
        attachmentName: nextAttachment.name
      }
    })
    appendBoardActivity(cardResult.board, {
      type: 'attachment_added',
      message: localizedTextWithParams('activityBoardAttachmentAdded', { title: cardResult.card.title }),
      meta: {
        cardId: cardResult.card.id,
        listId: cardResult.list.id,
        attachmentId: nextAttachment.id
      }
    })
    touchCardAndBoard(cardResult.board, cardResult.card)
    runAutomationForCard(cardResult.board, cardResult.list, cardResult.card)
    persist()

    if (remoteEnabled.value) {
      http
        .authedJson(`/api/cards/${cardId}/attachments`, {
          method: 'POST',
          body: {
            id: nextAttachment.id,
            name: nextAttachment.name,
            url: nextAttachment.url,
            type: nextAttachment.type,
            size: nextAttachment.size
          }
        })
        .catch(() => {})
    }
    return nextAttachment
  }

  function removeAttachment(boardId, listId, cardId, attachmentId) {
    const cardResult = findCard(boardId, listId, cardId)
    if (!cardResult) {
      return
    }

    cardResult.card.attachments = cardResult.card.attachments.filter((item) => item.id !== attachmentId)
    touchCardAndBoard(cardResult.board, cardResult.card)
    persist()

    if (remoteEnabled.value) {
      http.authedJson(`/api/attachments/${attachmentId}`, { method: 'DELETE' }).catch(() => {})
    }
  }

  function setCardAssignees(boardId, listId, cardId, assignees = []) {
    const cardResult = findCard(boardId, listId, cardId)
    if (!cardResult) {
      return
    }

    cardResult.card.assignees = normalizeAssignees(assignees)
    appendCardActivity(cardResult.card, {
      type: 'assignees_updated',
      message: localizedText('activityAssigneesUpdated')
    })
    appendBoardActivity(cardResult.board, {
      type: 'assignees_updated',
      message: localizedTextWithParams('activityBoardAssigneesUpdated', { title: cardResult.card.title }),
      meta: {
        cardId: cardResult.card.id,
        listId: cardResult.list.id
      }
    })
    touchCardAndBoard(cardResult.board, cardResult.card)
    runAutomationForCard(cardResult.board, cardResult.list, cardResult.card)
    persist()
  }

  function addChecklistItem(boardId, listId, cardId, text) {
    const cardResult = findCard(boardId, listId, cardId)
    if (!cardResult) {
      return null
    }

    const nextText = String(text || '').trim()
    if (!nextText) {
      return null
    }

    const nextItem = normalizeChecklistItem({
      id: createId('check'),
      text: nextText,
      done: false
    })

    cardResult.card.checklist.push(nextItem)
    appendCardActivity(cardResult.card, {
      type: 'checklist_added',
      message: localizedText('activityChecklistAdded'),
      meta: {
        checklistItemId: nextItem.id
      }
    })
    touchCardAndBoard(cardResult.board, cardResult.card)
    runAutomationForCard(cardResult.board, cardResult.list, cardResult.card)
    persist()
    return nextItem
  }

  function toggleChecklistItem(boardId, listId, cardId, checklistItemId, doneValue) {
    const cardResult = findCard(boardId, listId, cardId)
    if (!cardResult) {
      return
    }

    const item = cardResult.card.checklist.find((entry) => entry.id === checklistItemId)
    if (!item) {
      return
    }

    item.done = typeof doneValue === 'boolean' ? doneValue : !item.done
    appendCardActivity(cardResult.card, {
      type: 'checklist_toggled',
      message: localizedText('activityChecklistToggled'),
      meta: {
        checklistItemId: item.id,
        done: item.done
      }
    })
    touchCardAndBoard(cardResult.board, cardResult.card)
    runAutomationForCard(cardResult.board, cardResult.list, cardResult.card)
    persist()
  }

  function removeChecklistItem(boardId, listId, cardId, checklistItemId) {
    const cardResult = findCard(boardId, listId, cardId)
    if (!cardResult) {
      return
    }

    const beforeLength = cardResult.card.checklist.length
    cardResult.card.checklist = cardResult.card.checklist.filter((item) => item.id !== checklistItemId)
    if (cardResult.card.checklist.length === beforeLength) {
      return
    }

    appendCardActivity(cardResult.card, {
      type: 'checklist_removed',
      message: localizedText('activityChecklistRemoved'),
      meta: {
        checklistItemId
      }
    })
    touchCardAndBoard(cardResult.board, cardResult.card)
    runAutomationForCard(cardResult.board, cardResult.list, cardResult.card)
    persist()
  }

  function addCardComment(boardId, listId, cardId, payload = {}) {
    const cardResult = findCard(boardId, listId, cardId)
    if (!cardResult) {
      return null
    }

    const content = String(payload.content || '').trim()
    if (!content) {
      return null
    }

    const nextComment = normalizeComment({
      id: createId('comment'),
      author: payload.author || localizedText('commentUntitledAuthor'),
      content,
      createdAt: new Date().toISOString()
    })

    cardResult.card.comments.push(nextComment)
    appendCardActivity(cardResult.card, {
      type: 'comment_added',
      message: localizedText('activityCommentAdded'),
      meta: {
        commentId: nextComment.id
      }
    })
    appendBoardActivity(cardResult.board, {
      type: 'comment_added',
      message: localizedTextWithParams('activityBoardCommentAdded', { title: cardResult.card.title }),
      meta: {
        cardId: cardResult.card.id,
        listId: cardResult.list.id,
        commentId: nextComment.id
      }
    })
    touchCardAndBoard(cardResult.board, cardResult.card)
    runAutomationForCard(cardResult.board, cardResult.list, cardResult.card)
    persist()
    return nextComment
  }

  function runAutomation(boardId = currentBoardId.value, options = {}) {
    const board = findBoard(boardId)
    if (!board) {
      return {
        updatedCardCount: 0
      }
    }

    let updatedCardCount = 0
    const listSnapshots = board.lists.map((list) => ({
      listId: list.id,
      cardIds: list.cards.map((card) => card.id)
    }))

    listSnapshots.forEach(({ listId, cardIds }) => {
      const sourceList = board.lists.find((list) => list.id === listId)
      if (!sourceList) {
        return
      }

      cardIds.forEach((cardId) => {
        const card = sourceList.cards.find((item) => item.id === cardId)
        if (!card) {
          return
        }

        if (runAutomationForCard(board, sourceList, card, options)) {
          updatedCardCount += 1
        }
      })
    })

    if (updatedCardCount > 0) {
      persist()
    }

    return {
      updatedCardCount
    }
  }

  function runAutomationRule(boardId = currentBoardId.value, ruleId = '') {
    const normalizedRuleId = String(ruleId || '').trim()
    if (!normalizedRuleId) {
      return {
        updatedCardCount: 0
      }
    }

    return runAutomation(boardId, {
      ruleIds: [normalizedRuleId]
    })
  }

  function isCardDueStateMatch(card, dueState = 'all') {
    if (dueState === 'all') {
      return true
    }

    const dueDate = parseDateStart(card?.dueDate)
    const today = parseDateStart(new Date())

    if (dueState === 'none') {
      return !dueDate
    }

    if (!dueDate || !today) {
      return false
    }

    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000)
    if (dueState === 'overdue') {
      return diffDays < 0
    }

    if (dueState === 'today') {
      return diffDays === 0
    }

    if (dueState === 'next7') {
      return diffDays >= 0 && diffDays <= 7
    }

    return true
  }

  function buildCardSearchText(board, list, card) {
    const commentText = Array.isArray(card.comments)
      ? card.comments.map((item) => item.content).join(' ')
      : ''
    const checklistText = Array.isArray(card.checklist)
      ? card.checklist.map((item) => item.text).join(' ')
      : ''
    const assigneeText = Array.isArray(card.assignees) ? card.assignees.join(' ') : ''

    return [
      board.title,
      board.description,
      list.title,
      card.title,
      card.description,
      commentText,
      checklistText,
      assigneeText
    ]
      .join(' ')
      .toLowerCase()
  }

  function getSearchFacets(viewer = {}) {
    const visibleBoards = getVisibleBoards(viewer)
    const labelMap = new Map()
    const assigneeMap = new Map()

    visibleBoards.forEach((board) => {
      board.labels.forEach((label) => {
        if (!labelMap.has(label.id)) {
          labelMap.set(label.id, {
            id: label.id,
            name: label.name,
            color: label.color
          })
        }
      })

      board.members.forEach((memberName) => {
        const normalized = String(memberName || '').trim()
        if (normalized && !assigneeMap.has(normalized)) {
          assigneeMap.set(normalized, normalized)
        }
      })

      board.lists.forEach((list) => {
        list.cards.forEach((card) => {
          card.assignees.forEach((assignee) => {
            const normalized = String(assignee || '').trim()
            if (normalized && !assigneeMap.has(normalized)) {
              assigneeMap.set(normalized, normalized)
            }
          })
        })
      })
    })

    return {
      labels: Array.from(labelMap.values()),
      assignees: Array.from(assigneeMap.values())
    }
  }

  function searchWorkspace(query = '', viewer = {}, filters = {}) {
    const keyword = String(query || '').trim().toLowerCase()
    const keywordTokens = normalizeSearchKeywordTokens(keyword)
    const typeFilter = ['all', 'boards', 'cards'].includes(filters.type) ? filters.type : 'all'
    const visibilityFilter = ['all', 'workspace', 'private', 'public'].includes(filters.visibility)
      ? filters.visibility
      : 'all'
    const sortBy = ['relevance', 'recent'].includes(filters.sortBy) ? filters.sortBy : 'relevance'
    const labelFilter = String(filters.labelId || '').trim()
    const assigneeFilter = String(filters.assignee || '').trim()
    const dueState = ['all', 'overdue', 'today', 'next7', 'none'].includes(filters.dueState)
      ? filters.dueState
      : 'all'

    const scopedBoards = getVisibleBoards(viewer).filter((board) => {
      if (visibilityFilter === 'all') {
        return true
      }

      return board.visibility === visibilityFilter
    })

    const boardResults = []
    const cardResults = []

    scopedBoards.forEach((board) => {
      const boardText = `${board.title} ${board.description}`.toLowerCase()
      if (typeFilter !== 'cards') {
        if (!keywordTokens.length || hasTokenMatch(boardText, keywordTokens)) {
          const boardFieldScores = {
            boardTitle: scoreTextByTokens(board.title, keywordTokens, 12),
            boardDescription: scoreTextByTokens(board.description, keywordTokens, 5)
          }
          const boardScore = Object.values(boardFieldScores).reduce((sum, value) => sum + value, 0)
          const matchedFields = Object.entries(boardFieldScores)
            .filter(([, value]) => value > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([key]) => key)

          boardResults.push({
            boardId: board.id,
            boardTitle: board.title,
            boardDescription: board.description,
            visibility: board.visibility,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt || board.createdAt,
            listCount: board.lists.length,
            score: boardScore,
            matchedFields
          })
        }
      }

      if (typeFilter === 'boards') {
        return
      }

      board.lists.forEach((list) => {
        list.cards.forEach((card) => {
          if (labelFilter && !card.labelIds.includes(labelFilter)) {
            return
          }

          if (assigneeFilter && !card.assignees.includes(assigneeFilter)) {
            return
          }

          if (!isCardDueStateMatch(card, dueState)) {
            return
          }

          const cardText = buildCardSearchText(board, list, card)
          if (keywordTokens.length && !hasTokenMatch(cardText, keywordTokens)) {
            return
          }

          const commentText = Array.isArray(card.comments)
            ? card.comments.map((item) => item.content).join(' ')
            : ''
          const checklistText = Array.isArray(card.checklist)
            ? card.checklist.map((item) => item.text).join(' ')
            : ''
          const assigneeText = Array.isArray(card.assignees) ? card.assignees.join(' ') : ''
          const cardFieldScores = {
            cardTitle: scoreTextByTokens(card.title, keywordTokens, 14),
            cardDescription: scoreTextByTokens(card.description, keywordTokens, 6),
            boardTitle: scoreTextByTokens(board.title, keywordTokens, 5),
            listTitle: scoreTextByTokens(list.title, keywordTokens, 6),
            comments: scoreTextByTokens(commentText, keywordTokens, 3),
            checklist: scoreTextByTokens(checklistText, keywordTokens, 3),
            assignees: scoreTextByTokens(assigneeText, keywordTokens, 2)
          }
          const cardScore = Object.values(cardFieldScores).reduce((sum, value) => sum + value, 0)
          const matchedFields = Object.entries(cardFieldScores)
            .filter(([, value]) => value > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([key]) => key)

          cardResults.push({
            boardId: board.id,
            listId: list.id,
            cardId: card.id,
            boardTitle: board.title,
            listTitle: list.title,
            title: card.title,
            description: card.description,
            dueDate: card.dueDate,
            labelIds: [...card.labelIds],
            assignees: [...card.assignees],
            commentCount: card.comments.length,
            checklistTotal: card.checklist.length,
            checklistDone: card.checklist.filter((item) => item.done).length,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt || card.createdAt,
            score: cardScore,
            matchedFields
          })
        })
      })
    })

    const sortByRecent = (a, b) => {
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    }

    if (sortBy === 'recent') {
      boardResults.sort(sortByRecent)
      cardResults.sort(sortByRecent)
    } else {
      boardResults.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }

        return sortByRecent(a, b)
      })

      cardResults.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }

        return sortByRecent(a, b)
      })
    }

    return {
      keyword,
      sortBy,
      boards: boardResults,
      cards: cardResults,
      total: boardResults.length + cardResults.length
    }
  }

  function getBoardStats(boardInput) {
    const board = typeof boardInput === 'string' ? findBoard(boardInput) : boardInput
    if (!board) {
      return {
        listCount: 0,
        cardCount: 0,
        attachmentCount: 0
      }
    }

    const listCount = board.lists.length
    const cardCount = board.lists.reduce((sum, list) => sum + list.cards.length, 0)
    const attachmentCount = board.lists.reduce(
      (sum, list) => sum + list.cards.reduce((acc, card) => acc + card.attachments.length, 0),
      0
    )

    return {
      listCount,
      cardCount,
      attachmentCount
    }
  }

  function getCard(boardId, listId, cardId) {
    const cardResult = findCard(boardId, listId, cardId)
    return cardResult ? cardResult.card : null
  }

  function getList(boardId, listId) {
    const listResult = findList(boardId, listId)
    return listResult ? listResult.list : null
  }

  function migrateDataToCurrentLocale() {
    let changeCount = 0

    boards.value.forEach((board) => {
      const migratedBoardTitle = translateMigratableValue(board.title)
      if (migratedBoardTitle !== board.title) {
        board.title = migratedBoardTitle
        changeCount += 1
      }

      const migratedBoardDescription = translateMigratableValue(board.description)
      if (migratedBoardDescription !== board.description) {
        board.description = migratedBoardDescription
        changeCount += 1
      }

      if (Array.isArray(board.members)) {
        board.members = board.members.map((member) => {
          const migratedMember = translateMigratableValue(member)
          if (migratedMember !== member) {
            changeCount += 1
          }
          return migratedMember
        })
      }

      if (Array.isArray(board.labels)) {
        board.labels = board.labels.map((label) => {
          const migratedLabelName = translateMigratableValue(label.name)
          if (migratedLabelName !== label.name) {
            changeCount += 1
          }

          return {
            ...label,
            name: migratedLabelName
          }
        })
      }

      if (Array.isArray(board.lists)) {
        board.lists = board.lists.map((list) => {
          const migratedListTitle = translateMigratableValue(list.title)
          if (migratedListTitle !== list.title) {
            changeCount += 1
          }

          const migratedCards = Array.isArray(list.cards)
            ? list.cards.map((card) => {
                const migratedCardTitle = translateMigratableValue(card.title)
                const migratedCardDescription = translateMigratableValue(card.description)

                if (migratedCardTitle !== card.title) {
                  changeCount += 1
                }

                if (migratedCardDescription !== card.description) {
                  changeCount += 1
                }

                const migratedAttachments = Array.isArray(card.attachments)
                  ? card.attachments.map((attachment) => {
                      const migratedAttachmentName = translateMigratableValue(attachment.name)
                      if (migratedAttachmentName !== attachment.name) {
                        changeCount += 1
                      }

                      return {
                        ...attachment,
                        name: migratedAttachmentName
                      }
                    })
                  : []

                return {
                  ...card,
                  title: migratedCardTitle,
                  description: migratedCardDescription,
                  attachments: migratedAttachments
                }
              })
            : []

          return {
            ...list,
            title: migratedListTitle,
            cards: migratedCards
          }
        })
      }

      if (Array.isArray(board.archivedLists)) {
        board.archivedLists = board.archivedLists.map((list) => {
          const migratedListTitle = translateMigratableValue(list.title)

          const migratedCards = Array.isArray(list.cards)
            ? list.cards.map((card) => {
                const migratedCardTitle = translateMigratableValue(card.title)
                const migratedCardDescription = translateMigratableValue(card.description)

                const migratedAttachments = Array.isArray(card.attachments)
                  ? card.attachments.map((attachment) => {
                      const migratedAttachmentName = translateMigratableValue(attachment.name)

                      return {
                        ...attachment,
                        name: migratedAttachmentName
                      }
                    })
                  : []

                return {
                  ...card,
                  title: migratedCardTitle,
                  description: migratedCardDescription,
                  attachments: migratedAttachments
                }
              })
            : []

          return {
            ...list,
            title: migratedListTitle,
            cards: migratedCards
          }
        })
      }
    })

    if (changeCount > 0) {
      persist()
    }

    return {
      boardCount: boards.value.length,
      changeCount
    }
  }

  return {
    boards,
    currentBoard,
    currentBoardId,
    init,
    persist,
    touch,
    setCurrentBoard,
    findBoard,
    canAccessBoard,
    getVisibleBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    addList,
    copyList,
    moveList,
    archiveList,
    restoreArchivedList,
    deleteArchivedList,
    renameList,
    deleteList,
    addCard,
    updateCard,
    deleteCard,
    archiveCard,
    restoreArchivedCard,
    deleteArchivedCard,
    addLabel,
    removeLabel,
    addAttachment,
    removeAttachment,
    setCardAssignees,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    addCardComment,
    runAutomation,
    runAutomationRule,
    getSearchFacets,
    searchWorkspace,
    getBoardStats,
    getCard,
    getList,
    migrateDataToCurrentLocale
  }
})

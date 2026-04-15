<template>
  <el-drawer
    class="card-detail-drawer"
    :model-value="visible"
    :title="t('workspaceCardDetail.drawerTitle')"
    direction="rtl"
    size="460px"
    @update:model-value="updateVisible"
  >
    <template v-if="localCard.id">
      <el-form label-position="top" class="detail-form">
        <el-form-item :label="t('workspaceCardDetail.title')">
          <el-input v-model="localCard.title" maxlength="120" @blur="persist" />
        </el-form-item>

        <el-form-item :label="t('workspaceCardDetail.description')">
          <el-input
            v-model="localCard.description"
            type="textarea"
            maxlength="1000"
            :rows="4"
            @blur="persist"
          />
        </el-form-item>

        <el-form-item :label="t('workspaceCardDetail.dueDate')">
          <el-date-picker
            v-model="localCard.dueDate"
            class="full-width"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="t('workspaceCardDetail.dueDatePlaceholder')"
            @change="persist"
          />
        </el-form-item>

        <el-form-item :label="t('workspaceCardDetail.labels')">
          <el-select
            v-model="localCard.labelIds"
            class="full-width"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('workspaceCardDetail.labelsPlaceholder')"
            @change="persist"
          >
            <el-option v-for="label in labels" :key="label.id" :value="label.id" :label="label.name">
              <div class="label-option">
                <span class="label-dot" :style="{ backgroundColor: label.color }" />
                <span>{{ label.name }}</span>
              </div>
            </el-option>
          </el-select>

          <div v-if="currentLabels.length" class="active-labels">
            <el-tag
              v-for="label in currentLabels"
              :key="label.id"
              closable
              class="active-label"
              :style="{ backgroundColor: `${label.color}22`, borderColor: `${label.color}55` }"
              @close="removeLabel(label.id)"
            >
              {{ label.name }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item :label="t('workspaceCardDetail.assignees')">
          <el-select
            v-model="localCard.assignees"
            class="full-width"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('workspaceCardDetail.assigneesPlaceholder')"
            @change="updateAssignees"
          >
            <el-option
              v-for="member in members"
              :key="member"
              :label="member"
              :value="member"
            />
          </el-select>

          <div v-if="localCard.assignees.length" class="assignee-tags">
            <el-tag
              v-for="member in localCard.assignees"
              :key="member"
              class="assignee-tag"
              @close="removeAssignee(member)"
              closable
            >
              {{ member }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item :label="t('workspaceCardDetail.checklist')">
          <div class="checklist-create">
            <el-input
              v-model="newChecklistText"
              :placeholder="t('workspaceCardDetail.checklistPlaceholder')"
              @keyup.enter="createChecklistItem"
            />
            <el-button type="primary" plain @click="createChecklistItem">{{ t('workspaceCardDetail.addChecklistItem') }}</el-button>
          </div>

          <p v-if="localCard.checklist.length" class="checklist-progress">
            {{ t('workspaceCardDetail.checklistProgress', { done: checklistDoneCount, total: localCard.checklist.length }) }}
          </p>

          <ul v-if="localCard.checklist.length" class="checklist-list">
            <li v-for="item in localCard.checklist" :key="item.id" class="checklist-item">
              <label class="checklist-main">
                <input type="checkbox" :checked="item.done" @change="toggleChecklistItem(item.id, $event.target.checked)">
                <span :class="['checklist-text', { done: item.done }]">{{ item.text }}</span>
              </label>
              <el-button text size="small" type="danger" @click="removeChecklistItem(item.id)">{{ t('workspaceCardDetail.remove') }}</el-button>
            </li>
          </ul>
        </el-form-item>

        <el-form-item :label="t('workspaceCardDetail.comments')">
          <div class="comment-create">
            <el-input
              v-model="newCommentText"
              type="textarea"
              :rows="2"
              maxlength="500"
              :placeholder="t('workspaceCardDetail.commentPlaceholder')"
            />
            <div class="comment-create-actions">
              <el-button type="primary" plain @click="createComment">{{ t('workspaceCardDetail.addComment') }}</el-button>
            </div>
          </div>

          <ul v-if="localCard.comments.length" class="comment-list">
            <li v-for="comment in commentTimeline" :key="comment.id" class="comment-item">
              <div class="comment-head">
                <strong>{{ comment.author }}</strong>
                <span>{{ formatDateTime(comment.createdAt) }}</span>
              </div>
              <p>{{ comment.content }}</p>
            </li>
          </ul>
        </el-form-item>

        <el-form-item :label="t('workspaceCardDetail.activity')">
          <ul v-if="localCard.activity.length" class="activity-list">
            <li v-for="entry in localCard.activity" :key="entry.id" class="activity-item">
              <p>{{ entry.message }}</p>
              <span>{{ formatDateTime(entry.createdAt) }}</span>
            </li>
          </ul>
          <p v-else class="activity-empty">{{ t('workspaceCardDetail.activityEmpty') }}</p>
        </el-form-item>

        <el-form-item :label="t('workspaceCardDetail.attachments')">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            class="upload-wrap"
            @change="handleUpload"
          >
            <el-button type="primary" plain>{{ t('workspaceCardDetail.uploadFile') }}</el-button>
          </el-upload>

          <ul v-if="localCard.attachments.length" class="attachment-list">
            <li v-for="attachment in localCard.attachments" :key="attachment.id" class="attachment-item">
              <div class="attachment-meta">
                <strong>{{ attachment.name }}</strong>
                <span>{{ formatBytes(attachment.size) }}</span>
              </div>
              <div class="attachment-actions">
                <el-button text size="small" @click="downloadAttachment(attachment)">{{ t('workspaceCardDetail.download') }}</el-button>
                <el-button text size="small" type="danger" @click="removeAttachment(attachment.id)">{{ t('workspaceCardDetail.remove') }}</el-button>
              </div>
            </li>
          </ul>
        </el-form-item>

        <el-button type="warning" plain @click="emitArchive">{{ t('workspaceCardDetail.archiveCard') }}</el-button>
      </el-form>
    </template>

    <EmptyState
      v-else
      :title="t('workspaceCardDetail.noCardTitle')"
      :description="t('workspaceCardDetail.noCardDescription')"
    />
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import EmptyState from './common/EmptyState.vue'
import { useUserStore } from '../stores/user'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  card: {
    type: Object,
    default: null
  },
  labels: {
    type: Array,
    default: () => []
  },
  members: {
    type: Array,
    default: () => []
  },
  currentUserName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:visible',
  'save',
  'archive',
  'upload-attachment',
  'set-assignees',
  'add-checklist-item',
  'toggle-checklist-item',
  'remove-checklist-item',
  'add-comment'
])

const userStore = useUserStore()
const t = userStore.t
const locale = computed(() => (userStore.locale === 'en' ? 'en' : 'zh'))
const localCard = ref(createEmptyCard())
const newChecklistText = ref('')
const newCommentText = ref('')

const currentLabels = computed(() => {
  const ids = Array.isArray(localCard.value.labelIds) ? localCard.value.labelIds : []
  return props.labels.filter((label) => ids.includes(label.id))
})

const checklistDoneCount = computed(() => {
  if (!Array.isArray(localCard.value.checklist)) {
    return 0
  }

  return localCard.value.checklist.filter((item) => item.done).length
})

const commentTimeline = computed(() => {
  if (!Array.isArray(localCard.value.comments)) {
    return []
  }

  return [...localCard.value.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

watch(
  () => props.card,
  (nextCard) => {
    localCard.value = nextCard ? cloneCard(nextCard) : createEmptyCard()
  },
  {
    immediate: true,
    deep: true
  }
)

function updateVisible(value) {
  emit('update:visible', value)
}

function createEmptyCard() {
  return {
    id: '',
    title: '',
    description: '',
    dueDate: '',
    labelIds: [],
    assignees: [],
    checklist: [],
    comments: [],
    activity: [],
    automationMeta: {
      dueReminderHistory: []
    },
    attachments: []
  }
}

function cloneCard(card) {
  return {
    id: card.id,
    title: card.title || '',
    description: card.description || '',
    dueDate: card.dueDate || '',
    labelIds: Array.isArray(card.labelIds) ? [...card.labelIds] : [],
    assignees: Array.isArray(card.assignees) ? [...card.assignees] : [],
    checklist: Array.isArray(card.checklist) ? card.checklist.map((item) => ({ ...item })) : [],
    comments: Array.isArray(card.comments) ? card.comments.map((comment) => ({ ...comment })) : [],
    activity: Array.isArray(card.activity) ? card.activity.map((entry) => ({ ...entry })) : [],
    automationMeta: card.automationMeta && typeof card.automationMeta === 'object'
      ? {
          dueReminderHistory: Array.isArray(card.automationMeta.dueReminderHistory)
            ? [...card.automationMeta.dueReminderHistory]
            : []
        }
      : {
          dueReminderHistory: []
        },
    attachments: Array.isArray(card.attachments)
      ? card.attachments.map((attachment) => ({ ...attachment }))
      : []
  }
}

function persist() {
  if (!localCard.value.id) {
    return
  }

  emit('save', cloneCard(localCard.value))
}

function removeLabel(labelId) {
  localCard.value.labelIds = localCard.value.labelIds.filter((id) => id !== labelId)
  persist()
}

function updateAssignees(nextAssignees) {
  if (!localCard.value.id) {
    return
  }

  emit('set-assignees', Array.isArray(nextAssignees) ? [...nextAssignees] : [])
}

function removeAssignee(memberName) {
  const nextAssignees = localCard.value.assignees.filter((member) => member !== memberName)
  localCard.value.assignees = nextAssignees
  updateAssignees(nextAssignees)
}

function createChecklistItem() {
  if (!localCard.value.id) {
    return
  }

  const text = newChecklistText.value.trim()
  if (!text) {
    return
  }

  emit('add-checklist-item', text)
  newChecklistText.value = ''
}

function toggleChecklistItem(itemId, checked) {
  if (!localCard.value.id) {
    return
  }

  emit('toggle-checklist-item', {
    itemId,
    done: Boolean(checked)
  })
}

function removeChecklistItem(itemId) {
  if (!localCard.value.id) {
    return
  }

  emit('remove-checklist-item', itemId)
}

function createComment() {
  if (!localCard.value.id) {
    return
  }

  const content = newCommentText.value.trim()
  if (!content) {
    return
  }

  emit('add-comment', {
    content,
    author: props.currentUserName || t('accountMenu.nameFallback')
  })
  newCommentText.value = ''
}

function handleUpload(uploadFile) {
  if (!uploadFile?.raw) {
    return
  }

  emit('upload-attachment', uploadFile.raw)
}

function removeAttachment(attachmentId) {
  localCard.value.attachments = localCard.value.attachments.filter((item) => item.id !== attachmentId)
  persist()
}

function downloadAttachment(attachment) {
  if (!attachment.url) {
    return
  }

  const anchor = document.createElement('a')
  anchor.href = attachment.url
  anchor.download = attachment.name || 'attachment'
  anchor.target = '_blank'
  anchor.rel = 'noopener'
  anchor.click()
}

function emitArchive() {
  emit('archive')
}

function formatBytes(bytes) {
  const size = Number(bytes)
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  let value = size

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
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
</script>

<style scoped>
:deep(.card-detail-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 14px 16px;
  border-bottom: 1px solid #d9dee7;
  background: #f6f7f9;
}

:deep(.card-detail-drawer .el-drawer__title) {
  color: #203451;
  font-size: 15px;
  font-weight: 600;
}

:deep(.card-detail-drawer .el-drawer__body) {
  background: #f3f4f6;
  padding: 14px;
}

.detail-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #dbe2ec;
  border-radius: 10px;
  background: #ffffff;
  padding: 12px;
}

.full-width {
  width: 100%;
}

.label-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.active-labels {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.active-label {
  border: 1px solid transparent;
}

.assignee-tags {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.assignee-tag {
  border: 1px solid #cfdbea;
  background: #eef4fd;
  color: #2d4868;
}

.checklist-create {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.checklist-progress {
  margin: 10px 0 0;
  color: #607896;
  font-size: 12px;
}

.checklist-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checklist-item {
  border: 1px solid #d8e4f2;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.checklist-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.checklist-text {
  color: #21344f;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checklist-text.done {
  color: #6a7f9d;
  text-decoration: line-through;
}

.comment-create {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-create-actions {
  display: flex;
  justify-content: flex-end;
}

.comment-list,
.activity-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-item,
.activity-item {
  border: 1px solid #d8e4f2;
  border-radius: 10px;
  padding: 8px;
  background: #f9fbff;
}

.comment-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.comment-head strong {
  color: #203652;
  font-size: 13px;
}

.comment-head span,
.activity-item span {
  color: #6a7f9d;
  font-size: 11px;
}

.comment-item p,
.activity-item p {
  margin: 6px 0 0;
  color: #2a3d59;
  font-size: 12px;
  line-height: 1.4;
}

.activity-empty {
  margin: 0;
  color: #6a7f9d;
  font-size: 12px;
}

.attachment-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  border: 1px solid #d8e4f2;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.attachment-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.attachment-meta strong {
  font-size: 13px;
  color: #21344f;
}

.attachment-meta span {
  font-size: 12px;
  color: #6a7f9d;
}

.attachment-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>

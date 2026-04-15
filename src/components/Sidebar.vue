<template>
  <el-drawer
    class="board-sidebar-drawer"
    :model-value="visible"
    :title="t('workspaceSidebar.drawerTitle')"
    direction="rtl"
    size="360px"
    @update:model-value="updateVisible"
  >
    <section class="sidebar-section">
      <h4>{{ t('workspaceSidebar.boardInfo') }}</h4>
      <el-input v-model="localTitle" maxlength="48" :placeholder="t('workspaceSidebar.boardTitlePlaceholder')" />
      <el-input
        v-model="localDescription"
        class="mt8"
        type="textarea"
        maxlength="500"
        :rows="3"
        :placeholder="t('workspaceSidebar.boardDescriptionPlaceholder')"
      />
      <el-button class="mt8" type="primary" plain @click="saveBoard">{{ t('workspaceSidebar.saveBoard') }}</el-button>
    </section>

    <section class="sidebar-section">
      <h4>{{ t('workspaceSidebar.stats') }}</h4>
      <div class="stats-grid">
        <article>
          <strong>{{ listCount }}</strong>
          <span>{{ t('workspaceSidebar.lists') }}</span>
        </article>
        <article>
          <strong>{{ cardCount }}</strong>
          <span>{{ t('workspaceSidebar.cards') }}</span>
        </article>
        <article>
          <strong>{{ attachmentCount }}</strong>
          <span>{{ t('workspaceSidebar.attachments') }}</span>
        </article>
      </div>
    </section>

    <section class="sidebar-section">
      <h4>{{ t('workspaceSidebar.members') }}</h4>
      <div class="member-wrap">
        <el-tag v-for="member in board.members" :key="member" size="small">{{ member }}</el-tag>
      </div>
    </section>

    <section class="sidebar-section">
      <h4>{{ t('workspaceSidebar.labels') }}</h4>

      <ul v-if="board.labels.length" class="label-list">
        <li v-for="label in board.labels" :key="label.id">
          <span class="label-name">
            <span class="label-dot" :style="{ backgroundColor: label.color }" />
            {{ label.name }}
          </span>
          <el-button text size="small" type="danger" @click="removeLabel(label.id)">{{ t('workspaceSidebar.delete') }}</el-button>
        </li>
      </ul>

      <div class="new-label-form">
        <el-input v-model="labelForm.name" maxlength="24" :placeholder="t('workspaceSidebar.labelNamePlaceholder')" />
        <el-color-picker v-model="labelForm.color" />
        <el-button type="primary" plain size="small" @click="createLabel">{{ t('workspaceSidebar.addLabel') }}</el-button>
      </div>
    </section>

    <section class="sidebar-section">
      <h4>{{ t('workspaceSidebar.activityTitle') }}</h4>

      <ul v-if="activityItems.length" class="activity-list">
        <li v-for="item in activityItems" :key="item.id" class="activity-item">
          <p class="activity-message">{{ item.message }}</p>
          <span class="activity-time">{{ formatDateTime(item.createdAt) }}</span>
        </li>
      </ul>

      <p v-else class="activity-empty">{{ t('workspaceSidebar.activityEmpty') }}</p>
    </section>
  </el-drawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useUserStore } from '../stores/user'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  board: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'save-board', 'add-label', 'remove-label'])

const userStore = useUserStore()
const t = userStore.t
const locale = computed(() => (userStore.locale === 'en' ? 'en' : 'zh'))
const localTitle = ref('')
const localDescription = ref('')
const labelForm = reactive({
  name: '',
  color: '#2f86eb'
})

const listCount = computed(() => props.board.lists.length)
const cardCount = computed(() => props.board.lists.reduce((sum, list) => sum + list.cards.length, 0))
const attachmentCount = computed(() => props.board.lists.reduce(
  (sum, list) => sum + list.cards.reduce((acc, card) => acc + card.attachments.length, 0),
  0
))

const activityItems = computed(() => {
  return Array.isArray(props.board.activity) ? props.board.activity : []
})

watch(
  () => props.board,
  (board) => {
    localTitle.value = board.title
    localDescription.value = board.description
  },
  {
    immediate: true,
    deep: true
  }
)

function updateVisible(value) {
  emit('update:visible', value)
}

function saveBoard() {
  emit('save-board', {
    title: localTitle.value,
    description: localDescription.value
  })
}

function createLabel() {
  const name = labelForm.name.trim()
  if (!name) {
    return
  }

  emit('add-label', {
    name,
    color: labelForm.color
  })

  labelForm.name = ''
  labelForm.color = '#2f86eb'
}

function removeLabel(labelId) {
  emit('remove-label', labelId)
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
:deep(.board-sidebar-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 14px 16px;
  border-bottom: 1px solid #d9dee7;
  background: #f6f7f9;
}

:deep(.board-sidebar-drawer .el-drawer__title) {
  color: #203451;
  font-size: 15px;
  font-weight: 600;
}

:deep(.board-sidebar-drawer .el-drawer__body) {
  background: #f3f4f6;
  padding: 14px;
}

.sidebar-section {
  margin-bottom: 12px;
  border: 1px solid #dbe2ec;
  border-radius: 10px;
  background: #ffffff;
  padding: 12px;
}

.sidebar-section:last-child {
  margin-bottom: 0;
}

.sidebar-section h4 {
  margin: 0 0 10px;
  color: #1e3556;
  font-size: 14px;
}

.mt8 {
  margin-top: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.stats-grid article {
  background: #f3f7fd;
  border: 1px solid #d7e4f3;
  border-radius: 10px;
  text-align: center;
  padding: 10px 4px;
}

.stats-grid strong {
  display: block;
  color: #224372;
  font-size: 18px;
}

.stats-grid span {
  color: #627a9a;
  font-size: 12px;
}

.member-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.label-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-list li {
  border: 1px solid #d9e5f4;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.label-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2b3f5e;
}

.label-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.new-label-form {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.activity-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  border: 1px solid #d9e5f4;
  border-radius: 10px;
  padding: 10px;
  background: #fbfcfe;
}

.activity-message {
  margin: 0;
  color: #2b3f5e;
  font-size: 13px;
  line-height: 1.4;
}

.activity-time {
  display: inline-block;
  margin-top: 6px;
  color: #627a9a;
  font-size: 12px;
}

.activity-empty {
  margin: 0;
  color: #627a9a;
  font-size: 13px;
}
</style>

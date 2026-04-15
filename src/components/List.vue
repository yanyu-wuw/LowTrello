<template>
  <section class="list-column">
    <header class="list-header">
      <button v-if="!readonly" class="list-drag-handle" :title="t('workspaceList.dragList')" :aria-label="t('workspaceList.dragList')">::</button>

      <div class="list-title-wrap">
        <h3 v-if="!editingTitle" class="list-title" @dblclick="!readonly && startRename()">{{ list.title }}</h3>
        <el-input
          v-else
          ref="titleInputRef"
          v-model="titleDraft"
          size="small"
          maxlength="48"
          @blur="saveTitle"
          @keyup.enter="saveTitle"
          @keyup.esc="cancelRename"
        />
      </div>

      <el-dropdown v-if="!readonly" trigger="click">
        <el-button size="small" text class="list-actions-btn">{{ t('workspaceList.actions') }}</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="startRename">{{ t('workspaceList.renameList') }}</el-dropdown-item>
            <el-dropdown-item @click="copyCurrentList">{{ t('workspaceList.copyList') }}</el-dropdown-item>
            <el-dropdown-item @click="moveCurrentList">{{ t('workspaceList.moveList') }}</el-dropdown-item>
            <el-dropdown-item @click="archiveCurrentList">{{ t('workspaceList.archiveList') }}</el-dropdown-item>
            <el-dropdown-item class="danger-item" @click="removeList">{{ t('workspaceList.deleteList') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <draggable
      v-model="list.cards"
      item-key="id"
      group="cards"
      ghost-class="card-ghost"
      chosen-class="card-chosen"
      drag-class="card-dragging"
      animation="180"
      class="list-card-stack"
      :disabled="readonly"
      @change="handleCardsChange"
    >
      <template #item="{ element }">
        <Card :card="element" :labels="labels" @open="openCard" />
      </template>
    </draggable>

    <div v-if="!readonly" class="list-footer">
      <div v-if="addingCard" class="new-card-form">
        <el-input
          v-model="newCardTitle"
          size="small"
          maxlength="120"
          :placeholder="t('workspaceList.taskTitlePlaceholder')"
          @keyup.enter="submitCard"
        />
        <el-input
          v-model="newCardDescription"
          size="small"
          type="textarea"
          :rows="2"
          maxlength="500"
          :placeholder="t('workspaceList.taskDescPlaceholder')"
        />
        <div class="new-card-actions">
          <el-button size="small" type="primary" @click="submitCard">{{ t('workspaceList.add') }}</el-button>
          <el-button size="small" @click="cancelAddCard">{{ t('workspaceList.cancel') }}</el-button>
        </div>
      </div>

      <el-button v-else class="add-card-btn" text @click="addingCard = true">{{ t('workspaceList.addCard') }}</el-button>
    </div>
  </section>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import Card from './Card.vue'
import { useBoardStore } from '../stores/board'
import { useListStore } from '../stores/list'
import { useUserStore } from '../stores/user'

const props = defineProps({
  boardId: {
    type: String,
    required: true
  },
  list: {
    type: Object,
    required: true
  },
  labels: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-card', 'board-change'])

const boardStore = useBoardStore()
const listStore = useListStore()
const userStore = useUserStore()
const t = userStore.t

const editingTitle = ref(false)
const titleDraft = ref(props.list.title)
const titleInputRef = ref(null)
const addingCard = ref(false)
const newCardTitle = ref('')
const newCardDescription = ref('')

watch(
  () => props.list.title,
  (nextTitle) => {
    titleDraft.value = nextTitle
  }
)

function startRename() {
  editingTitle.value = true

  nextTick(() => {
    titleInputRef.value?.focus?.()
  })
}

function saveTitle() {
  listStore.renameList(props.boardId, props.list.id, titleDraft.value)
  editingTitle.value = false
  emit('board-change')
}

function cancelRename() {
  titleDraft.value = props.list.title
  editingTitle.value = false
}

function copyCurrentList() {
  const copiedList = listStore.copyList(props.boardId, props.list.id)
  if (!copiedList) {
    return
  }

  ElMessage.success(t('workspaceList.copyListSuccess'))
  emit('board-change')
}

async function moveCurrentList() {
  const currentBoard = boardStore.findBoard(props.boardId)
  if (!currentBoard) {
    return
  }

  try {
    const { value } = await ElMessageBox.prompt(
      t('workspaceList.moveListPromptContent', { max: currentBoard.lists.length }),
      t('workspaceList.moveListPromptTitle'),
      {
        inputType: 'number',
        inputPlaceholder: t('workspaceList.moveListPromptPlaceholder'),
        inputValue: String(currentBoard.lists.findIndex((item) => item.id === props.list.id) + 1),
        confirmButtonText: t('workspaceList.moveListConfirm'),
        cancelButtonText: t('workspaceList.cancel')
      }
    )

    const nextPosition = Number(value)
    if (!Number.isFinite(nextPosition) || nextPosition < 1 || nextPosition > currentBoard.lists.length) {
      ElMessage.warning(t('workspaceList.moveListInvalid'))
      return
    }

    const movedList = listStore.moveList(props.boardId, props.list.id, nextPosition)
    if (!movedList) {
      return
    }

    ElMessage.success(t('workspaceList.moveListSuccess'))
    emit('board-change')
  } catch {
    // canceled
  }
}

async function archiveCurrentList() {
  try {
    await ElMessageBox.confirm(
      t('workspaceList.archiveListConfirmContent'),
      t('workspaceList.archiveListConfirmTitle'),
      {
        type: 'warning',
        confirmButtonText: t('workspaceList.archiveList'),
        cancelButtonText: t('workspaceList.cancel')
      }
    )
  } catch {
    return
  }

  const archivedList = listStore.archiveList(props.boardId, props.list.id)
  if (!archivedList) {
    return
  }

  ElMessage.success(t('workspaceList.archiveListSuccess'))
  emit('board-change')
}

async function removeList() {
  await ElMessageBox.confirm(t('workspaceList.deleteListConfirmContent'), t('workspaceList.deleteListConfirmTitle'), {
    type: 'warning',
    confirmButtonText: t('workspaceList.confirmDelete'),
    cancelButtonText: t('workspaceList.cancel')
  })

  listStore.deleteList(props.boardId, props.list.id)
  emit('board-change')
}

function submitCard() {
  const title = newCardTitle.value.trim()
  if (!title) {
    return
  }

  boardStore.addCard(props.boardId, props.list.id, {
    title,
    description: newCardDescription.value.trim()
  })

  newCardTitle.value = ''
  newCardDescription.value = ''
  addingCard.value = false
  emit('board-change')
}

function cancelAddCard() {
  newCardTitle.value = ''
  newCardDescription.value = ''
  addingCard.value = false
}

function handleCardsChange() {
  emit('board-change')
}

function openCard(cardId) {
  emit('open-card', {
    listId: props.list.id,
    cardId
  })
}
</script>

<style scoped>
.list-column {
  background: #ebecf0;
  border: 1px solid #d6dce5;
  border-radius: 12px;
  width: 272px;
  min-width: 272px;
  max-height: calc(100vh - 270px);
  display: flex;
  flex-direction: column;
  transition:
    border-color var(--drop-indicator-motion-duration) ease,
    box-shadow var(--drop-indicator-motion-duration) ease;
}

.list-column:hover {
  border-color: #c4cedb;
  box-shadow: 0 4px 14px rgba(20, 43, 74, 0.08);
}

.list-column:has(.card-ghost) {
  border-color: #8fb3e5;
  box-shadow: 0 0 0 var(--drop-indicator-glow-radius) rgba(12, 102, 228, 0.16);
}

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
}

.list-drag-handle {
  border: 0;
  background: transparent;
  color: #5f708c;
  cursor: grab;
  font-weight: 700;
  padding: 2px;
  border-radius: 6px;
  transition:
    background-color var(--drop-indicator-motion-duration) ease,
    color var(--drop-indicator-motion-duration) ease;
}

.list-drag-handle:hover {
  background: rgba(9, 30, 66, 0.08);
  color: #2b415f;
}

.list-drag-handle:active {
  cursor: grabbing;
}

.list-title-wrap {
  flex: 1;
  min-width: 0;
}

.list-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #263754;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-actions-btn {
  color: #526783;
  transition: color var(--drop-indicator-motion-duration) ease;
}

.list-actions-btn:hover {
  color: #2d4464;
}

.list-card-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 10px 10px;
  overflow-y: auto;
  min-height: 40px;
}

.list-footer {
  margin-top: auto;
  padding: 0 10px 10px;
}

.new-card-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 8px;
  background: #f6f7f9;
  border: 1px solid #dbe2ec;
  padding: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.new-card-actions {
  display: flex;
  gap: 8px;
}

.add-card-btn {
  width: 100%;
  justify-content: flex-start;
  border: 0;
  border-radius: 8px;
  background: rgba(9, 30, 66, 0.04);
  color: #335882;
  transition:
    background-color var(--drop-indicator-motion-duration) ease,
    transform var(--drop-indicator-motion-duration) ease;
}

.add-card-btn:hover {
  background: rgba(9, 30, 66, 0.08);
}

.add-card-btn:active {
  transform: translateY(1px);
}

:deep(.task-card.card-chosen) {
  border-color: #a5bddf;
  box-shadow: 0 12px 24px rgba(20, 43, 74, 0.18);
}

:deep(.task-card.card-ghost) {
  position: relative;
  height: calc(var(--drop-indicator-line-thickness) + 4px) !important;
  min-height: calc(var(--drop-indicator-line-thickness) + 4px) !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 999px !important;
  opacity: 1;
  overflow: visible;
}

:deep(.task-card.card-ghost > *) {
  display: none;
}

:deep(.task-card.card-ghost)::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: #0c66e4;
  box-shadow: 0 0 0 var(--drop-indicator-glow-radius) rgba(12, 102, 228, 0.18);
}

:deep(.task-card.card-dragging) {
  cursor: grabbing;
}

:deep(.danger-item) {
  color: #cf3434;
}
</style>

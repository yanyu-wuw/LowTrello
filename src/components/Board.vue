<template>
  <section class="board-surface">
    <draggable
      v-model="board.lists"
      item-key="id"
      ghost-class="list-ghost"
      chosen-class="list-chosen"
      drag-class="list-dragging"
      handle=".list-drag-handle"
      animation="180"
      class="board-list-track"
      :disabled="readonly"
      @change="handleListChange"
    >
      <template #item="{ element }">
        <List
          :board-id="board.id"
          :list="element"
          :labels="board.labels"
          :readonly="readonly"
          @open-card="forwardCardOpen"
          @board-change="handleListChange"
        />
      </template>
    </draggable>

    <aside v-if="!readonly" class="board-rail">
      <article class="list-creator">
        <template v-if="addingList">
          <el-input
            v-model="newListTitle"
            :placeholder="t('workspaceBoard.listTitlePlaceholder')"
            maxlength="48"
            @keyup.enter="submitList"
          />
          <div class="creator-actions">
            <el-button type="primary" size="small" @click="submitList">{{ t('workspaceBoard.addList') }}</el-button>
            <el-button size="small" @click="cancelList">{{ t('workspaceList.cancel') }}</el-button>
          </div>
        </template>

        <el-button v-else class="create-list-btn" @click="addingList = true">{{ t('workspaceBoard.addAnotherList') }}</el-button>
      </article>

      <button class="rail-menu-btn" type="button" @click="openListOptionsPanel">
        <el-icon><MoreFilled /></el-icon>
        <span>{{ t('workspaceBoard.listOptions') }}</span>
      </button>
    </aside>

    <el-dialog v-model="listOptionsVisible" width="560px" :show-close="false" class="list-options-dialog">
      <template #header>
        <div class="list-options-header">
          <h3>{{ t('workspaceBoard.listOptions') }}</h3>
          <button type="button" class="list-options-close" :aria-label="t('common.cancel')" @click="listOptionsVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <section v-if="board.lists.length" class="list-options-body">
        <article v-for="list in board.lists" :key="list.id" class="list-options-row">
          <div class="list-options-meta">
            <strong class="list-options-title">{{ list.title }}</strong>
            <span class="list-options-sub">{{ list.cards.length }} {{ t('workspaceSidebar.cards') }}</span>
          </div>

          <div class="list-options-actions">
            <el-button size="small" text type="primary" @click="renameListFromPanel(list.id)">{{ t('workspaceList.renameList') }}</el-button>
            <el-button size="small" text type="primary" @click="copyListFromPanel(list.id)">{{ t('workspaceList.copyList') }}</el-button>
            <el-button size="small" text type="primary" @click="moveListFromPanel(list.id)">{{ t('workspaceList.moveList') }}</el-button>
            <el-button size="small" text type="primary" @click="archiveListFromPanel(list.id)">{{ t('workspaceList.archiveList') }}</el-button>
            <el-button size="small" text type="danger" @click="deleteListFromPanel(list.id)">{{ t('workspaceList.deleteList') }}</el-button>
          </div>
        </article>
      </section>
      <p v-else class="list-options-empty">{{ t('emptyState.description') }}</p>
    </el-dialog>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import draggable from 'vuedraggable'
import { Close, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import List from './List.vue'
import { useListStore } from '../stores/list'
import { useUserStore } from '../stores/user'

const props = defineProps({
  board: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-card', 'board-change'])

const listStore = useListStore()
const userStore = useUserStore()
const t = userStore.t
const addingList = ref(false)
const newListTitle = ref('')
const listOptionsVisible = ref(false)

function submitList() {
  const title = newListTitle.value.trim()
  if (!title) {
    return
  }

  listStore.addList(props.board.id, title)
  newListTitle.value = ''
  addingList.value = false
  emit('board-change')
}

function cancelList() {
  newListTitle.value = ''
  addingList.value = false
}

function openListOptionsPanel() {
  listOptionsVisible.value = true
}

async function renameListFromPanel(listId) {
  const targetList = props.board.lists.find((item) => item.id === listId)
  if (!targetList) {
    return
  }

  try {
    const { value } = await ElMessageBox.prompt(t('workspaceBoard.listTitlePlaceholder'), t('workspaceList.renameList'), {
      inputValue: targetList.title,
      confirmButtonText: t('common.save'),
      cancelButtonText: t('common.cancel')
    })

    listStore.renameList(props.board.id, listId, String(value || '').trim())
    emit('board-change')
  } catch {
    // canceled
  }
}

function copyListFromPanel(listId) {
  const copiedList = listStore.copyList(props.board.id, listId)
  if (!copiedList) {
    return
  }

  ElMessage.success(t('workspaceList.copyListSuccess'))
  emit('board-change')
}

async function moveListFromPanel(listId) {
  const max = props.board.lists.length
  const sourceIndex = props.board.lists.findIndex((item) => item.id === listId)
  if (sourceIndex < 0) {
    return
  }

  try {
    const { value } = await ElMessageBox.prompt(
      t('workspaceList.moveListPromptContent', { max }),
      t('workspaceList.moveListPromptTitle'),
      {
        inputType: 'number',
        inputPlaceholder: t('workspaceList.moveListPromptPlaceholder'),
        inputValue: String(sourceIndex + 1),
        confirmButtonText: t('workspaceList.moveListConfirm'),
        cancelButtonText: t('workspaceList.cancel')
      }
    )

    const nextPosition = Number(value)
    if (!Number.isFinite(nextPosition) || nextPosition < 1 || nextPosition > max) {
      ElMessage.warning(t('workspaceList.moveListInvalid'))
      return
    }

    const movedList = listStore.moveList(props.board.id, listId, nextPosition)
    if (!movedList) {
      return
    }

    ElMessage.success(t('workspaceList.moveListSuccess'))
    emit('board-change')
  } catch {
    // canceled
  }
}

async function archiveListFromPanel(listId) {
  try {
    await ElMessageBox.confirm(t('workspaceList.archiveListConfirmContent'), t('workspaceList.archiveListConfirmTitle'), {
      type: 'warning',
      confirmButtonText: t('workspaceList.archiveList'),
      cancelButtonText: t('workspaceList.cancel')
    })
  } catch {
    return
  }

  const archivedList = listStore.archiveList(props.board.id, listId)
  if (!archivedList) {
    return
  }

  ElMessage.success(t('workspaceList.archiveListSuccess'))
  emit('board-change')
}

async function deleteListFromPanel(listId) {
  try {
    await ElMessageBox.confirm(t('workspaceList.deleteListConfirmContent'), t('workspaceList.deleteListConfirmTitle'), {
      type: 'warning',
      confirmButtonText: t('workspaceList.confirmDelete'),
      cancelButtonText: t('workspaceList.cancel')
    })
  } catch {
    return
  }

  listStore.deleteList(props.board.id, listId)
  emit('board-change')
}

function handleListChange() {
  listStore.syncListOrder()
  emit('board-change')
}

function forwardCardOpen(payload) {
  emit('open-card', payload)
}
</script>

<style scoped>
.board-surface {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px 0 14px;
  scrollbar-width: thin;
  scrollbar-color: #bcc8d8 transparent;
}

.board-surface::-webkit-scrollbar {
  height: 8px;
}

.board-surface::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #bcc8d8;
}

.board-list-track {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-height: 100%;
}

.board-rail {
  width: 272px;
  min-width: 272px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.board-list-track :deep(.list-column) {
  transition:
    border-color var(--drop-indicator-motion-duration) ease,
    box-shadow var(--drop-indicator-motion-duration) ease,
    transform var(--drop-indicator-motion-duration) ease;
}

.board-list-track :deep(.list-column.list-chosen) {
  border-color: #a9bfdd;
  box-shadow: 0 14px 28px rgba(20, 43, 74, 0.2);
}

.board-list-track :deep(.list-column.list-ghost) {
  position: relative;
  width: calc(var(--drop-indicator-line-thickness) + 10px) !important;
  min-width: calc(var(--drop-indicator-line-thickness) + 10px) !important;
  max-width: calc(var(--drop-indicator-line-thickness) + 10px) !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  opacity: 1;
  overflow: visible;
  align-self: stretch;
  min-height: 160px;
}

.board-list-track :deep(.list-column.list-ghost > *) {
  display: none;
}

.board-list-track :deep(.list-column.list-ghost)::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: var(--drop-indicator-line-thickness);
  height: 100%;
  border-radius: 999px;
  background: #0c66e4;
  box-shadow: 0 0 0 var(--drop-indicator-glow-radius) rgba(12, 102, 228, 0.18);
}

.board-list-track :deep(.list-column.list-dragging) {
  cursor: grabbing;
  transform: rotate(1deg);
}

.list-creator {
  width: 100%;
  min-width: 0;
  background: rgba(255, 255, 255, 0.2);
  border: 1px dashed rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 10px 20px rgba(26, 16, 56, 0.14);
  transition:
    background-color var(--drop-indicator-motion-duration) ease,
    border-color var(--drop-indicator-motion-duration) ease;
}

.list-creator:hover {
  background: rgba(255, 255, 255, 0.26);
  border-color: rgba(255, 255, 255, 0.82);
}

.list-creator :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.92);
}

.list-options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.list-options-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.list-options-close {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-regular);
  padding: 6px;
  border-radius: 8px;
}

.list-options-close:hover {
  background: var(--el-fill-color-light);
}

.list-options-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.list-options-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-options-title {
  font-size: 14px;
  line-height: 1.2;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 210px;
}

.list-options-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.list-options-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.list-options-empty {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.create-list-btn {
  width: 100%;
  justify-content: flex-start;
  border-radius: 8px;
  border: 0;
  background: transparent;
  color: #ffffff;
  font-weight: 600;
  transition: background-color 0.14s ease, transform 0.08s ease;
}

.create-list-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.create-list-btn:active {
  transform: translateY(1px);
}

.creator-actions {
  display: flex;
  gap: 8px;
}

.rail-menu-btn {
  width: 100%;
  min-height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(26, 16, 56, 0.14);
  transition:
    background-color var(--drop-indicator-motion-duration) ease,
    border-color var(--drop-indicator-motion-duration) ease,
    transform 0.1s ease;
}

.rail-menu-btn:hover {
  background: rgba(255, 255, 255, 0.26);
  border-color: rgba(255, 255, 255, 0.86);
}

.rail-menu-btn:active {
  transform: translateY(1px);
}

@media (max-width: 900px) {
  .board-rail {
    width: 240px;
    min-width: 240px;
  }
}
</style>

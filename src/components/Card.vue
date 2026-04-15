<template>
  <article class="task-card" @click="openDetail">
    <h4 class="task-title">{{ card.title }}</h4>

    <p v-if="card.description" class="task-desc">{{ card.description }}</p>

    <div v-if="cardLabels.length" class="task-tags">
      <el-tag
        v-for="label in cardLabels"
        :key="label.id"
        size="small"
        class="task-tag"
        :style="{ backgroundColor: `${label.color}22`, borderColor: `${label.color}55`, color: '#22324d' }"
      >
        {{ label.name }}
      </el-tag>
    </div>

    <footer class="task-meta">
      <span v-if="card.dueDate" :class="['due-pill', { overdue: isOverdue }]">
        {{ t('workspaceCard.duePrefix') }} {{ formatDueDate(card.dueDate) }}
      </span>
      <span v-if="card.attachments.length" class="attachment-pill">
        {{ t('workspaceCard.attachmentCount', { count: card.attachments.length }) }}
      </span>
      <span v-if="checklistTotal" class="checklist-pill">
        {{ t('workspaceCard.checklistProgress', { done: checklistDone, total: checklistTotal }) }}
      </span>
      <span v-if="commentCount" class="comment-pill">
        {{ t('workspaceCard.commentCount', { count: commentCount }) }}
      </span>
    </footer>

    <div v-if="assigneePreview.length" class="task-assignees">
      <span v-for="member in assigneePreview" :key="member" class="assignee-avatar" :title="member">
        {{ member.charAt(0).toUpperCase() }}
      </span>
      <span v-if="extraAssigneeCount > 0" class="assignee-more">+{{ extraAssigneeCount }}</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../stores/user'

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  labels: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['open'])
const userStore = useUserStore()
const locale = computed(() => userStore.locale)
const t = userStore.t

const cardLabels = computed(() => {
  const ids = Array.isArray(props.card.labelIds) ? props.card.labelIds : []
  return props.labels.filter((label) => ids.includes(label.id))
})

const isOverdue = computed(() => {
  if (!props.card.dueDate) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(props.card.dueDate)
  dueDate.setHours(0, 0, 0, 0)

  return dueDate < today
})

const checklistTotal = computed(() => Array.isArray(props.card.checklist) ? props.card.checklist.length : 0)
const checklistDone = computed(() => {
  if (!Array.isArray(props.card.checklist)) {
    return 0
  }

  return props.card.checklist.filter((item) => item.done).length
})
const commentCount = computed(() => Array.isArray(props.card.comments) ? props.card.comments.length : 0)
const assigneePreview = computed(() => {
  return Array.isArray(props.card.assignees) ? props.card.assignees.slice(0, 3) : []
})
const extraAssigneeCount = computed(() => {
  const total = Array.isArray(props.card.assignees) ? props.card.assignees.length : 0
  return Math.max(0, total - assigneePreview.value.length)
})

function openDetail() {
  emit('open', props.card.id)
}

function formatDueDate(dateValue) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return dateValue
  }

  return parsed.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US')
}
</script>

<style scoped>
.task-card {
  background: #ffffff;
  border: 1px solid #dbe2ec;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 1px 0 rgba(9, 30, 66, 0.08);
  transform: translateZ(0);
  transition: transform 0.14s ease, box-shadow 0.16s ease, border-color 0.16s ease, background-color 0.16s ease;
  will-change: transform, box-shadow;
}

.task-card:hover {
  transform: translateY(-1px);
  border-color: #c5d1e1;
  box-shadow: 0 8px 18px rgba(20, 43, 74, 0.14);
}

.task-card:active {
  transform: translateY(0) scale(0.992);
  box-shadow: 0 2px 6px rgba(20, 43, 74, 0.12);
}

.task-card.card-dragging {
  cursor: grabbing;
}

.task-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #243149;
  line-height: 1.4;
}

.task-desc {
  margin: 0;
  color: #5f708b;
  font-size: 12px;
  line-height: 1.5;
}

.task-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.task-tag {
  border: 1px solid transparent;
}

.task-meta {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.due-pill,
.attachment-pill,
.checklist-pill,
.comment-pill {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
}

.due-pill {
  background: #e8f0fe;
  color: #1f4f8f;
}

.due-pill.overdue {
  background: #ffecec;
  color: #b12a2a;
}

.attachment-pill {
  background: #eff4fb;
  color: #4a6180;
}

.checklist-pill {
  background: #edf7ee;
  color: #216e4e;
}

.comment-pill {
  background: #f5eefc;
  color: #6b3fa0;
}

.task-assignees {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.assignee-avatar,
.assignee-more {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.assignee-avatar {
  background: #dce7f8;
  color: #234568;
}

.assignee-more {
  background: #eef1f6;
  color: #566a85;
}

@media (prefers-reduced-motion: reduce) {
  .task-card {
    transition: none;
  }
}
</style>

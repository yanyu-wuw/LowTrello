<template>
  <section v-if="board" class="board-page" :style="boardPageStyle">
    <header class="board-title-bar">
      <div class="board-title-left">
        <el-input
          v-if="editingBoardTitle"
          ref="boardTitleInputRef"
          v-model="boardTitleDraft"
          class="board-title-input"
          maxlength="48"
          @blur="saveBoardTitle"
          @keyup.enter="saveBoardTitle"
          @keyup.esc="cancelBoardTitleEdit"
        />
        <button v-else class="board-title-trigger" type="button" @click="startBoardTitleEdit">
          <span>{{ board.title || t('boardView.untitledBoard') }}</span>
        </button>

        <button
          type="button"
          :class="['board-favorite-btn', { active: isCurrentBoardStarred }]"
          :aria-label="isCurrentBoardStarred ? t('boardView.unfavoriteBoard') : t('boardView.favoriteBoard')"
          @click="toggleCurrentBoardStar"
        >
          <el-icon>
            <StarFilled v-if="isCurrentBoardStarred" />
            <Star v-else />
          </el-icon>
        </button>

        <el-dropdown trigger="click" @command="handleBoardMenuCommand">
          <button class="board-title-more" type="button" :aria-label="t('boardView.boardMenu')">
            <el-icon><MoreFilled /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="rename">{{ t('boardView.menuRenameBoard') }}</el-dropdown-item>
              <el-dropdown-item command="share">{{ t('boardView.menuShareBoard') }}</el-dropdown-item>
              <el-dropdown-item command="advanced">
                {{ advancedPanelVisible ? t('boardView.menuHideAdvanced') : t('boardView.menuShowAdvanced') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="board-title-right">
        <button type="button" class="board-share-btn" @click="openShareDialog">{{ t('boardView.shareAction') }}</button>
        <span :class="['board-visibility-chip', board.visibility]">{{ visibilityLabel(board.visibility) }}</span>
        <span class="stat-pill">{{ boardStats.listCount }} {{ t('workspaceSidebar.lists') }}</span>
        <span class="stat-pill">{{ boardStats.cardCount }} {{ t('workspaceSidebar.cards') }}</span>
      </div>
    </header>

    <p class="board-description">{{ board.description || t('boardView.noDescription') }}</p>

    <section v-if="searchPanelVisible" class="board-filter-panel">
      <el-input
        v-model="cardFilters.keyword"
        class="filter-control"
        clearable
        :placeholder="t('boardView.filterKeywordPlaceholder')"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select
        v-model="cardFilters.labelId"
        class="filter-control"
        :placeholder="t('boardView.filterLabelPlaceholder')"
      >
        <el-option value="all" :label="t('boardView.filterAllLabels')" />
        <el-option
          v-for="label in boardLabelOptions"
          :key="label.id"
          :value="label.id"
          :label="label.name"
        />
      </el-select>

      <el-select
        v-model="cardFilters.assignee"
        class="filter-control"
        :placeholder="t('boardView.filterAssigneePlaceholder')"
      >
        <el-option value="all" :label="t('boardView.filterAllAssignees')" />
        <el-option
          v-for="assignee in boardAssigneeOptions"
          :key="assignee"
          :value="assignee"
          :label="assignee"
        />
      </el-select>

      <el-select
        v-model="cardFilters.dueState"
        class="filter-control"
        :placeholder="t('boardView.filterDuePlaceholder')"
      >
        <el-option value="all" :label="t('boardView.filterDueAll')" />
        <el-option value="none" :label="t('boardView.filterDueNone')" />
        <el-option value="overdue" :label="t('boardView.filterDueOverdue')" />
        <el-option value="today" :label="t('boardView.filterDueToday')" />
        <el-option value="next7" :label="t('boardView.filterDueNext7')" />
      </el-select>

      <el-button class="filter-reset-btn" plain @click="resetCardFilters">{{ t('boardView.filterReset') }}</el-button>
    </section>

    <section class="board-canvas">
      <Board
        v-if="activeViewMode === 'kanban'"
        :board="boardForView"
        :readonly="hasCardFilters"
        @open-card="openCard"
        @board-change="persistBoard"
      />

      <section v-else-if="activeViewMode === 'calendar'" class="calendar-view">
        <article
          v-for="bucket in calendarBuckets"
          :key="bucket.key"
          class="calendar-day"
        >
          <header class="calendar-day-header">
            <h3>{{ bucket.title }}</h3>
            <span>{{ bucket.cards.length }} {{ t('workspaceSidebar.cards') }}</span>
          </header>

          <div class="calendar-day-list">
            <button
              v-for="card in bucket.cards"
              :key="card.id"
              type="button"
              class="calendar-card"
              @click="openCard({ listId: card.listId, cardId: card.id })"
            >
              <strong>{{ card.title }}</strong>
              <span>{{ card.listTitle }}</span>
            </button>
          </div>
        </article>
      </section>

      <section v-else class="timeline-view">
        <header class="timeline-header">
          <h3>{{ t('boardView.timelineTitle') }}</h3>
          <span>{{ timelineData.rangeLabel || t('boardView.timelineEmpty') }}</span>
        </header>

        <div v-if="timelineData.items.length" class="timeline-list">
          <article v-for="item in timelineData.items" :key="item.id" class="timeline-item">
            <div class="timeline-item-meta">
              <strong>{{ item.title }}</strong>
              <span>{{ item.listTitle }}</span>
            </div>
            <div class="timeline-track">
              <button
                type="button"
                class="timeline-bar"
                :style="{ left: `${item.leftPercent}%`, width: `${item.widthPercent}%` }"
                @click="openCardFromTimeline(item)"
              >
                {{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }}
              </button>
            </div>
          </article>
        </div>

        <div v-else class="timeline-empty">{{ t('boardView.timelineEmpty') }}</div>
      </section>
    </section>

    <section v-if="advancedPanelVisible" class="board-ops-grid">
      <article class="ops-card">
        <header class="ops-card-header">
          <h3>{{ t('boardView.automationTitle') }}</h3>
          <div class="automation-actions-inline">
            <el-button text type="primary" @click="runAutomationNow">{{ t('boardView.runAutomationNow') }}</el-button>
            <el-button text type="primary" @click="addAutomationRule">{{ t('boardView.ruleAdd') }}</el-button>
          </div>
        </header>

        <el-form label-position="top" class="ops-form">
          <article
            v-for="rule in automationRules"
            :key="rule.id"
            :class="['automation-rule-card', { draggable: true, dragging: draggingRuleId === rule.id }]"
            @dragover="onRuleDragOver(rule.id, $event)"
            @drop="onRuleDrop(rule.id, $event)"
          >
            <header class="automation-rule-head">
              <div class="automation-rule-title-wrap">
                <button
                  type="button"
                  class="automation-rule-drag-handle"
                  draggable="true"
                  :title="t('boardView.ruleDragHandle')"
                  :aria-label="t('boardView.ruleDragHandle')"
                  @dragstart="onRuleDragStart(rule.id, $event)"
                  @dragend="onRuleDragEnd"
                >
                  ⋮⋮
                </button>

                <el-input
                  v-model="rule.name"
                  :placeholder="t('boardView.ruleNamePlaceholder')"
                />
              </div>

              <div class="automation-rule-head-actions">
                <el-switch v-model="rule.enabled" :active-text="t('boardView.ruleEnabled')" />
                <el-button text type="primary" @click="runSingleAutomationRule(rule)">{{ t('boardView.ruleRunNow') }}</el-button>
                <el-button text type="danger" @click="removeAutomationRule(rule.id)">{{ t('boardView.ruleRemove') }}</el-button>
              </div>
            </header>

            <div class="automation-rule-grid">
              <el-form-item :label="t('boardView.ruleConditionLabel')">
                <el-select v-model="rule.condition.type" @change="onRuleConditionTypeChange(rule)">
                  <el-option
                    v-for="option in automationConditionOptions"
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                  />
                </el-select>
              </el-form-item>

              <el-form-item :label="t('boardView.ruleActionLabel')">
                <el-select v-model="rule.action.type" @change="onRuleActionTypeChange(rule)">
                  <el-option
                    v-for="option in automationActionOptions"
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                  />
                </el-select>
              </el-form-item>
            </div>

            <div class="automation-rule-params">
              <el-form-item v-if="rule.condition.type === 'due_within_days'" :label="t('boardView.ruleConditionDays')">
                <el-input-number v-model="rule.condition.days" :min="0" :max="30" :step="1" />
              </el-form-item>

              <el-form-item v-else-if="rule.condition.type === 'label_includes'" :label="t('boardView.ruleConditionLabelTarget')">
                <el-select v-model="rule.condition.labelId" clearable>
                  <el-option
                    v-for="label in boardLabelOptions"
                    :key="label.id"
                    :value="label.id"
                    :label="label.name"
                  />
                </el-select>
              </el-form-item>

              <el-form-item v-else-if="rule.condition.type === 'assignee_includes'" :label="t('boardView.ruleConditionAssigneeTarget')">
                <el-select v-model="rule.condition.assignee" clearable>
                  <el-option
                    v-for="assignee in boardAssigneeOptions"
                    :key="assignee"
                    :value="assignee"
                    :label="assignee"
                  />
                </el-select>
              </el-form-item>

              <p v-else class="automation-rule-hint">{{ t('boardView.ruleConditionNoParams') }}</p>

              <el-form-item v-if="rule.action.type === 'append_activity'" :label="t('boardView.ruleActionMessage')">
                <el-input v-model="rule.action.message" :placeholder="t('boardView.ruleActionMessagePlaceholder')" />
              </el-form-item>

              <el-form-item v-else-if="rule.action.type === 'move_to_done_list'" :label="t('boardView.ruleActionDoneKeywords')">
                <el-input v-model="rule.action.doneListKeywordsText" :placeholder="t('boardView.ruleActionDoneKeywordsPlaceholder')" />
              </el-form-item>

              <el-form-item v-else-if="rule.action.type === 'add_comment'" :label="t('boardView.ruleActionComment')">
                <el-input
                  v-model="rule.action.comment"
                  type="textarea"
                  :rows="2"
                  :placeholder="t('boardView.ruleActionCommentPlaceholder')"
                />
              </el-form-item>
            </div>
          </article>

          <p v-if="!automationRules.length" class="automation-empty-hint">{{ t('boardView.ruleEmptyHint') }}</p>

          <el-button type="primary" @click="saveAutomationSettings">{{ t('boardView.saveAutomation') }}</el-button>
        </el-form>
      </article>

      <article class="ops-card">
        <header class="ops-card-header">
          <h3>{{ t('boardView.integrationsTitle') }}</h3>
        </header>

        <el-form label-position="top" class="ops-form integrations-form">
          <el-switch v-model="integrationDraft.slackConnected" :active-text="t('boardView.integrationSlack')" />
          <el-input v-model="integrationDraft.slackChannel" :placeholder="t('boardView.integrationSlackPlaceholder')" />

          <el-switch v-model="integrationDraft.driveConnected" :active-text="t('boardView.integrationDrive')" />
          <el-input v-model="integrationDraft.driveFolder" :placeholder="t('boardView.integrationDrivePlaceholder')" />

          <el-switch v-model="integrationDraft.githubConnected" :active-text="t('boardView.integrationGithub')" />
          <el-input v-model="integrationDraft.githubRepository" :placeholder="t('boardView.integrationGithubPlaceholder')" />

          <el-switch v-model="integrationDraft.webhookEnabled" :active-text="t('boardView.integrationWebhook')" />
          <el-input v-model="integrationDraft.webhookUrl" :placeholder="t('boardView.integrationWebhookPlaceholder')" />

          <el-button type="primary" @click="saveIntegrationSettings">{{ t('boardView.saveIntegrations') }}</el-button>
        </el-form>
      </article>
    </section>

    <footer class="board-bottom-toolbar">
      <button type="button" :class="['toolbar-btn', { active: searchPanelVisible }]" @click="toggleSearchPanel">
        {{ t('boardView.toolbarSearch') }}
      </button>
      <button type="button" :class="['toolbar-btn', { active: searchPanelVisible }]" @click="toggleSearchPanel">
        {{ t('boardView.toolbarFilter') }}
      </button>
      <button type="button" class="toolbar-btn" @click="openArchivePanel">
        {{ t('boardView.toolbarArchive') }}
      </button>
      <button type="button" class="toolbar-btn" @click="cycleViewMode">
        {{ t('boardView.toolbarSwitchView') }} · {{ currentViewModeLabel }}
      </button>
    </footer>

    <el-dialog
      v-model="shareDialogVisible"
      width="640px"
      :show-close="false"
      class="share-board-dialog"
    >
      <template #header>
        <div class="share-dialog-header">
          <h3>{{ t('boardView.shareDialogTitle') }}</h3>
          <button type="button" class="share-dialog-close" :aria-label="t('common.cancel')" @click="shareDialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <section class="share-invite-row">
        <el-input
          v-model="shareInviteForm.query"
          class="share-invite-input"
          :placeholder="t('boardView.shareInvitePlaceholder')"
        />
        <el-select v-model="shareInviteForm.role" class="share-role-select">
          <el-option v-for="option in shareRoleOptions" :key="option.value" :value="option.value" :label="option.label" />
        </el-select>
        <el-button type="primary" @click="inviteShareMember">{{ t('boardView.shareSubmit') }}</el-button>
      </section>

      <section class="share-link-section">
        <div class="share-link-head">
          <p class="share-link-title">
            <el-icon><Link /></el-icon>
            <span>{{ t('boardView.shareByLink') }}</span>
          </p>
          <button
            v-if="!shareLinkDraft.enabled"
            type="button"
            class="share-link-action"
            @click="createShareLink"
          >
            {{ t('boardView.shareCreateLink') }}
          </button>
        </div>

        <div v-if="shareLinkDraft.enabled" class="share-link-enabled">
          <el-select v-model="shareLinkDraft.permission" class="share-link-permission" @change="persistShareState({ syncBoardMembers: false })">
            <el-option
              v-for="option in sharePermissionOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </el-select>
          <button type="button" class="share-link-copy" @click="copyShareLink">{{ t('boardView.shareCopyLink') }}</button>
        </div>

        <p v-if="shareLinkDraft.enabled" class="share-link-url">{{ shareLinkUrl }}</p>
      </section>

      <section class="share-members-section">
        <div class="share-tab-row">
          <button
            type="button"
            :class="['share-tab-btn', { active: sharePanelTab === 'members' }]"
            @click="sharePanelTab = 'members'"
          >
            {{ t('boardView.shareMembersTab', { count: shareMembers.length }) }}
          </button>
          <button
            type="button"
            :class="['share-tab-btn', { active: sharePanelTab === 'requests' }]"
            @click="sharePanelTab = 'requests'"
          >
            {{ t('boardView.shareRequestsTab', { count: shareJoinRequests.length }) }}
          </button>
        </div>

        <div v-if="sharePanelTab === 'members'" class="share-member-list">
          <article v-for="member in shareMembers" :key="member.id" class="share-member-item">
            <div class="share-member-main">
              <span class="share-member-avatar">{{ member.name.charAt(0).toUpperCase() }}</span>
              <div>
                <p class="share-member-name">{{ member.name }}</p>
                <p class="share-member-sub">@{{ member.username }}</p>
              </div>
            </div>

            <el-select v-model="member.role" class="share-role-select" @change="onShareMemberRoleChange(member)">
              <el-option v-for="option in shareRoleOptions" :key="option.value" :value="option.value" :label="option.label" />
            </el-select>
          </article>

          <p v-if="!shareMembers.length" class="share-empty">{{ t('boardView.shareMembersEmpty') }}</p>
        </div>

        <div v-else class="share-request-list">
          <article v-for="request in shareJoinRequests" :key="request.id" class="share-request-item">
            <div class="share-member-main">
              <span class="share-member-avatar">{{ request.name.charAt(0).toUpperCase() }}</span>
              <div>
                <p class="share-member-name">{{ request.name }}</p>
                <p class="share-member-sub">{{ request.email || '@request' }}</p>
              </div>
            </div>

            <div class="share-request-actions">
              <el-button text type="primary" @click="approveJoinRequest(request.id)">{{ t('boardView.shareApprove') }}</el-button>
              <el-button text type="danger" @click="rejectJoinRequest(request.id)">{{ t('boardView.shareReject') }}</el-button>
            </div>
          </article>

          <p v-if="!shareJoinRequests.length" class="share-empty">{{ t('boardView.shareRequestsEmpty') }}</p>
        </div>
      </section>
    </el-dialog>

    <el-dialog
      v-model="archiveDialogVisible"
      width="560px"
      :show-close="false"
      class="archive-dialog"
    >
      <template #header>
        <div class="archive-dialog-header">
          <h3>{{ t('boardView.archiveDialogTitle') }}</h3>
          <button type="button" class="archive-dialog-close" :aria-label="t('common.cancel')" @click="archiveDialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <section class="archive-dialog-body">
        <el-tabs v-model="archiveDialogTab" class="archive-tabs">
          <el-tab-pane name="lists" :label="t('boardView.archiveTabLists')">
            <article v-for="list in archivedLists" :key="list.id" class="archive-list-item">
              <div class="archive-list-main">
                <p class="archive-list-title">{{ list.title }}</p>
                <p class="archive-list-meta">{{ list.cards.length }} {{ t('boardHome.cards') }}</p>
              </div>

              <div class="archive-list-actions">
                <el-button size="small" type="primary" @click="restoreArchivedList(list.id)">{{ t('boardView.archiveRestore') }}</el-button>
                <el-button size="small" type="danger" plain @click="deleteArchivedList(list.id)">{{ t('boardView.archiveDelete') }}</el-button>
              </div>
            </article>

            <p v-if="!archivedLists.length" class="archive-empty">{{ t('boardView.archiveEmpty') }}</p>
          </el-tab-pane>

          <el-tab-pane name="cards" :label="t('boardView.archiveTabCards')">
            <article v-for="entry in archivedCards" :key="entry.id" class="archive-card-item">
              <div class="archive-card-main">
                <p class="archive-card-title">{{ entry.card.title }}</p>
                <p class="archive-card-meta">
                  <span v-if="entry.fromListTitle">{{ entry.fromListTitle }}</span>
                  <span v-else>{{ t('boardView.archiveCardUnknownList') }}</span>
                </p>
              </div>

              <div class="archive-card-actions">
                <el-button size="small" type="primary" @click="restoreArchivedCard(entry.id)">{{ t('boardView.archiveRestore') }}</el-button>
                <el-button size="small" type="danger" plain @click="deleteArchivedCard(entry.id)">{{ t('boardView.archiveDelete') }}</el-button>
              </div>
            </article>

            <p v-if="!archivedCards.length" class="archive-empty">{{ t('boardView.archiveCardsEmpty') }}</p>
          </el-tab-pane>
        </el-tabs>
      </section>
    </el-dialog>

    <CardDetail
      :visible="detailVisible"
      :card="selectedCard"
      :labels="board.labels"
      :members="board.members"
      :current-user-name="currentUserName"
      @update:visible="onDetailVisibleChange"
      @save="saveCard"
      @archive="archiveCard"
      @set-assignees="setCardAssignees"
      @add-checklist-item="addChecklistItem"
      @toggle-checklist-item="toggleChecklistItem"
      @remove-checklist-item="removeChecklistItem"
      @add-comment="addCardComment"
      @upload-attachment="uploadAttachment"
    />

    <Sidebar
      :visible="sidebarVisible"
      :board="board"
      @update:visible="(value) => (sidebarVisible = value)"
      @save-board="saveBoardInfo"
      @add-label="addLabel"
      @remove-label="removeLabel"
    />
  </section>

  <section v-else class="board-empty">
    <EmptyState
      :title="t('boardView.boardNotFound')"
      :description="t('boardView.boardNotFoundDesc')"
    >
      <el-button type="primary" @click="goHome">{{ t('boardView.returnHome') }}</el-button>
    </EmptyState>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close, Link, MoreFilled, Search, Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Board from '../components/Board.vue'
import CardDetail from '../components/CardDetail.vue'
import Sidebar from '../components/Sidebar.vue'
import EmptyState from '../components/common/EmptyState.vue'
import { useBoardStore } from '../stores/board'
import { useCardStore } from '../stores/card'
import { useUserStore } from '../stores/user'
import { createId } from '../utils/id'
import { fileToDataUrl } from '../utils/file'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const DEFAULT_WORKSPACE_KEY = 'default-workspace'
const HOME_RECENT_STARS_KEY = 'lowtrello.home.recent.stars.v1'
const HOME_RECENT_STAR_LIMIT = 24
const BOARD_SHARE_STATE_KEY = 'lowtrello.board.share.state.v1'

const route = useRoute()
const router = useRouter()
const boardStore = useBoardStore()
const cardStore = useCardStore()
const userStore = useUserStore()

const t = userStore.t

const detailVisible = ref(false)
const sidebarVisible = ref(false)
const boardTitleInputRef = ref(null)
const editingBoardTitle = ref(false)
const boardTitleDraft = ref('')
const activeViewMode = ref('kanban')
const searchPanelVisible = ref(true)
const advancedPanelVisible = ref(false)
const starredBoardIds = ref([])
const shareDialogVisible = ref(false)
const archiveDialogVisible = ref(false)
const archiveDialogTab = ref('lists')
const sharePanelTab = ref('members')
const shareMembers = ref([])
const shareJoinRequests = ref([])
const shareInviteForm = reactive({
  query: '',
  role: 'member'
})
const shareLinkDraft = reactive({
  enabled: false,
  token: '',
  permission: 'edit'
})
const automationRules = ref([])
const draggingRuleId = ref('')
const cardFilters = reactive({
  keyword: '',
  labelId: 'all',
  assignee: 'all',
  dueState: 'all'
})
const integrationDraft = reactive({
  slackConnected: false,
  slackChannel: '',
  driveConnected: false,
  driveFolder: '',
  githubConnected: false,
  githubRepository: '',
  webhookEnabled: false,
  webhookUrl: ''
})
const FEEDBACK_PRESET_LISTS = [
  {
    title: 'Note',
    cards: [
      {
        title: 'General Notes',
        description: 'Collect high-level feedback and key discussion outcomes.'
      },
      {
        title: 'Action Items',
        description: 'Track follow-up tasks with owners and expected due dates.'
      }
    ]
  },
  {
    title: 'Positives',
    cards: [
      {
        title: "Positive: It's really clear",
        description: 'The onboarding flow is simple and visually consistent.',
        labelKeys: ['positive']
      }
    ]
  },
  {
    title: 'Negatives',
    cards: [
      {
        title: "Negative: I'm not sure about this",
        description: 'Some copy is ambiguous and needs clarification.',
        labelKeys: ['negative']
      }
    ]
  },
  {
    title: 'Questions',
    cards: [
      {
        title: 'Question: What about edge cases?',
        description: 'List unknown scenarios that require validation.',
        labelKeys: ['question']
      }
    ]
  },
  {
    title: 'Have You',
    cards: [
      {
        title: 'Have you considered accessibility checks?',
        description: 'Review contrast, keyboard navigation, and focus states.',
        labelKeys: ['consider']
      }
    ]
  },
  {
    title: 'Potential Blockers',
    cards: [
      {
        title: 'Potential Blocker: API dependency risk',
        description: 'Backend timeline may impact rollout milestones.',
        labelKeys: ['blocker']
      }
    ]
  }
]
const FEEDBACK_PRESET_LABELS = [
  { key: 'positive', name: 'Positive', color: '#3b82f6' },
  { key: 'negative', name: 'Negative', color: '#ef4444' },
  { key: 'question', name: 'Question', color: '#f59e0b' },
  { key: 'consider', name: 'Consider', color: '#22c55e' },
  { key: 'blocker', name: 'Blocker', color: '#dc2626' }
]

const currentUserEmail = computed(() => {
  return String(userStore.currentUser?.email || '').trim().toLowerCase()
})

const currentUserName = computed(() => {
  return String(userStore.currentUser?.name || '').trim() || t('accountMenu.nameFallback')
})

const currentWorkspaceKey = computed(() => {
  const raw = String(userStore.currentUser?.workspaceName || '').trim().toLowerCase()
  return raw || DEFAULT_WORKSPACE_KEY
})

const viewerAccess = computed(() => {
  return {
    email: currentUserEmail.value,
    workspaceKey: currentWorkspaceKey.value
  }
})

const board = computed(() => boardStore.currentBoard)
const selectedCard = computed(() => cardStore.selectedCard)
const boardPageStyle = computed(() => {
  return {
    background: 'linear-gradient(120deg, #6f38f2 0%, #d84667 100%)'
  }
})
const boardStats = computed(() => {
  if (!board.value) {
    return {
      listCount: 0,
      cardCount: 0,
      attachmentCount: 0
    }
  }

  return boardStore.getBoardStats(board.value)
})
const isCurrentBoardStarred = computed(() => {
  if (!board.value) {
    return false
  }

  return starredBoardIds.value.includes(board.value.id)
})
const shareRoleOptions = computed(() => ([
  { value: 'member', label: t('boardView.shareRoleMember') },
  { value: 'admin', label: t('boardView.shareRoleAdmin') },
  { value: 'observer', label: t('boardView.shareRoleObserver') }
]))
const sharePermissionOptions = computed(() => ([
  { value: 'view', label: t('boardView.sharePermissionView') },
  { value: 'comment', label: t('boardView.sharePermissionComment') },
  { value: 'edit', label: t('boardView.sharePermissionEdit') }
]))
const shareLinkUrl = computed(() => {
  if (!board.value || !shareLinkDraft.enabled || !shareLinkDraft.token) {
    return ''
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lowtrello.local'
  return `${origin}/#/board/${board.value.id}?share=${shareLinkDraft.token}&permission=${shareLinkDraft.permission}`
})

const archivedLists = computed(() => {
  if (!board.value) {
    return []
  }

  return Array.isArray(board.value.archivedLists) ? board.value.archivedLists : []
})

const archivedCards = computed(() => {
  if (!board.value) {
    return []
  }

  return Array.isArray(board.value.archivedCards) ? board.value.archivedCards : []
})

const boardLabelOptions = computed(() => board.value?.labels || [])
const automationConditionOptions = computed(() => ([
  { value: 'due_within_days', label: t('boardView.ruleConditionDueWithin') },
  { value: 'checklist_completed', label: t('boardView.ruleConditionChecklistCompleted') },
  { value: 'label_includes', label: t('boardView.ruleConditionLabelIncludes') },
  { value: 'assignee_includes', label: t('boardView.ruleConditionAssigneeIncludes') }
]))
const automationActionOptions = computed(() => ([
  { value: 'append_activity', label: t('boardView.ruleActionAppendActivity') },
  { value: 'move_to_done_list', label: t('boardView.ruleActionMoveToDone') },
  { value: 'add_comment', label: t('boardView.ruleActionAddComment') }
]))
const boardAssigneeOptions = computed(() => {
  if (!board.value) {
    return []
  }

  const assignees = [...board.value.members]
  board.value.lists.forEach((list) => {
    list.cards.forEach((card) => {
      card.assignees.forEach((assignee) => {
        assignees.push(assignee)
      })
    })
  })

  return assignees
    .map((item) => String(item || '').trim())
    .filter((item, index, source) => item && source.indexOf(item) === index)
})

const hasCardFilters = computed(() => {
  return Boolean(
    cardFilters.keyword.trim()
      || cardFilters.labelId !== 'all'
      || cardFilters.assignee !== 'all'
      || cardFilters.dueState !== 'all'
  )
})
const currentViewModeLabel = computed(() => {
  if (activeViewMode.value === 'calendar') {
    return t('boardView.modeCalendar')
  }

  if (activeViewMode.value === 'timeline') {
    return t('boardView.modeTimeline')
  }

  return t('boardView.modeKanban')
})

const boardForView = computed(() => {
  if (!board.value) {
    return null
  }

  if (!hasCardFilters.value) {
    return board.value
  }

  return {
    ...board.value,
    lists: board.value.lists.map((list) => ({
      ...list,
      cards: list.cards.filter((card) => isCardMatchFilters(card, list))
    }))
  }
})

const calendarBuckets = computed(() => {
  if (!boardForView.value) {
    return []
  }

  const bucketMap = new Map()

  boardForView.value.lists.forEach((list) => {
    list.cards.forEach((card) => {
      const bucketKey = card.dueDate || 'no-date'
      if (!bucketMap.has(bucketKey)) {
        bucketMap.set(bucketKey, [])
      }

      bucketMap.get(bucketKey).push({
        ...card,
        listId: list.id,
        listTitle: list.title
      })
    })
  })

  return Array.from(bucketMap.entries())
    .sort(([aKey], [bKey]) => {
      if (aKey === 'no-date') {
        return 1
      }

      if (bKey === 'no-date') {
        return -1
      }

      return new Date(aKey).getTime() - new Date(bKey).getTime()
    })
    .map(([key, cards]) => ({
      key,
      title: key === 'no-date'
        ? t('boardView.calendarNoDue')
        : formatDate(key),
      cards
    }))
})

const timelineData = computed(() => {
  if (!boardForView.value) {
    return {
      items: [],
      rangeLabel: ''
    }
  }

  const withDueDate = []
  boardForView.value.lists.forEach((list) => {
    list.cards.forEach((card) => {
      if (!card.dueDate) {
        return
      }

      const startDate = parseDateStart(card.createdAt) || parseDateStart(card.dueDate)
      const endDate = parseDateStart(card.dueDate)
      if (!startDate || !endDate) {
        return
      }

      const normalizedStart = startDate.getTime() > endDate.getTime() ? endDate : startDate
      withDueDate.push({
        ...card,
        listId: list.id,
        listTitle: list.title,
        startDate: normalizedStart,
        endDate
      })
    })
  })

  if (!withDueDate.length) {
    return {
      items: [],
      rangeLabel: ''
    }
  }

  const minStart = withDueDate.reduce((min, item) => item.startDate.getTime() < min.getTime() ? item.startDate : min, withDueDate[0].startDate)
  const maxEnd = withDueDate.reduce((max, item) => item.endDate.getTime() > max.getTime() ? item.endDate : max, withDueDate[0].endDate)
  const spanDays = Math.max(1, Math.floor((maxEnd.getTime() - minStart.getTime()) / 86400000) + 1)

  const items = withDueDate
    .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
    .map((item) => {
      const startOffset = Math.floor((item.startDate.getTime() - minStart.getTime()) / 86400000)
      const endOffset = Math.floor((item.endDate.getTime() - minStart.getTime()) / 86400000)
      const widthDays = Math.max(1, endOffset - startOffset + 1)

      return {
        ...item,
        leftPercent: Math.max(0, Math.min(100, (startOffset / spanDays) * 100)),
        widthPercent: Math.max(4, Math.min(100, (widthDays / spanDays) * 100))
      }
    })

  return {
    items,
    rangeLabel: `${formatDate(minStart)} - ${formatDate(maxEnd)}`
  }
})

onMounted(() => {
  if (!userStore.isAuthenticated) {
    router.replace({ name: 'login' })
    return
  }

  boardStore.init()
  hydrateBoardStars()
  syncBoardByRoute(route.params.id)
})

watch(
  () => route.params.id,
  (boardId) => {
    syncBoardByRoute(boardId)
  }
)

watch(
  () => [route.query.listId, route.query.cardId, board.value?.id],
  () => {
    nextTick(() => {
      openCardFromRouteQuery()
    })
  }
)

watch(
  () => [board.value?.id, JSON.stringify(board.value?.automation || {}), JSON.stringify(board.value?.integrations || {})],
  () => {
    syncBoardSettingsDraft()
  },
  { immediate: true }
)

watch(
  () => board.value?.id,
  () => {
    syncBoardTitleDraft()
    syncBoardShareState()
  },
  { immediate: true }
)

watch(
  () => board.value?.title,
  () => {
    syncBoardTitleDraft()
  }
)

watch(selectedCard, (card) => {
  if (!card) {
    detailVisible.value = false
  }
})

function syncBoardByRoute(boardId) {
  const targetId = String(boardId || '')
  const targetBoard = boardStore.findBoard(targetId)

  if (targetBoard) {
    if (!boardStore.canAccessBoard(targetBoard, viewerAccess.value)) {
      ElMessage.warning(t('boardView.boardForbidden'))
      router.replace({ name: 'workspace' })
      return
    }

    boardStore.setCurrentBoard(targetId)
    ensureFeedbackBoardPreset(targetId)
    nextTick(() => {
      openCardFromRouteQuery()
    })
    return
  }

  if (boardStore.currentBoard) {
    router.replace({
      name: 'board',
      params: { id: boardStore.currentBoard.id }
    })
    return
  }

  router.replace({ name: 'workspace' })
}

function syncBoardSettingsDraft() {
  if (!board.value) {
    return
  }

  const automation = board.value.automation || {}
  const rules = Array.isArray(automation.rules) ? automation.rules : []
  automationRules.value = rules.map((rule, index) => createAutomationRuleDraft(rule, index))

  const integrations = board.value.integrations || {}
  integrationDraft.slackConnected = Boolean(integrations?.slack?.connected)
  integrationDraft.slackChannel = String(integrations?.slack?.channel || '')
  integrationDraft.driveConnected = Boolean(integrations?.googleDrive?.connected)
  integrationDraft.driveFolder = String(integrations?.googleDrive?.folder || '')
  integrationDraft.githubConnected = Boolean(integrations?.github?.connected)
  integrationDraft.githubRepository = String(integrations?.github?.repository || '')
  integrationDraft.webhookEnabled = Boolean(integrations?.webhook?.enabled)
  integrationDraft.webhookUrl = String(integrations?.webhook?.url || '')
}

function ensureFeedbackBoardPreset(boardId) {
  const targetBoard = boardStore.findBoard(boardId)
  if (!targetBoard || targetBoard.lists.length || (Array.isArray(targetBoard.archivedLists) && targetBoard.archivedLists.length)) {
    return
  }

  const labelIdMap = {}
  FEEDBACK_PRESET_LABELS.forEach((labelDef) => {
    const existing = targetBoard.labels.find((label) => {
      return String(label.name || '').trim().toLowerCase() === labelDef.name.toLowerCase()
    })

    if (existing) {
      labelIdMap[labelDef.key] = existing.id
      return
    }

    const created = boardStore.addLabel(targetBoard.id, {
      name: labelDef.name,
      color: labelDef.color
    })

    if (created?.id) {
      labelIdMap[labelDef.key] = created.id
    }
  })

  FEEDBACK_PRESET_LISTS.forEach((listDef) => {
    const nextList = boardStore.addList(targetBoard.id, listDef.title)
    if (!nextList) {
      return
    }

    listDef.cards.forEach((cardDef) => {
      const labelIds = Array.isArray(cardDef.labelKeys)
        ? cardDef.labelKeys.map((key) => labelIdMap[key]).filter(Boolean)
        : []

      boardStore.addCard(targetBoard.id, nextList.id, {
        title: cardDef.title,
        description: cardDef.description,
        labelIds
      })
    })
  })
}

function goHome() {
  router.push({ name: 'workspace' })
}

function visibilityLabel(visibility) {
  if (visibility === 'private') {
    return t('boardHome.visibilityPrivate')
  }

  if (visibility === 'public') {
    return t('boardHome.visibilityPublic')
  }

  return t('boardHome.visibilityWorkspace')
}

function normalizeShareRole(role) {
  if (role === 'admin' || role === 'observer') {
    return role
  }

  return 'member'
}

function normalizeSharePermission(permission) {
  if (permission === 'view' || permission === 'comment') {
    return permission
  }

  return 'edit'
}

function buildShareUsername(name, email, index = 0) {
  const fromEmail = String(email || '').trim().toLowerCase()
  if (fromEmail.includes('@')) {
    return fromEmail.split('@')[0]
  }

  const fromName = String(name || '').trim().toLowerCase().replace(/\s+/g, '-')
  if (fromName) {
    return fromName
  }

  return `member-${index + 1}`
}

function createShareMemberDraft(source = {}, index = 0) {
  const name = String(source?.name || '').trim() || t('accountMenu.nameFallback')
  const email = String(source?.email || '').trim()

  return {
    id: String(source?.id || createId('member')).trim() || createId('member'),
    name,
    email,
    username: String(source?.username || buildShareUsername(name, email, index)).replace(/^@/, '').trim() || buildShareUsername(name, email, index),
    role: normalizeShareRole(source?.role)
  }
}

function createShareRequestDraft(source = {}, index = 0) {
  const name = String(source?.name || '').trim() || `Request ${index + 1}`
  const email = String(source?.email || '').trim()

  return {
    id: String(source?.id || createId('request')).trim() || createId('request'),
    name,
    email,
    username: String(source?.username || buildShareUsername(name, email, index)).replace(/^@/, '').trim() || buildShareUsername(name, email, index)
  }
}

function normalizeShareMembers(rawMembers) {
  if (!Array.isArray(rawMembers)) {
    return []
  }

  const seen = new Set()
  const normalized = rawMembers
    .map((item, index) => createShareMemberDraft(item, index))
    .filter((item) => {
      const identity = item.email
        ? `email:${item.email.toLowerCase()}`
        : `name:${item.name.toLowerCase()}`
      if (seen.has(identity)) {
        return false
      }

      seen.add(identity)
      return true
    })

  if (normalized.length && !normalized.some((item) => item.role === 'admin')) {
    normalized[0].role = 'admin'
  }

  return normalized
}

function normalizeShareRequests(rawRequests) {
  if (!Array.isArray(rawRequests)) {
    return []
  }

  return rawRequests.map((item, index) => createShareRequestDraft(item, index))
}

function loadBoardShareStateMap() {
  const raw = loadFromStorage(BOARD_SHARE_STATE_KEY, {})
  return raw && typeof raw === 'object' ? raw : {}
}

function createDefaultShareMembers() {
  if (!board.value) {
    return []
  }

  const seed = []
  if (currentUserName.value) {
    seed.push({
      name: currentUserName.value,
      email: currentUserEmail.value,
      role: 'admin'
    })
  }

  board.value.members.forEach((memberName, index) => {
    seed.push({
      name: memberName,
      role: index === 0 ? 'admin' : 'member'
    })
  })

  return normalizeShareMembers(seed)
}

function areSameStringLists(source = [], target = []) {
  if (source.length !== target.length) {
    return false
  }

  return source.every((item, index) => item === target[index])
}

function sanitizeBoardStarIds(rawIds) {
  if (!Array.isArray(rawIds)) {
    return []
  }

  const validBoardIds = new Set((boardStore.boards || []).map((item) => item.id))
  return rawIds
    .map((id) => String(id || '').trim())
    .filter((id, index, list) => id && validBoardIds.has(id) && list.indexOf(id) === index)
    .slice(0, HOME_RECENT_STAR_LIMIT)
}

function hydrateBoardStars() {
  const loaded = loadFromStorage(HOME_RECENT_STARS_KEY, [])
  starredBoardIds.value = sanitizeBoardStarIds(loaded)
}

function persistBoardStars() {
  saveToStorage(HOME_RECENT_STARS_KEY, starredBoardIds.value)
}

function toggleCurrentBoardStar() {
  const boardId = String(board.value?.id || '').trim()
  if (!boardId) {
    return
  }

  if (isCurrentBoardStarred.value) {
    starredBoardIds.value = starredBoardIds.value.filter((id) => id !== boardId)
    ElMessage.success(t('workspaceHome.recentUnstarredHint'))
  } else {
    starredBoardIds.value = [boardId, ...starredBoardIds.value.filter((id) => id !== boardId)]
      .slice(0, HOME_RECENT_STAR_LIMIT)
    ElMessage.success(t('workspaceHome.recentStarredHint'))
  }

  persistBoardStars()
}

function syncBoardTitleDraft() {
  if (!board.value) {
    boardTitleDraft.value = ''
    editingBoardTitle.value = false
    return
  }

  if (!editingBoardTitle.value) {
    boardTitleDraft.value = board.value.title || ''
  }
}

function startBoardTitleEdit() {
  if (!board.value) {
    return
  }

  boardTitleDraft.value = board.value.title || ''
  editingBoardTitle.value = true

  nextTick(() => {
    boardTitleInputRef.value?.focus?.()
    boardTitleInputRef.value?.select?.()
  })
}

function saveBoardTitle() {
  if (!board.value || !editingBoardTitle.value) {
    return
  }

  const nextTitle = boardTitleDraft.value.trim() || t('boardView.untitledBoard')
  editingBoardTitle.value = false

  if (nextTitle === board.value.title) {
    boardTitleDraft.value = nextTitle
    return
  }

  boardStore.updateBoard(board.value.id, {
    title: nextTitle
  })
  boardTitleDraft.value = nextTitle
  ElMessage.success(t('boardView.boardRenamed'))
}

function cancelBoardTitleEdit() {
  editingBoardTitle.value = false
  boardTitleDraft.value = board.value?.title || ''
}

function handleBoardMenuCommand(command) {
  if (command === 'rename') {
    startBoardTitleEdit()
    return
  }

  if (command === 'share') {
    openShareDialog()
    return
  }

  if (command === 'advanced') {
    toggleAdvancedPanel()
  }
}

function syncBoardShareState() {
  if (!board.value) {
    shareMembers.value = []
    shareJoinRequests.value = []
    return
  }

  const stateMap = loadBoardShareStateMap()
  const boardState = stateMap[board.value.id] || {}

  const defaultMembers = createDefaultShareMembers()
  shareMembers.value = normalizeShareMembers(
    Array.isArray(boardState.members) && boardState.members.length
      ? boardState.members
      : defaultMembers
  )
  shareJoinRequests.value = normalizeShareRequests(boardState.joinRequests)
  shareLinkDraft.enabled = Boolean(boardState.link?.enabled)
  shareLinkDraft.token = String(boardState.link?.token || '').trim()
  shareLinkDraft.permission = normalizeSharePermission(boardState.link?.permission)
  shareInviteForm.query = ''
  shareInviteForm.role = 'member'
  sharePanelTab.value = 'members'

  persistShareState()
}

function persistShareState(options = {}) {
  if (!board.value) {
    return
  }

  const syncBoardMembers = options.syncBoardMembers !== false
  const stateMap = loadBoardShareStateMap()
  stateMap[board.value.id] = {
    members: shareMembers.value.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      username: member.username,
      role: normalizeShareRole(member.role)
    })),
    joinRequests: shareJoinRequests.value.map((request) => ({
      id: request.id,
      name: request.name,
      email: request.email,
      username: request.username
    })),
    link: {
      enabled: Boolean(shareLinkDraft.enabled),
      token: String(shareLinkDraft.token || '').trim(),
      permission: normalizeSharePermission(shareLinkDraft.permission)
    }
  }

  saveToStorage(BOARD_SHARE_STATE_KEY, stateMap)

  if (!syncBoardMembers) {
    return
  }

  const nextMemberNames = shareMembers.value
    .map((item) => String(item.name || '').trim())
    .filter((item, index, source) => item && source.indexOf(item) === index)
  const currentMemberNames = Array.isArray(board.value.members)
    ? board.value.members.map((item) => String(item || '').trim()).filter(Boolean)
    : []

  if (!areSameStringLists(nextMemberNames, currentMemberNames)) {
    boardStore.updateBoard(board.value.id, {
      members: nextMemberNames
    })
  }
}

function openShareDialog() {
  syncBoardShareState()
  shareDialogVisible.value = true
}

function inviteShareMember() {
  if (!board.value) {
    return
  }

  const rawInput = String(shareInviteForm.query || '').trim()
  if (!rawInput) {
    ElMessage.warning(t('boardView.shareInviteRequired'))
    return
  }

  const isEmailInput = rawInput.includes('@')
  const nextEmail = isEmailInput ? rawInput.toLowerCase() : ''
  const nextName = isEmailInput
    ? rawInput.split('@')[0]
    : rawInput

  const exists = shareMembers.value.some((item) => {
    const sameEmail = nextEmail && String(item.email || '').trim().toLowerCase() === nextEmail
    const sameName = String(item.name || '').trim().toLowerCase() === nextName.trim().toLowerCase()
    return sameEmail || sameName
  })
  if (exists) {
    ElMessage.warning(t('boardView.shareMemberExists'))
    return
  }

  shareMembers.value.push(createShareMemberDraft({
    name: nextName,
    email: nextEmail,
    role: normalizeShareRole(shareInviteForm.role)
  }, shareMembers.value.length))

  shareInviteForm.query = ''
  shareInviteForm.role = 'member'
  persistShareState()
  ElMessage.success(t('boardView.shareInviteSent'))
}

function createShareLink() {
  if (!shareLinkDraft.token) {
    shareLinkDraft.token = createId('share').replace('share-', '').slice(0, 12)
  }

  shareLinkDraft.enabled = true
  persistShareState({ syncBoardMembers: false })
  ElMessage.success(t('boardView.shareLinkCreated'))
}

async function copyShareLink() {
  if (!shareLinkDraft.enabled) {
    createShareLink()
  }

  if (!shareLinkUrl.value) {
    return
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareLinkUrl.value)
    }
  } catch {
    // ignore clipboard errors
  }

  ElMessage.success(t('boardView.shareLinkCopied'))
}

function onShareMemberRoleChange(member) {
  const target = shareMembers.value.find((item) => item.id === member.id)
  if (!target) {
    return
  }

  target.role = normalizeShareRole(member.role)
  persistShareState({ syncBoardMembers: false })
}

function approveJoinRequest(requestId) {
  const targetIndex = shareJoinRequests.value.findIndex((item) => item.id === requestId)
  if (targetIndex < 0) {
    return
  }

  const [request] = shareJoinRequests.value.splice(targetIndex, 1)
  shareMembers.value.push(createShareMemberDraft({
    name: request.name,
    email: request.email,
    username: request.username,
    role: 'member'
  }, shareMembers.value.length))

  persistShareState()
  ElMessage.success(t('boardView.shareRequestApproved'))
}

function rejectJoinRequest(requestId) {
  shareJoinRequests.value = shareJoinRequests.value.filter((item) => item.id !== requestId)
  persistShareState({ syncBoardMembers: false })
  ElMessage.success(t('boardView.shareRequestRejected'))
}

function persistBoard() {
  boardStore.touch()
}

function toggleAdvancedPanel() {
  advancedPanelVisible.value = !advancedPanelVisible.value
}

function toggleSearchPanel() {
  searchPanelVisible.value = !searchPanelVisible.value
}

function openArchivePanel() {
  archiveDialogVisible.value = true
  if (archiveDialogTab.value !== 'lists' && archiveDialogTab.value !== 'cards') {
    archiveDialogTab.value = 'lists'
  }
}

function restoreArchivedList(listId) {
  if (!board.value) {
    return
  }

  const restored = boardStore.restoreArchivedList(board.value.id, listId)
  if (restored) {
    ElMessage.success(t('boardView.archiveRestoreSuccess'))
  }
}

function restoreArchivedCard(cardId) {
  if (!board.value) {
    return
  }

  const restored = boardStore.restoreArchivedCard(board.value.id, cardId)
  if (!restored) {
    return
  }

  ElMessage.success(t('boardView.archiveCardRestoreSuccess'))
}

async function deleteArchivedCard(cardId) {
  if (!board.value) {
    return
  }

  const entry = archivedCards.value.find((item) => item.id === cardId)
  const title = entry?.card?.title || ''

  try {
    await ElMessageBox.confirm(
      t('boardView.archiveCardDeleteConfirmContent', { title }),
      t('boardView.archiveCardDeleteConfirmTitle'),
      {
        type: 'warning',
        confirmButtonText: t('boardView.archiveDeleteConfirm'),
        cancelButtonText: t('common.cancel')
      }
    )
  } catch {
    return
  }

  const ok = boardStore.deleteArchivedCard(board.value.id, cardId)
  if (!ok) {
    return
  }

  ElMessage.success(t('boardView.archiveCardDeleteSuccess'))
}

async function deleteArchivedList(listId) {
  if (!board.value) {
    return
  }

  const target = archivedLists.value.find((item) => item.id === listId)
  if (!target) {
    return
  }

  await ElMessageBox.confirm(
    t('boardView.archiveDeleteConfirmContent', { title: target.title }),
    t('boardView.archiveDeleteConfirmTitle'),
    {
      type: 'warning',
      confirmButtonText: t('boardView.archiveDeleteConfirm'),
      cancelButtonText: t('common.cancel')
    }
  )

  const deleted = boardStore.deleteArchivedList(board.value.id, listId)
  if (deleted) {
    ElMessage.success(t('boardView.archiveDeleteSuccess'))
  }
}

function cycleViewMode() {
  const modeOrder = ['kanban', 'calendar', 'timeline']
  const currentIndex = modeOrder.indexOf(activeViewMode.value)
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % modeOrder.length
  activeViewMode.value = modeOrder[nextIndex]
}

function isCardMatchFilters(card, list) {
  const keyword = cardFilters.keyword.trim().toLowerCase()
  const labelMatched = cardFilters.labelId === 'all' || card.labelIds.includes(cardFilters.labelId)
  const assigneeMatched = cardFilters.assignee === 'all' || card.assignees.includes(cardFilters.assignee)
  const dueMatched = isCardDueStateMatch(card, cardFilters.dueState)

  if (!labelMatched || !assigneeMatched || !dueMatched) {
    return false
  }

  if (!keyword) {
    return true
  }

  const commentText = Array.isArray(card.comments) ? card.comments.map((item) => item.content).join(' ') : ''
  const checklistText = Array.isArray(card.checklist) ? card.checklist.map((item) => item.text).join(' ') : ''
  const searchText = [card.title, card.description, list.title, commentText, checklistText, card.assignees.join(' ')]
    .join(' ')
    .toLowerCase()

  return searchText.includes(keyword)
}

function isCardDueStateMatch(card, dueState) {
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

function parseDateStart(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  parsed.setHours(0, 0, 0, 0)
  return parsed
}

function formatDate(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '--'
  }

  return parsed.toLocaleDateString(userStore.locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function resetCardFilters() {
  cardFilters.keyword = ''
  cardFilters.labelId = 'all'
  cardFilters.assignee = 'all'
  cardFilters.dueState = 'all'
}

function createAutomationRuleDraft(source = {}, index = 0) {
  const conditionType = ['due_within_days', 'checklist_completed', 'label_includes', 'assignee_includes'].includes(source?.condition?.type)
    ? source.condition.type
    : 'due_within_days'
  const actionType = ['append_activity', 'move_to_done_list', 'add_comment'].includes(source?.action?.type)
    ? source.action.type
    : 'append_activity'

  return {
    id: String(source.id || createId('rule')).trim() || createId('rule'),
    name: String(source.name || t('boardView.ruleDefaultName', { index: index + 1 })).trim()
      || t('boardView.ruleDefaultName', { index: index + 1 }),
    enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    condition: {
      type: conditionType,
      days: Number.isFinite(Number(source?.condition?.days)) ? Number(source.condition.days) : 1,
      labelId: String(source?.condition?.labelId || '').trim(),
      assignee: String(source?.condition?.assignee || '').trim()
    },
    action: {
      type: actionType,
      message: String(source?.action?.message || '').trim(),
      doneListKeywordsText: Array.isArray(source?.action?.doneListKeywords)
        ? source.action.doneListKeywords.join(', ')
        : 'done, 已完成',
      comment: String(source?.action?.comment || '').trim()
    }
  }
}

function addAutomationRule() {
  automationRules.value.push(createAutomationRuleDraft({}, automationRules.value.length))
}

function removeAutomationRule(ruleId) {
  automationRules.value = automationRules.value.filter((rule) => rule.id !== ruleId)
}

function reorderAutomationRules(sourceRuleId, targetRuleId) {
  const sourceId = String(sourceRuleId || '').trim()
  const targetId = String(targetRuleId || '').trim()

  if (!sourceId || !targetId || sourceId === targetId) {
    return
  }

  const next = [...automationRules.value]
  const sourceIndex = next.findIndex((item) => item.id === sourceId)
  const targetIndex = next.findIndex((item) => item.id === targetId)
  if (sourceIndex < 0 || targetIndex < 0) {
    return
  }

  const [sourceItem] = next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, sourceItem)
  automationRules.value = next
}

function onRuleDragStart(ruleId, event) {
  const dragId = String(ruleId || '').trim()
  if (!dragId) {
    return
  }

  draggingRuleId.value = dragId
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', dragId)
  }
}

function onRuleDragOver(ruleId, event) {
  const targetId = String(ruleId || '').trim()
  if (!draggingRuleId.value || !targetId || draggingRuleId.value === targetId) {
    return
  }

  event.preventDefault()
  if (event?.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onRuleDrop(ruleId, event) {
  const targetId = String(ruleId || '').trim()
  const sourceFromEvent = String(event?.dataTransfer?.getData('text/plain') || '').trim()
  const sourceId = draggingRuleId.value || sourceFromEvent

  event.preventDefault()
  reorderAutomationRules(sourceId, targetId)
  draggingRuleId.value = ''
}

function onRuleDragEnd() {
  draggingRuleId.value = ''
}

function onRuleConditionTypeChange(rule) {
  const conditionType = String(rule?.condition?.type || '')
  if (conditionType === 'due_within_days') {
    rule.condition.days = Number.isFinite(Number(rule.condition.days)) ? Number(rule.condition.days) : 1
    return
  }

  if (conditionType === 'label_includes') {
    rule.condition.labelId = String(rule.condition.labelId || '').trim()
    return
  }

  if (conditionType === 'assignee_includes') {
    rule.condition.assignee = String(rule.condition.assignee || '').trim()
  }
}

function onRuleActionTypeChange(rule) {
  const actionType = String(rule?.action?.type || '')
  if (actionType === 'append_activity') {
    rule.action.message = String(rule.action.message || '').trim()
    return
  }

  if (actionType === 'move_to_done_list') {
    rule.action.doneListKeywordsText = String(rule.action.doneListKeywordsText || 'done, 已完成').trim()
    return
  }

  if (actionType === 'add_comment') {
    rule.action.comment = String(rule.action.comment || '').trim()
  }
}

function normalizeRuleKeywordsFromText(textValue) {
  return String(textValue || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item, index, source) => item && source.indexOf(item) === index)
}

function toAutomationRulePayload(rule = {}, index = 0) {
  const conditionType = String(rule?.condition?.type || 'due_within_days')
  const actionType = String(rule?.action?.type || 'append_activity')

  const conditionPayload = {
    type: conditionType
  }

  if (conditionType === 'due_within_days') {
    conditionPayload.days = Number.isFinite(Number(rule?.condition?.days))
      ? Math.max(0, Math.min(30, Math.floor(Number(rule.condition.days))))
      : 1
  }

  if (conditionType === 'label_includes') {
    conditionPayload.labelId = String(rule?.condition?.labelId || '').trim()
  }

  if (conditionType === 'assignee_includes') {
    conditionPayload.assignee = String(rule?.condition?.assignee || '').trim()
  }

  const actionPayload = {
    type: actionType
  }

  if (actionType === 'append_activity') {
    actionPayload.message = String(rule?.action?.message || '').trim() || t('boardView.ruleDefaultActivityMessage')
  }

  if (actionType === 'move_to_done_list') {
    const doneListKeywords = normalizeRuleKeywordsFromText(rule?.action?.doneListKeywordsText)
    actionPayload.doneListKeywords = doneListKeywords.length ? doneListKeywords : ['done', '已完成']
  }

  if (actionType === 'add_comment') {
    actionPayload.comment = String(rule?.action?.comment || '').trim()
  }

  return {
    id: String(rule.id || createId('rule')).trim() || createId('rule'),
    name: String(rule.name || t('boardView.ruleDefaultName', { index: index + 1 })).trim()
      || t('boardView.ruleDefaultName', { index: index + 1 }),
    enabled: typeof rule.enabled === 'boolean' ? rule.enabled : true,
    condition: conditionPayload,
    action: actionPayload
  }
}

function buildAutomationRulesPayload() {
  return automationRules.value.map((rule, index) => toAutomationRulePayload(rule, index))
}

function persistAutomationRules() {
  if (!board.value) {
    return []
  }

  const nextRules = buildAutomationRulesPayload()
  boardStore.updateBoard(board.value.id, {
    automation: {
      rules: nextRules
    }
  })

  return nextRules
}

function openCardFromRouteQuery() {
  if (!board.value) {
    return
  }

  const listId = String(route.query.listId || '').trim()
  const cardId = String(route.query.cardId || '').trim()
  if (!listId || !cardId) {
    return
  }

  const targetCard = boardStore.getCard(board.value.id, listId, cardId)
  if (!targetCard) {
    return
  }

  cardStore.openCard({
    boardId: board.value.id,
    listId,
    cardId
  })
  detailVisible.value = true
}

function setCardRouteQuery(listId, cardId) {
  if (!board.value) {
    return
  }

  router.replace({
    name: 'board',
    params: {
      id: board.value.id
    },
    query: {
      ...route.query,
      listId,
      cardId
    }
  })
}

function clearCardRouteQuery() {
  if (!board.value) {
    return
  }

  const nextQuery = {
    ...route.query
  }
  delete nextQuery.listId
  delete nextQuery.cardId

  router.replace({
    name: 'board',
    params: {
      id: board.value.id
    },
    query: nextQuery
  })
}

function openCard(payload) {
  if (!board.value) {
    return
  }

  cardStore.openCard({
    boardId: board.value.id,
    listId: payload.listId,
    cardId: payload.cardId
  })

  detailVisible.value = true
  setCardRouteQuery(payload.listId, payload.cardId)
}

function openCardFromTimeline(item) {
  openCard({
    listId: item.listId,
    cardId: item.id
  })
}

function onDetailVisibleChange(value) {
  detailVisible.value = value

  if (!value) {
    cardStore.closeCard()
    clearCardRouteQuery()
  }
}

function saveCard(payload) {
  cardStore.updateSelectedCard(payload)
}

function archiveCard() {
  cardStore.archiveSelectedCard()
  detailVisible.value = false
  clearCardRouteQuery()
  ElMessage.success(t('boardView.cardArchived'))
}

function getSelectedPointer() {
  return cardStore.selected
}

function setCardAssignees(assignees) {
  const selected = getSelectedPointer()
  if (!selected) {
    return
  }

  boardStore.setCardAssignees(selected.boardId, selected.listId, selected.cardId, assignees)
}

function addChecklistItem(text) {
  const selected = getSelectedPointer()
  if (!selected) {
    return
  }

  boardStore.addChecklistItem(selected.boardId, selected.listId, selected.cardId, text)
}

function toggleChecklistItem(payload) {
  const selected = getSelectedPointer()
  if (!selected) {
    return
  }

  boardStore.toggleChecklistItem(selected.boardId, selected.listId, selected.cardId, payload.itemId, payload.done)
}

function removeChecklistItem(checklistItemId) {
  const selected = getSelectedPointer()
  if (!selected) {
    return
  }

  boardStore.removeChecklistItem(selected.boardId, selected.listId, selected.cardId, checklistItemId)
}

function addCardComment(payload) {
  const selected = getSelectedPointer()
  if (!selected) {
    return
  }

  boardStore.addCardComment(selected.boardId, selected.listId, selected.cardId, payload)
}

async function uploadAttachment(rawFile) {
  const selected = cardStore.selected
  if (!selected) {
    return
  }

  const dataUrl = await fileToDataUrl(rawFile)
  boardStore.addAttachment(selected.boardId, selected.listId, selected.cardId, {
    name: rawFile.name,
    url: dataUrl,
    type: rawFile.type,
    size: rawFile.size
  })

  ElMessage.success(t('boardView.attachmentUploaded'))
}

function saveBoardInfo(payload) {
  if (!board.value) {
    return
  }

  boardStore.updateBoard(board.value.id, payload)
  ElMessage.success(t('boardView.boardUpdated'))
}

function addLabel(payload) {
  if (!board.value) {
    return
  }

  boardStore.addLabel(board.value.id, payload)
  ElMessage.success(t('boardView.labelAdded'))
}

function removeLabel(labelId) {
  if (!board.value) {
    return
  }

  boardStore.removeLabel(board.value.id, labelId)
  ElMessage.success(t('boardView.labelRemoved'))
}

function saveAutomationSettings() {
  if (!board.value) {
    return
  }

  persistAutomationRules()

  const { updatedCardCount } = boardStore.runAutomation(board.value.id)
  ElMessage.success(t('boardView.automationSaved', { count: updatedCardCount }))
}

function runSingleAutomationRule(rule) {
  if (!board.value || !rule) {
    return
  }

  persistAutomationRules()
  const { updatedCardCount } = boardStore.runAutomationRule(board.value.id, rule.id)
  ElMessage.success(t('boardView.automationSingleRuleRunResult', {
    name: rule.name || t('boardView.ruleDefaultName', { index: 1 }),
    count: updatedCardCount
  }))
}

function runAutomationNow() {
  if (!board.value) {
    return
  }

  const { updatedCardCount } = boardStore.runAutomation(board.value.id)
  ElMessage.success(t('boardView.automationRunResult', { count: updatedCardCount }))
}

function saveIntegrationSettings() {
  if (!board.value) {
    return
  }

  boardStore.updateBoard(board.value.id, {
    integrations: {
      slack: {
        connected: integrationDraft.slackConnected,
        channel: integrationDraft.slackChannel
      },
      googleDrive: {
        connected: integrationDraft.driveConnected,
        folder: integrationDraft.driveFolder
      },
      github: {
        connected: integrationDraft.githubConnected,
        repository: integrationDraft.githubRepository
      },
      webhook: {
        enabled: integrationDraft.webhookEnabled,
        url: integrationDraft.webhookUrl
      }
    }
  })

  ElMessage.success(t('boardView.integrationsSaved'))
}
</script>

<style scoped>
.board-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: calc(100vh - 64px);
  padding: 16px 18px 68px;
  color: #ffffff;
}

.board-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.board-title-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.board-title-input {
  width: min(52vw, 560px);
}

.board-title-input :deep(.el-input__wrapper) {
  min-height: 38px;
  border-radius: 8px;
  background: rgba(16, 12, 32, 0.28);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.52);
}

.board-title-input :deep(.el-input__inner) {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
}

.board-title-trigger {
  min-height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 8px;
  background: rgba(16, 12, 32, 0.24);
  color: #ffffff;
  padding: 0 12px;
  font-size: 18px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.board-title-trigger span {
  max-width: min(52vw, 560px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-title-trigger:hover,
.board-title-more:hover {
  background: rgba(16, 12, 32, 0.34);
}

.board-favorite-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 8px;
  background: rgba(16, 12, 32, 0.24);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.board-favorite-btn:hover {
  background: rgba(16, 12, 32, 0.34);
}

.board-favorite-btn.active {
  color: #f8d046;
}

.board-title-more {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 8px;
  background: rgba(16, 12, 32, 0.24);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.board-title-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.board-share-btn {
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 8px;
  min-height: 36px;
  background: rgba(16, 12, 32, 0.24);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  padding: 0 12px;
  cursor: pointer;
}

.board-share-btn:hover {
  background: rgba(16, 12, 32, 0.34);
}

.board-visibility-chip {
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 700;
}

.board-visibility-chip.workspace {
  background: rgba(229, 238, 252, 0.88);
  color: #1c4c88;
}

.board-visibility-chip.private {
  background: rgba(255, 225, 228, 0.92);
  color: #962936;
}

.board-visibility-chip.public {
  background: rgba(231, 246, 236, 0.94);
  color: #1f7d4b;
}

.board-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  font-size: 14px;
}

.stat-pill {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(16, 12, 32, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.32);
  color: #f8f9ff;
  font-size: 12px;
}

.board-filter-panel {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  background: rgba(16, 12, 32, 0.26);
  border: 1px solid rgba(255, 255, 255, 0.34);
  backdrop-filter: blur(3px);
}

.filter-control {
  min-width: 0;
}

.filter-reset-btn {
  justify-self: flex-end;
}

.board-filter-panel :deep(.el-input__wrapper),
.board-filter-panel :deep(.el-select__wrapper) {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
}

.board-canvas {
  min-height: 0;
  background: rgba(12, 10, 30, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 14px;
  padding: 12px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 18px 36px rgba(16, 11, 36, 0.18);
  overflow: hidden;
}

.calendar-view {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.calendar-day {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #dfe7f2;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 190px;
}

.calendar-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.calendar-day-header h3 {
  margin: 0;
  font-size: 14px;
  color: #1f334f;
}

.calendar-day-header span {
  color: #607595;
  font-size: 12px;
}

.calendar-day-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calendar-card {
  border: 1px solid #dce5f2;
  border-radius: 10px;
  background: #f8fbff;
  color: #2b4465;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  text-align: left;
  padding: 10px;
  cursor: pointer;
}

.calendar-card strong {
  font-size: 13px;
  line-height: 1.35;
}

.calendar-card span {
  font-size: 12px;
  color: #5f748f;
}

.calendar-card:hover {
  border-color: #9eb4d0;
  transform: translateY(-1px);
}

.timeline-view {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #dfe7f2;
  padding: 14px;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.timeline-header h3 {
  margin: 0;
  color: #1f334f;
  font-size: 15px;
}

.timeline-header span {
  color: #607595;
  font-size: 12px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  position: relative;
  min-height: 62px;
  border-top: 1px solid #edf2f8;
  padding-top: 8px;
}

.timeline-item:first-child {
  border-top: 0;
}

.timeline-item-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.timeline-item-meta strong {
  color: #244064;
  font-size: 13px;
}

.timeline-item-meta span {
  color: #607595;
  font-size: 12px;
}

.timeline-track {
  position: relative;
  height: 28px;
  border-radius: 999px;
  background: #edf3fb;
  overflow: hidden;
}

.timeline-bar {
  position: absolute;
  top: 2px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(120deg, #2f76d2, #5ea3e6);
  color: #ffffff;
  min-height: 24px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.timeline-empty {
  padding: 24px;
  text-align: center;
  color: #5e7390;
}

.board-ops-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ops-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  border: 1px solid #dfe7f2;
  padding: 12px;
}

.ops-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.ops-card-header h3 {
  margin: 0;
  color: #1f334f;
  font-size: 15px;
}

.automation-actions-inline {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.ops-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.automation-rule-card {
  border: 1px solid #d8e2ef;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.automation-rule-card.dragging {
  opacity: 0.68;
}

.automation-rule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.automation-rule-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 220px;
}

.automation-rule-drag-handle {
  width: 28px;
  height: 32px;
  border: 1px solid #d4deec;
  border-radius: 8px;
  background: #ffffff;
  color: #4f6784;
  font-size: 12px;
  cursor: grab;
}

.automation-rule-drag-handle:active {
  cursor: grabbing;
}

.automation-rule-head-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.automation-rule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.automation-rule-params {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.automation-rule-hint {
  margin: 0;
  color: #627895;
  font-size: 12px;
  align-self: center;
}

.automation-empty-hint {
  margin: 0;
  color: #607595;
  font-size: 12px;
}

.automation-rule-card :deep(.el-form-item) {
  margin-bottom: 0;
}

.integrations-form :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.board-bottom-toolbar {
  position: sticky;
  bottom: 10px;
  align-self: center;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px;
  border-radius: 14px;
  background: rgba(8, 8, 22, 0.66);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
}

.toolbar-btn {
  border: 0;
  min-height: 32px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.16);
  color: #f7f9ff;
  font-size: 12px;
  font-weight: 600;
  padding: 0 12px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.26);
}

.toolbar-btn.active {
  background: #ffffff;
  color: #203451;
}

:deep(.share-board-dialog .el-dialog) {
  border-radius: 14px;
  overflow: hidden;
}

:deep(.archive-dialog .el-dialog) {
  border-radius: 14px;
  overflow: hidden;
}

.archive-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.archive-dialog-header h3 {
  margin: 0;
  color: #172b4d;
  font-size: 18px;
}

.archive-dialog-close {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: #f1f4f8;
  color: #435a79;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.archive-dialog-close:hover {
  background: #e4ebf4;
}

.archive-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.archive-list-item {
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.archive-list-main {
  min-width: 0;
}

.archive-list-title {
  margin: 0;
  color: #172b4d;
  font-size: 14px;
  font-weight: 700;
}

.archive-list-meta {
  margin: 4px 0 0;
  color: #617895;
  font-size: 12px;
}

.archive-list-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.archive-empty {
  margin: 0;
  color: #617895;
  font-size: 12px;
  text-align: center;
  padding: 12px 0;
}

.share-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.share-dialog-header h3 {
  margin: 0;
  color: #172b4d;
  font-size: 18px;
}

.share-dialog-close {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: #f1f4f8;
  color: #435a79;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.share-dialog-close:hover {
  background: #e4ebf4;
}

.share-invite-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.share-invite-input :deep(.el-input__wrapper),
.share-role-select :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.share-link-section {
  border-top: 1px solid #e6ebf2;
  border-bottom: 1px solid #e6ebf2;
  padding: 12px 0;
  margin-bottom: 14px;
}

.share-link-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.share-link-title {
  margin: 0;
  color: #172b4d;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.share-link-action {
  border: 0;
  background: transparent;
  color: #0c66e4;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.share-link-enabled {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.share-link-permission {
  flex: 1;
}

.share-link-copy {
  border: 1px solid #c8d3e2;
  border-radius: 8px;
  background: #ffffff;
  color: #1f3554;
  font-size: 12px;
  font-weight: 600;
  padding: 0 10px;
  min-height: 32px;
  cursor: pointer;
}

.share-link-url {
  margin: 10px 0 0;
  color: #445774;
  font-size: 12px;
  word-break: break-all;
}

.share-members-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-tab-row {
  display: inline-flex;
  gap: 8px;
}

.share-tab-btn {
  border: 0;
  border-radius: 8px;
  background: #f1f4f8;
  color: #3c5271;
  min-height: 32px;
  font-size: 12px;
  font-weight: 600;
  padding: 0 12px;
  cursor: pointer;
}

.share-tab-btn.active {
  background: #dfe9f8;
  color: #0c66e4;
}

.share-member-list,
.share-request-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-member-item,
.share-request-item {
  border: 1px solid #e1e8f2;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.share-member-main {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.share-member-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #dbe7fb;
  color: #1f4476;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.share-member-name {
  margin: 0;
  color: #1d3350;
  font-size: 13px;
  font-weight: 600;
}

.share-member-sub {
  margin: 2px 0 0;
  color: #5f728e;
  font-size: 12px;
}

.share-request-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.share-empty {
  margin: 0;
  color: #5f728e;
  font-size: 12px;
  padding: 6px 0;
}

.board-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  background: linear-gradient(120deg, #6f38f2 0%, #d84667 100%);
}

@media (max-width: 820px) {
  .board-page {
    padding: 12px 10px 66px;
  }

  .board-title-trigger {
    font-size: 16px;
  }

  .board-title-input {
    width: 100%;
  }

  .board-title-left {
    width: 100%;
    flex-wrap: wrap;
  }

  .board-filter-panel {
    grid-template-columns: 1fr;
  }

  .filter-reset-btn {
    justify-self: flex-start;
  }

  .board-ops-grid {
    grid-template-columns: 1fr;
  }

  .automation-rule-grid,
  .automation-rule-params {
    grid-template-columns: 1fr;
  }

  .automation-rule-title-wrap {
    width: 100%;
  }

  .board-bottom-toolbar {
    width: 100%;
    justify-content: center;
  }

  .share-invite-row {
    grid-template-columns: 1fr;
  }

  .share-link-enabled {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

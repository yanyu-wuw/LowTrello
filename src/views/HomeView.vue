<template>
  <section class="workspace-home">
    <aside class="workspace-sidebar">
      <nav class="sidebar-nav">
        <button
          type="button"
          :class="['sidebar-nav-item', { active: activeSideNav === 'boards' }]"
          @click="activeSideNav = 'boards'"
        >
          <el-icon><Grid /></el-icon>
          <span>{{ t('workspaceHome.navBoards') }}</span>
        </button>
        <button
          type="button"
          :class="['sidebar-nav-item', { active: activeSideNav === 'templates' }]"
          @click="activeSideNav = 'templates'"
        >
          <el-icon><Collection /></el-icon>
          <span>{{ t('workspaceHome.navTemplates') }}</span>
        </button>
        <button
          type="button"
          :class="['sidebar-nav-item', { active: activeSideNav === 'home' }]"
          @click="activeSideNav = 'home'"
        >
          <el-icon><House /></el-icon>
          <span>{{ t('workspaceHome.navHome') }}</span>
        </button>
      </nav>

      <div class="sidebar-divider"></div>

      <div class="workspace-section">
        <p class="workspace-section-title">{{ t('workspaceHome.workspaceSection') }}</p>

        <button class="workspace-switch" type="button" @click="toggleWorkspaceManage">
          <span class="workspace-avatar">{{ workspaceAvatar }}</span>
          <span class="workspace-name">{{ workspaceName }}</span>
          <el-icon :class="['workspace-switch-caret', { expanded: workspaceManageExpanded }]" aria-hidden="true">
            <ArrowDown />
          </el-icon>
        </button>

        <div v-show="workspaceManageExpanded" class="workspace-manage-list">
          <button
            type="button"
            :class="['workspace-manage-item', { active: activeWorkspaceTab === 'boards' }]"
            @click="setWorkspaceTab('boards')"
          >
            {{ t('workspaceHome.tabBoards') }}
          </button>
          <button
            type="button"
            :class="['workspace-manage-item', { active: activeWorkspaceTab === 'members' }]"
            @click="setWorkspaceTab('members')"
          >
            {{ t('workspaceHome.tabMembers') }}
          </button>
          <button
            type="button"
            :class="['workspace-manage-item', { active: activeWorkspaceTab === 'settings' }]"
            @click="setWorkspaceTab('settings')"
          >
            {{ t('workspaceHome.tabSettings') }}
          </button>
          <button
            type="button"
            :class="['workspace-manage-item', { active: activeWorkspaceTab === 'exports' }]"
            @click="setWorkspaceTab('exports')"
          >
            {{ t('workspaceHome.tabExports') }}
          </button>
        </div>
      </div>
    </aside>

    <main class="workspace-main">
      <section v-if="showGlobalSearchPanel" class="workspace-search-panel">
        <header class="search-panel-header">
          <div>
            <h2>{{ t('workspaceHome.globalSearchTitle') }}</h2>
            <p>
              {{ t('workspaceHome.globalSearchSummary', {
                total: workspaceSearchResults.total,
                boards: workspaceSearchResults.boards.length,
                cards: workspaceSearchResults.cards.length
              }) }}
            </p>
          </div>

          <el-tag type="info" effect="plain">{{ globalSearchKeyword || t('workspaceHome.searchPlaceholder') }}</el-tag>
        </header>

        <div class="search-filter-grid">
          <el-select v-model="searchFilters.sortBy">
            <el-option value="relevance" :label="t('workspaceHome.globalSearchSortRelevance')" />
            <el-option value="recent" :label="t('workspaceHome.globalSearchSortRecent')" />
          </el-select>

          <el-select v-model="searchFilters.type">
            <el-option value="all" :label="t('workspaceHome.globalSearchTypeAll')" />
            <el-option value="boards" :label="t('workspaceHome.globalSearchTypeBoards')" />
            <el-option value="cards" :label="t('workspaceHome.globalSearchTypeCards')" />
          </el-select>

          <el-select v-model="searchFilters.visibility">
            <el-option value="all" :label="t('workspaceHome.globalSearchVisibilityAll')" />
            <el-option value="workspace" :label="t('boardHome.visibilityWorkspace')" />
            <el-option value="private" :label="t('boardHome.visibilityPrivate')" />
            <el-option value="public" :label="t('boardHome.visibilityPublic')" />
          </el-select>

          <el-select v-model="searchFilters.labelId">
            <el-option value="" :label="t('workspaceHome.globalSearchLabelAll')" />
            <el-option
              v-for="label in searchFacets.labels"
              :key="label.id"
              :value="label.id"
              :label="label.name"
            />
          </el-select>

          <el-select v-model="searchFilters.assignee">
            <el-option value="" :label="t('workspaceHome.globalSearchAssigneeAll')" />
            <el-option
              v-for="assignee in searchFacets.assignees"
              :key="assignee"
              :value="assignee"
              :label="assignee"
            />
          </el-select>

          <el-select v-model="searchFilters.dueState">
            <el-option value="all" :label="t('workspaceHome.globalSearchDueAll')" />
            <el-option value="none" :label="t('workspaceHome.globalSearchDueNone')" />
            <el-option value="overdue" :label="t('workspaceHome.globalSearchDueOverdue')" />
            <el-option value="today" :label="t('workspaceHome.globalSearchDueToday')" />
            <el-option value="next7" :label="t('workspaceHome.globalSearchDueNext7')" />
          </el-select>

          <el-button plain @click="resetSearchFilters">{{ t('workspaceHome.globalSearchReset') }}</el-button>
        </div>

        <div class="search-result-grid">
          <section class="search-result-column">
            <header class="search-result-head">
              <h3>{{ t('workspaceHome.globalSearchBoardsHeading') }}</h3>
            </header>

            <button
              v-for="item in workspaceSearchResults.boards"
              :key="`search-board-${item.boardId}`"
              type="button"
              class="search-board-item"
              @click="openSearchBoard(item.boardId)"
            >
              <strong class="search-highlight-line">
                <template v-for="(segment, segmentIndex) in getHighlightSegments(item.boardTitle)" :key="`board-title-${item.boardId}-${segmentIndex}`">
                  <mark v-if="segment.match">{{ segment.text }}</mark>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </strong>

              <span>
                {{ visibilityLabel(item.visibility) }}
                · {{ item.listCount }} {{ t('workspaceSidebar.lists') }}
                · {{ t('workspaceHome.globalSearchUpdatedMeta', { date: formatSearchUpdateDate(item.updatedAt) }) }}
              </span>

              <div v-if="showSearchScoreMetrics" class="search-metrics">
                <span class="search-score-chip">{{ t('workspaceHome.globalSearchScoreMeta', { score: item.score }) }}</span>
                <div class="search-field-chip-row">
                  <span
                    v-for="field in item.matchedFields"
                    :key="`board-field-${item.boardId}-${field}`"
                    class="search-field-chip"
                  >
                    {{ getSearchFieldLabel(field) }}
                  </span>
                </div>
              </div>

              <p v-if="item.boardDescription" class="search-snippet">
                <template v-for="(segment, segmentIndex) in getHighlightSegments(item.boardDescription)" :key="`board-desc-${item.boardId}-${segmentIndex}`">
                  <mark v-if="segment.match">{{ segment.text }}</mark>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </p>
            </button>

            <p v-if="!workspaceSearchResults.boards.length" class="search-empty">{{ t('workspaceHome.globalSearchEmptyBoards') }}</p>
          </section>

          <section class="search-result-column">
            <header class="search-result-head">
              <h3>{{ t('workspaceHome.globalSearchCardsHeading') }}</h3>
            </header>

            <button
              v-for="item in workspaceSearchResults.cards"
              :key="`search-card-${item.cardId}`"
              type="button"
              class="search-card-item"
              @click="openSearchCard(item)"
            >
              <div class="search-card-main">
                <strong class="search-highlight-line">
                  <template v-for="(segment, segmentIndex) in getHighlightSegments(item.title)" :key="`card-title-${item.cardId}-${segmentIndex}`">
                    <mark v-if="segment.match">{{ segment.text }}</mark>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </strong>
                <span class="search-highlight-line">
                  <template v-for="(segment, segmentIndex) in getHighlightSegments(`${item.boardTitle} / ${item.listTitle}`)" :key="`card-path-${item.cardId}-${segmentIndex}`">
                    <mark v-if="segment.match">{{ segment.text }}</mark>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </span>

                <p v-if="item.description" class="search-snippet">
                  <template v-for="(segment, segmentIndex) in getHighlightSegments(item.description)" :key="`card-desc-${item.cardId}-${segmentIndex}`">
                    <mark v-if="segment.match">{{ segment.text }}</mark>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </p>
              </div>

              <div class="search-card-meta">
                <span>{{ formatSearchDueDate(item.dueDate) }}</span>
                <span>{{ t('workspaceHome.globalSearchChecklistMeta', { done: item.checklistDone, total: item.checklistTotal }) }}</span>
                <span>{{ t('workspaceHome.globalSearchCommentMeta', { count: item.commentCount }) }}</span>
                <span>{{ t('workspaceHome.globalSearchUpdatedMeta', { date: formatSearchUpdateDate(item.updatedAt) }) }}</span>
              </div>

              <div v-if="showSearchScoreMetrics" class="search-metrics">
                <span class="search-score-chip">{{ t('workspaceHome.globalSearchScoreMeta', { score: item.score }) }}</span>
                <div class="search-field-chip-row">
                  <span
                    v-for="field in item.matchedFields"
                    :key="`card-field-${item.cardId}-${field}`"
                    class="search-field-chip"
                  >
                    {{ getSearchFieldLabel(field) }}
                  </span>
                </div>
              </div>
            </button>

            <p v-if="!workspaceSearchResults.cards.length" class="search-empty">{{ t('workspaceHome.globalSearchEmptyCards') }}</p>
          </section>
        </div>
      </section>

      <TemplateCenter
        v-if="activeSideNav === 'templates'"
        @navigate="handleTemplateNavigate"
        @use-template="createBoardFromTemplate"
      />

      <section v-else-if="activeSideNav === 'home'" class="workspace-home-overview">
        <section class="home-main-column">
          <header class="home-inbox-head">
            <h2>{{ t('workspaceHome.inboxTitle') }}</h2>
            <p>{{ t('workspaceHome.inboxHint') }}</p>
          </header>

          <article class="home-inbox-card">
            <div class="home-inbox-illustration" aria-hidden="true">
              <span class="wolf-mark">🐺</span>
              <span class="glass-mark">🕶️</span>
            </div>

            <div class="home-inbox-copy">
              <h3>{{ t('workspaceHome.inboxCardTitle') }}</h3>
              <p>{{ t('workspaceHome.inboxCardDesc') }}</p>
            </div>
          </article>
        </section>

        <aside class="home-right-column">
          <section class="home-right-block">
            <h3 class="workspace-block-title">
              <el-icon><Clock /></el-icon>
              <span>{{ t('workspaceHome.recentTitle') }}</span>
            </h3>

            <div class="recent-group-switch">
              <button
                type="button"
                :class="['recent-group-btn', { active: recentGroup === 'recent' }]"
                @click="recentGroup = 'recent'"
              >
                {{ t('workspaceHome.recentGroupRecent') }}
              </button>
              <button
                type="button"
                :class="['recent-group-btn', { active: recentGroup === 'starred' }]"
                @click="recentGroup = 'starred'"
              >
                {{ t('workspaceHome.recentGroupStarred') }}
              </button>
            </div>

            <p v-if="recentGroup === 'starred' && starredBoards.length" class="recent-drag-hint">
              {{ t('workspaceHome.starredDragHint') }}
            </p>

            <div class="mini-board-stack">
              <article
                v-for="board in displayedRecentBoards"
                :key="`home-recent-${board.id}`"
                :class="['mini-board-tile', { draggable: recentGroup === 'starred', dragging: draggingStarBoardId === board.id }]"
                :draggable="recentGroup === 'starred'"
                @click="openBoard(board.id)"
                @dragstart="onStarBoardDragStart(board.id, $event)"
                @dragover="onStarBoardDragOver(board.id, $event)"
                @drop="onStarBoardDrop(board.id, $event)"
                @dragend="onStarBoardDragEnd"
              >
                <div class="mini-board-cover" :style="getBoardCoverStyle(board)">
                  <button
                    type="button"
                    :class="['mini-board-star-btn', { active: isRecentBoardStarred(board.id) }]"
                    :aria-label="isRecentBoardStarred(board.id) ? t('workspaceHome.unstarRecentAria') : t('workspaceHome.starRecentAria')"
                    @click.stop="toggleRecentBoardStar(board.id)"
                  >
                    <el-icon>
                      <StarFilled v-if="isRecentBoardStarred(board.id)" />
                      <Star v-else />
                    </el-icon>
                  </button>
                  <span class="mini-board-title">{{ board.title }}</span>
                </div>
              </article>

              <div v-if="!displayedRecentBoards.length" class="home-right-empty">
                {{ recentGroup === 'starred' ? t('workspaceHome.starredEmpty') : t('workspaceHome.recentEmpty') }}
              </div>
            </div>
          </section>

          <section class="home-right-block">
            <h3 class="workspace-block-title">
              <el-icon><Grid /></el-icon>
              <span>{{ t('workspaceHome.workspaceMiniTitle') }}</span>
            </h3>

            <div class="mini-board-stack">
              <article
                v-for="board in workspaceMiniBoards"
                :key="`home-workspace-${board.id}`"
                class="mini-board-tile"
                @click="openBoard(board.id)"
              >
                <div class="mini-board-cover" :style="getBoardCoverStyle(board)">
                  <span class="mini-board-title">{{ board.title }}</span>
                </div>
              </article>

              <div v-if="!workspaceMiniBoards.length" class="home-right-empty">{{ t('workspaceHome.recentEmpty') }}</div>
            </div>
          </section>

          <button class="home-quick-create-btn" type="button" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            <span>{{ t('workspaceHome.createNewBoard') }}</span>
          </button>
        </aside>
      </section>

      <section v-else class="workspace-block">
        <header class="workspace-main-header">
          <div class="workspace-identity">
            <span class="workspace-avatar large">{{ workspaceAvatar }}</span>
            <h2>{{ workspaceName }}</h2>
          </div>
        </header>

        <section v-if="activeWorkspaceTab === 'boards'" class="workspace-boards-panel">
          <header class="panel-head">
            <div>
              <h3>{{ t('workspaceHome.workspaceBoardsTitle') }}</h3>
              <p>{{ t('workspaceHome.workspaceBoardsDesc') }}</p>
            </div>
          </header>

          <section class="workspace-recent-panel">
            <h4 class="workspace-subhead">
              <el-icon><Clock /></el-icon>
              <span>{{ t('workspaceHome.recentTitle') }}</span>
            </h4>

            <div class="mini-board-stack">
              <article
                v-for="board in recentBoards"
                :key="`workspace-recent-${board.id}`"
                class="mini-board-tile"
                @click="openBoard(board.id)"
              >
                <div class="mini-board-cover" :style="getBoardCoverStyle(board)">
                  <span class="mini-board-title">{{ board.title }}</span>
                </div>
              </article>

              <div v-if="!recentBoards.length" class="home-right-empty">{{ t('workspaceHome.recentEmpty') }}</div>
            </div>
          </section>

          <div class="workspace-boards-toolbar">
            <el-select v-model="workspaceBoardsSort" class="workspace-toolbar-select">
              <el-option value="recent" :label="t('workspaceHome.workspaceBoardsSortRecent')" />
              <el-option value="oldest" :label="t('workspaceHome.workspaceBoardsSortOldest')" />
              <el-option value="az" :label="t('workspaceHome.workspaceBoardsSortAZ')" />
              <el-option value="za" :label="t('workspaceHome.workspaceBoardsSortZA')" />
            </el-select>

            <el-select v-model="workspaceBoardsCollection" class="workspace-toolbar-select">
              <el-option value="all" :label="t('workspaceHome.workspaceBoardsCollectionAll')" />
              <el-option value="starred" :label="t('workspaceHome.workspaceBoardsCollectionStarred')" />
            </el-select>

            <el-input
              v-model="workspaceBoardsQuery"
              class="workspace-toolbar-search"
              clearable
              :placeholder="t('workspaceHome.workspaceBoardsSearchPlaceholder')"
            />

            <el-button type="primary" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>
              {{ t('workspaceHome.createNewBoard') }}
            </el-button>
          </div>

          <div class="board-row workspace-board-grid">
            <article
              v-for="board in workspaceDisplayedBoards"
              :key="board.id"
              class="lowtrello-board-card large"
              @click="openBoard(board.id)"
            >
              <div class="board-cover" :style="getBoardCoverStyle(board)"></div>
              <div class="board-footer">
                <div class="board-meta">
                  <span class="board-title">{{ board.title }}</span>
                  <span :class="['board-visibility-chip', board.visibility]">{{ visibilityLabel(board.visibility) }}</span>
                </div>

                <el-dropdown trigger="click" @command="(command) => handleBoardCommand(command, board)">
                  <button class="board-menu-btn" type="button" @click.stop :aria-label="t('workspaceHome.boardMenuAria')">
                    <el-icon><MoreFilled /></el-icon>
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="open">{{ t('boardHome.openBoard') }}</el-dropdown-item>
                      <el-dropdown-item command="edit">{{ t('boardHome.editBoard') }}</el-dropdown-item>
                      <el-dropdown-item command="delete" class="danger-item">{{ t('boardHome.deleteBoard') }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </article>

            <button class="create-board-card" type="button" @click="openCreateDialog">
              <span class="create-board-plus">+</span>
              <span>{{ t('workspaceHome.createNewBoard') }}</span>
            </button>
          </div>
        </section>

        <section v-else-if="activeWorkspaceTab === 'members'" class="workspace-members-panel">
          <header class="panel-head">
            <div>
              <h3>{{ t('workspaceHome.membersTitle') }}</h3>
              <p>{{ t('workspaceHome.workspaceMembersDesc') }}</p>
            </div>
          </header>

          <div class="workspace-members-invite-row">
            <el-input v-model="inviteForm.query" :placeholder="t('workspaceHome.inviteQueryPlaceholder')" />
            <el-select v-model="inviteForm.role" class="member-role-select">
              <el-option v-for="role in memberRoleOptions" :key="role.value" :label="role.label" :value="role.value" />
            </el-select>
            <el-button type="primary" @click="inviteMember">{{ t('workspaceHome.inviteMember') }}</el-button>
          </div>

          <div class="workspace-members-toolbar">
            <div class="workspace-member-tabs">
              <button
                type="button"
                :class="['workspace-member-tab', { active: workspaceMemberTab === 'members' }]"
                @click="workspaceMemberTab = 'members'"
              >
                {{ t('workspaceHome.memberTabMembers') }}
              </button>
              <button
                type="button"
                :class="['workspace-member-tab', { active: workspaceMemberTab === 'guest-single' }]"
                @click="workspaceMemberTab = 'guest-single'"
              >
                {{ t('workspaceHome.memberTabGuestSingle') }}
              </button>
              <button
                type="button"
                :class="['workspace-member-tab', { active: workspaceMemberTab === 'guest-multi' }]"
                @click="workspaceMemberTab = 'guest-multi'"
              >
                {{ t('workspaceHome.memberTabGuestMulti') }}
              </button>
              <button
                type="button"
                :class="['workspace-member-tab', { active: workspaceMemberTab === 'requests' }]"
                @click="workspaceMemberTab = 'requests'"
              >
                {{ t('workspaceHome.memberTabRequests', { count: workspaceJoinRequests.length }) }}
              </button>
            </div>

            <el-input
              v-model="workspaceMemberSearchQuery"
              clearable
              :placeholder="t('workspaceHome.memberSearchPlaceholder')"
              class="workspace-member-search"
            />
          </div>

          <p v-if="memberTabIntro" class="workspace-member-intro">{{ memberTabIntro }}</p>

          <section v-if="workspaceMemberTab === 'requests'" class="workspace-requests">
            <article v-for="req in workspaceJoinRequests" :key="req.id" class="request-item">
              <div class="request-main">
                <span class="member-avatar">{{ req.name.charAt(0).toUpperCase() }}</span>
                <div>
                  <p class="member-name">{{ req.name }}</p>
                  <p class="member-email">{{ req.username }}</p>
                </div>
              </div>
              <div class="request-actions">
                <el-button size="small" type="primary" @click="approveWorkspaceJoinRequest(req.id)">{{ t('workspaceHome.requestApprove') }}</el-button>
                <el-button size="small" @click="rejectWorkspaceJoinRequest(req.id)">{{ t('workspaceHome.requestReject') }}</el-button>
              </div>
            </article>

            <p v-if="!workspaceJoinRequests.length" class="member-empty">{{ t('workspaceHome.memberRequestsEmpty') }}</p>
          </section>

          <section v-else class="workspace-member-table">
            <div class="member-table-head">
              <span>{{ t('workspaceHome.memberColName') }}</span>
              <span class="hide-sm">{{ t('workspaceHome.memberColUsername') }}</span>
              <span class="hide-sm">{{ t('workspaceHome.memberColLastActive') }}</span>
              <span class="hide-sm">{{ t('workspaceHome.memberColBoards') }}</span>
              <span>{{ t('workspaceHome.memberColRole') }}</span>
              <span>{{ t('workspaceHome.memberColAction') }}</span>
            </div>

            <article v-for="member in workspaceDisplayedMembers" :key="member.id" class="member-row">
              <div class="member-cell name">
                <span class="member-avatar">{{ member.name.charAt(0).toUpperCase() }}</span>
                <div class="member-name-stack">
                  <p class="member-name">{{ member.name }}</p>
                  <p class="member-email">{{ member.email || t('accountMenu.emailFallback') }}</p>
                </div>
              </div>

              <div class="member-cell hide-sm">{{ member.username }}</div>
              <div class="member-cell hide-sm">{{ formatMemberLastActive(member.lastActiveAt) }}</div>
              <div class="member-cell hide-sm">{{ member.boardCount }}</div>

              <div class="member-cell">
                <el-select
                  v-model="member.role"
                  class="member-role-select"
                  :disabled="workspaceMemberTab !== 'members'"
                  @change="saveWorkspaceMembers"
                >
                  <el-option v-for="role in memberRoleOptions" :key="role.value" :label="role.label" :value="role.value" />
                </el-select>
              </div>

              <div class="member-cell">
                <el-button
                  text
                  type="danger"
                  :disabled="!canRemoveWorkspaceMember(member)"
                  @click="removeMember(member.id)"
                >
                  {{ getWorkspaceMemberActionLabel(member) }}
                </el-button>
              </div>
            </article>

            <p v-if="!workspaceDisplayedMembers.length" class="member-empty">{{ t('workspaceHome.memberEmpty') }}</p>
          </section>
        </section>

        <section v-else-if="activeWorkspaceTab === 'settings'" class="workspace-settings-panel">
          <header class="panel-head">
            <div>
              <h3>{{ t('workspaceHome.workspaceSettingsTitle') }}</h3>
              <p>{{ t('workspaceHome.workspaceSettingsDesc') }}</p>
            </div>
          </header>

          <div class="workspace-settings-grid">
            <section class="workspace-setting-card">
              <div class="setting-card-head">
                <h4>
                  {{ t('workspaceHome.settingVisibilityTitle') }}
                  <el-tag size="small" type="warning" effect="plain">{{ t('workspaceHome.premiumTag') }}</el-tag>
                </h4>
                <p>{{ t('workspaceHome.settingVisibilityDesc') }}</p>
              </div>

              <el-select v-model="workspaceSettingsForm.workspaceVisibility" class="setting-control">
                <el-option value="private" :label="t('workspaceHome.visibilityPrivate')" />
                <el-option value="public" :label="t('workspaceHome.visibilityPublic')" />
              </el-select>
            </section>

            <section class="workspace-setting-card">
              <div class="setting-card-head">
                <h4>{{ t('workspaceHome.settingMembershipTitle') }}</h4>
                <p>{{ t('workspaceHome.settingMembershipDesc') }}</p>
              </div>
              <el-switch v-model="workspaceSettingsForm.allowMemberInvite" />
            </section>

            <section class="workspace-setting-card">
              <div class="setting-card-head">
                <h4>{{ t('workspaceHome.settingBoardCreateTitle') }}</h4>
                <p>{{ t('workspaceHome.settingBoardCreateDesc') }}</p>
              </div>
              <el-select v-model="workspaceSettingsForm.boardCreateRule" class="setting-control">
                <el-option value="members" :label="t('workspaceHome.boardCreateMembers')" />
                <el-option value="admins" :label="t('workspaceHome.boardCreateAdmins')" />
              </el-select>
              <div class="setting-inline-switch">
                <span class="inline-switch-label">{{ t('workspaceHome.allowPublicBoard') }}</span>
                <el-switch v-model="workspaceSettingsForm.allowPublicBoard" />
              </div>
            </section>

            <section class="workspace-setting-card">
              <div class="setting-card-head">
                <h4>{{ t('workspaceHome.settingBoardDeleteTitle') }}</h4>
                <p>{{ t('workspaceHome.settingBoardDeleteDesc') }}</p>
              </div>
              <el-select v-model="workspaceSettingsForm.boardDeleteRule" class="setting-control">
                <el-option value="admins" :label="t('workspaceHome.boardDeleteAdmins')" />
                <el-option value="members" :label="t('workspaceHome.boardDeleteMembers')" />
              </el-select>
            </section>

            <section class="workspace-setting-card">
              <div class="setting-card-head">
                <h4>
                  {{ t('workspaceHome.settingAiTitle') }}
                  <el-tag size="small" type="warning" effect="plain">{{ t('workspaceHome.premiumTag') }}</el-tag>
                </h4>
                <p>{{ t('workspaceHome.settingAiDesc') }}</p>
              </div>
              <el-switch v-model="workspaceSettingsForm.aiEnabled" />
            </section>
          </div>

          <div class="workspace-settings-actions">
            <el-button type="primary" @click="saveWorkspaceSettings">{{ t('workspaceHome.saveSettings') }}</el-button>
          </div>
        </section>

        <section v-else class="workspace-exports-panel">
          <header class="panel-head">
            <div>
              <h3>
                {{ t('workspaceHome.exportTitle') }}
                <el-tag size="small" type="warning" effect="plain">{{ t('workspaceHome.premiumTag') }}</el-tag>
              </h3>
              <p>{{ t('workspaceHome.exportDesc') }}</p>
            </div>
          </header>

          <div class="workspace-export-create">
            <el-checkbox v-model="exportForm.includeAttachments">{{ t('workspaceHome.exportIncludeAttachments') }}</el-checkbox>
            <el-button type="primary" @click="createWorkspaceExport">{{ t('workspaceHome.exportCreate') }}</el-button>
          </div>

          <p class="workspace-export-hint">{{ t('workspaceHome.exportDownloadHint') }}</p>

          <div class="workspace-export-list">
            <article v-for="item in workspaceExports" :key="item.id" class="export-item">
              <div class="export-item-main">
                <strong>{{ t('workspaceHome.exportItemTitle') }}</strong>
                <span>{{ t('workspaceHome.exportItemMeta', { date: formatExportDate(item.createdAt) }) }}</span>
              </div>
              <el-button size="small" plain @click="downloadWorkspaceExport(item)">{{ t('workspaceHome.exportDownload') }}</el-button>
            </article>
            <p v-if="!workspaceExports.length" class="export-empty">{{ t('workspaceHome.exportEmpty') }}</p>
          </div>
        </section>
      </section>
    </main>

    <el-dialog
      v-model="createDialogVisible"
      width="428px"
      top="8vh"
      class="create-board-dialog"
      :show-close="false"
      @closed="resetCreateForm"
    >
      <template #header>
        <div class="create-dialog-header">
          <span></span>
          <h3>{{ t('boardHome.createDialog') }}</h3>
          <button class="create-dialog-close" type="button" @click="createDialogVisible = false" :aria-label="t('common.cancel')">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="create-dialog-body">
        <section class="create-preview-card" :style="createPreviewStyle">
          <div class="preview-grid">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </section>

        <section class="create-block">
          <p class="create-block-label">{{ t('boardHome.backgroundLabel') }}</p>

          <div class="background-option-row">
            <button
              v-for="item in imageBackgrounds"
              :key="item.id"
              type="button"
              :class="['background-image-option', { active: isSelectedImage(item.full) }]"
              @click="setImageBackground(item.full)"
            >
              <img :src="item.thumb" :alt="item.alt" loading="lazy">
            </button>

            <button
              class="background-more-option"
              type="button"
              :aria-label="t('boardHome.moreBackgrounds')"
              @click="openMoreBackgroundPanel"
            >
              ...
            </button>
          </div>

          <section v-if="moreBackgroundPanelVisible" class="background-secondary-panel">
            <header class="secondary-panel-header">
              <h4>{{ t('boardHome.moreBackgrounds') }}</h4>
              <button type="button" class="secondary-panel-close" @click="closeMoreBackgroundPanel">
                <el-icon><Close /></el-icon>
              </button>
            </header>

            <div class="secondary-panel-grid">
              <button
                v-for="item in pagedMoreImageBackgrounds"
                :key="item.id"
                type="button"
                :class="['secondary-image-option', { active: isSelectedImage(item.full) }]"
                @click="pickImageFromPanel(item.full)"
              >
                <img :src="item.thumb" :alt="item.alt" loading="lazy">
              </button>
            </div>

            <footer class="secondary-panel-footer">
              <button
                type="button"
                class="secondary-page-btn"
                :disabled="moreBackgroundPage <= 1"
                @click="goMoreBackgroundPage(moreBackgroundPage - 1)"
              >
                {{ t('boardHome.previousPage') }}
              </button>

              <span class="secondary-page-indicator">
                {{ t('boardHome.pageLabel', { page: moreBackgroundPage, total: moreBackgroundTotalPages }) }}
              </span>

              <button
                type="button"
                class="secondary-page-btn"
                :disabled="moreBackgroundPage >= moreBackgroundTotalPages"
                @click="goMoreBackgroundPage(moreBackgroundPage + 1)"
              >
                {{ t('boardHome.nextPage') }}
              </button>
            </footer>
          </section>

          <div class="background-option-row colors">
            <button
              v-for="color in colorBackgrounds"
              :key="color"
              type="button"
              :class="['background-color-option', { active: isSelectedColor(color) }]"
              :style="{ background: color }"
              @click="setColorBackground(color)"
            ></button>
          </div>
        </section>

        <section class="create-block">
          <label class="create-field-label" for="create-board-title-input">
            {{ t('boardHome.boardTitleRequiredLabel') }}
            <span class="required-star">*</span>
          </label>
          <input
            id="create-board-title-input"
            v-model="createForm.title"
            class="create-title-input"
            :class="{ error: showTitleError }"
            type="text"
            maxlength="48"
            :placeholder="t('boardHome.boardTitlePlaceholder')"
            @blur="createTitleTouched = true"
          >

          <p v-if="showTitleError" class="create-field-error">
            <el-icon><WarningFilled /></el-icon>
            <span>{{ t('boardHome.titleRequired') }}</span>
          </p>
        </section>

        <section class="create-block">
          <label class="create-field-label">{{ t('boardHome.visibilityLabel') }}</label>
          <el-select v-model="createForm.visibility" class="visibility-select">
            <el-option
              v-for="option in visibilityOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </section>

        <div class="create-dialog-actions">
          <el-button
            type="primary"
            class="create-submit-btn"
            :disabled="!canSubmitCreate"
            @click="submitCreateBoard(false)"
          >
            {{ t('boardHome.createNow') }}
          </el-button>
          <el-button class="create-template-btn" @click="submitCreateBoard(true)">
            {{ t('boardHome.createFromTemplate') }}
          </el-button>
        </div>

        <p class="create-dialog-license">
          {{ t('boardHome.unsplashNoticePrefix') }}
          <a href="#" @click.prevent="openPlaceholderLink(t('boardHome.unsplashLicense'))">{{ t('boardHome.unsplashLicense') }}</a>
          {{ t('boardHome.unsplashNoticeMiddle') }}
          <a href="#" @click.prevent="openPlaceholderLink(t('boardHome.unsplashTerms'))">{{ t('boardHome.unsplashTerms') }}</a>
          {{ t('boardHome.unsplashNoticeAnd') }}
          <a href="#" @click.prevent="openPlaceholderLink(t('boardHome.unsplashBrowse'))">{{ t('boardHome.unsplashBrowse') }}</a>
          .
        </p>
      </div>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      :title="t('boardHome.editDialog')"
      width="460px"
      @closed="resetEditForm"
    >
      <el-form label-position="top">
        <el-form-item :label="t('boardHome.boardTitle')" required>
          <el-input v-model="editForm.title" maxlength="48" :placeholder="t('boardHome.boardTitlePlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('boardHome.boardDesc')">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            maxlength="300"
            :placeholder="t('boardHome.boardDescPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitEditBoard">
          {{ t('boardHome.saveChanges') }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowDown,
  ArrowRight,
  Close,
  Clock,
  Collection,
  Grid,
  House,
  MoreFilled,
  Plus,
  Setting,
  Star,
  StarFilled,
  User,
  WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import JSZip from 'jszip'
import { useBoardStore } from '../stores/board'
import { useUserStore } from '../stores/user'
import { createId } from '../utils/id'
import { loadFromStorage, saveToStorage } from '../utils/storage'
import {
  COLOR_BACKGROUND_OPTIONS,
  DEFAULT_BOARD_BACKGROUND,
  IMAGE_BACKGROUND_OPTIONS,
  MORE_IMAGE_BACKGROUND_OPTIONS,
  getBoardBackgroundStyle
} from '../utils/boardBackgrounds'
import TemplateCenter from '../components/workspace/TemplateCenter.vue'

const DEFAULT_WORKSPACE_KEY = 'default-workspace'
const MORE_BACKGROUND_PAGE_SIZE = 8
const WORKSPACE_MEMBERS_KEY = 'lowtrello.workspace.members.v1'
const WORKSPACE_JOIN_REQUESTS_KEY = 'lowtrello.workspace.joinRequests.v1'
const WORKSPACE_SETTINGS_KEY = 'lowtrello.workspace.settings.v1'
const WORKSPACE_EXPORTS_KEY = 'lowtrello.workspace.exports.v1'
const HOME_RECENT_STARS_KEY = 'lowtrello.home.recent.stars.v1'
const HOME_RECENT_STAR_LIMIT = 24

const route = useRoute()
const router = useRouter()
const boardStore = useBoardStore()
const userStore = useUserStore()

const t = userStore.t

const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const createTitleTouched = ref(false)
const moreBackgroundPanelVisible = ref(false)
const moreBackgroundPage = ref(1)
const editingBoardId = ref('')
const editForm = reactive({
  title: '',
  description: ''
})
const createForm = reactive({
  title: '',
  visibility: 'workspace',
  background: {
    ...DEFAULT_BOARD_BACKGROUND
  }
})
const inviteForm = reactive({
  query: '',
  role: 'member'
})
const workspaceSettingsForm = reactive({
  workspaceName: '',
  workspaceDescription: '',
  defaultBoardVisibility: 'workspace',
  allowMemberInvite: true,
  allowPublicBoard: false,
  workspaceVisibility: 'private',
  boardCreateRule: 'members',
  boardDeleteRule: 'admins',
  aiEnabled: false
})
const workspaceMembers = ref([])
const workspaceJoinRequests = ref([])
const workspaceMemberTab = ref('members')
const workspaceMemberSearchQuery = ref('')
const exportForm = reactive({
  includeAttachments: false
})
const workspaceExports = ref([])
const starredRecentBoardIds = ref([])
const recentGroup = ref('recent')
const draggingStarBoardId = ref('')
const activeSideNav = ref('home')
const activeWorkspaceTab = ref('boards')
const workspaceManageExpanded = ref(true)
const workspaceBoardsSort = ref('recent')
const workspaceBoardsCollection = ref('all')
const workspaceBoardsQuery = ref('')
const searchFilters = reactive({
  sortBy: 'relevance',
  type: 'all',
  visibility: 'all',
  labelId: '',
  assignee: '',
  dueState: 'all'
})
const imageBackgrounds = IMAGE_BACKGROUND_OPTIONS
const moreImageBackgrounds = MORE_IMAGE_BACKGROUND_OPTIONS
const colorBackgrounds = COLOR_BACKGROUND_OPTIONS
function openPlaceholderLink(label) {
  const safeLabel = String(label || '').trim()
  ElMessage.info(safeLabel ? `${safeLabel}：${t('appMenu.developing')}` : t('appMenu.developing'))
}

const currentUserEmail = computed(() => {
  return String(userStore.currentUser?.email || '').trim().toLowerCase()
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

const boards = computed(() => boardStore.getVisibleBoards(viewerAccess.value))
const globalSearchKeyword = computed(() => String(route.query.q || '').trim())
const recentBoards = computed(() => boards.value.slice(0, 8))
const starredBoards = computed(() => {
  return starredRecentBoardIds.value
    .map((id) => boards.value.find((board) => board.id === id))
    .filter(Boolean)
})
const displayedRecentBoards = computed(() => {
  const source = recentGroup.value === 'starred' ? starredBoards.value : recentBoards.value
  return source.slice(0, 8)
})
const workspaceMiniBoards = computed(() => boards.value.slice(0, 4))
const workspaceName = computed(() => {
  const customName = String(userStore.currentUser?.workspaceName || '').trim()
  return customName || t('workspaceHome.workspaceName')
})
const workspaceAvatar = computed(() => {
  return workspaceName.value.charAt(0).toUpperCase() || 'T'
})
const visibilityOptions = computed(() => [
  { value: 'workspace', label: t('boardHome.visibilityWorkspace') },
  { value: 'private', label: t('boardHome.visibilityPrivate') },
  { value: 'public', label: t('boardHome.visibilityPublic') }
])
const memberRoleOptions = computed(() => [
  { value: 'admin', label: t('workspaceHome.memberRoleAdmin') },
  { value: 'member', label: t('workspaceHome.memberRoleMember') },
  { value: 'observer', label: t('workspaceHome.memberRoleObserver') }
])
const ownerMemberId = computed(() => {
  return workspaceMembers.value.find((member) => member.type === 'members' && member.role === 'admin')?.id || 'member-owner'
})
const moreBackgroundTotalPages = computed(() => {
  return Math.max(1, Math.ceil(moreImageBackgrounds.length / MORE_BACKGROUND_PAGE_SIZE))
})
const pagedMoreImageBackgrounds = computed(() => {
  const start = (moreBackgroundPage.value - 1) * MORE_BACKGROUND_PAGE_SIZE
  const end = start + MORE_BACKGROUND_PAGE_SIZE
  return moreImageBackgrounds.slice(start, end)
})
const showTitleError = computed(() => createTitleTouched.value && !createForm.title.trim())
const canSubmitCreate = computed(() => Boolean(createForm.title.trim()))
const createPreviewStyle = computed(() => getBoardBackgroundStyle(createForm.background, { withOverlay: true }))
const hasAdvancedSearchFilters = computed(() => {
  return searchFilters.sortBy !== 'relevance'
    || searchFilters.type !== 'all'
    || searchFilters.visibility !== 'all'
    || Boolean(searchFilters.labelId)
    || Boolean(searchFilters.assignee)
    || searchFilters.dueState !== 'all'
})
const highlightTokens = computed(() => {
  return String(globalSearchKeyword.value || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((item, index, source) => item && source.indexOf(item) === index)
    .slice(0, 8)
})
const showSearchScoreMetrics = computed(() => highlightTokens.value.length > 0)
const showGlobalSearchPanel = computed(() => {
  return Boolean(globalSearchKeyword.value) || hasAdvancedSearchFilters.value
})
const searchFacets = computed(() => boardStore.getSearchFacets(viewerAccess.value))
const workspaceSearchResults = computed(() => {
  if (!showGlobalSearchPanel.value) {
    return {
      keyword: '',
      boards: [],
      cards: [],
      total: 0
    }
  }

  return boardStore.searchWorkspace(globalSearchKeyword.value, viewerAccess.value, {
    ...searchFilters
  })
})

const workspaceDisplayedBoards = computed(() => {
  const query = String(workspaceBoardsQuery.value || '').trim().toLowerCase()
  const source = Array.isArray(boards.value) ? boards.value : []
  let next = [...source]

  if (workspaceBoardsCollection.value === 'starred') {
    next = next.filter((board) => isRecentBoardStarred(board.id))
  }

  if (query) {
    next = next.filter((board) => String(board.title || '').toLowerCase().includes(query))
  }

  const byRecentDesc = (a, b) => {
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  }

  if (workspaceBoardsSort.value === 'oldest') {
    next.sort((a, b) => -byRecentDesc(a, b))
  } else if (workspaceBoardsSort.value === 'az') {
    next.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), userStore.locale === 'en' ? 'en' : 'zh'))
  } else if (workspaceBoardsSort.value === 'za') {
    next.sort((a, b) => String(b.title || '').localeCompare(String(a.title || ''), userStore.locale === 'en' ? 'en' : 'zh'))
  } else {
    next.sort(byRecentDesc)
  }

  return next
})

const workspaceDisplayedMembers = computed(() => {
  const tab = String(workspaceMemberTab.value || '').trim() || 'members'
  const keyword = String(workspaceMemberSearchQuery.value || '').trim().toLowerCase()

  const typeMap = {
    members: 'members',
    'guest-single': 'guest-single',
    'guest-multi': 'guest-multi'
  }

  const targetType = typeMap[tab]
  if (!targetType) {
    return []
  }

  return (Array.isArray(workspaceMembers.value) ? workspaceMembers.value : [])
    .filter((member) => member.type === targetType)
    .filter((member) => {
      if (!keyword) {
        return true
      }

      const text = `${member.name || ''} ${member.email || ''} ${member.username || ''}`.toLowerCase()
      return text.includes(keyword)
    })
})

const memberTabIntro = computed(() => {
  const tab = String(workspaceMemberTab.value || '').trim() || 'members'
  if (tab === 'members') {
    return t('workspaceHome.memberIntroMembers')
  }

  if (tab === 'guest-single') {
    return t('workspaceHome.memberIntroGuestSingle')
  }

  if (tab === 'guest-multi') {
    return t('workspaceHome.memberIntroGuestMulti')
  }

  return ''
})

onMounted(() => {
  if (!userStore.isAuthenticated) {
    router.replace({ name: 'login' })
    return
  }

  boardStore.init()
  hydrateWorkspacePanels()
  hydrateRecentBoardStars()
})

watch(
  () => route.query.create,
  (value) => {
    const createType = String(value || '').trim()
    if (!createType) {
      return
    }

    const nextQuery = {
      ...route.query
    }
    delete nextQuery.create
    router.replace({
      name: 'workspace',
      query: nextQuery
    })

    if (createType === 'board') {
      activeSideNav.value = 'boards'
      activeWorkspaceTab.value = 'boards'
      openCreateDialog()
      return
    }

    if (createType === 'template') {
      activeSideNav.value = 'templates'
      return
    }

    if (createType === 'workspace_view') {
      activeSideNav.value = 'home'
    }
  },
  { immediate: true }
)

function sanitizeExportFileName(value, fallback = 'item') {
  const text = String(value || '').trim() || fallback
  return text
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || fallback
}

function toCsv(headers, rows) {
  const escapeCell = (value) => {
    const text = value == null ? '' : String(value)
    const escaped = text.replace(/"/g, '""')
    return `"${escaped}"`
  }

  const headerLine = headers.map((h) => escapeCell(h)).join(',')
  const lines = rows.map((row) => headers.map((key) => escapeCell(row[key])).join(','))
  return [headerLine, ...lines].join('\n')
}

function parseBase64DataUrl(dataUrl) {
  const raw = String(dataUrl || '')
  const match = /^data:([^;]+);base64,(.+)$/i.exec(raw)
  if (!match) {
    return null
  }

  const mime = match[1]
  const base64 = match[2]
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }

    return {
      mime,
      bytes
    }
  } catch {
    return null
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function buildWorkspaceExportZip(includeAttachments) {
  const exportedAt = new Date().toISOString()
  const workspacePayload = {
    exportedAt,
    workspace: {
      key: currentWorkspaceKey.value,
      name: workspaceName.value,
      description: String(userStore.currentUser?.workspaceDescription || '').trim()
    },
    settings: loadFromStorage(WORKSPACE_SETTINGS_KEY, {}),
    members: workspaceMembers.value,
    joinRequests: workspaceJoinRequests.value
  }

  const visibleBoards = boards.value

  const zip = new JSZip()
  const jsonFolder = zip.folder('json')
  const csvFolder = zip.folder('csv')

  jsonFolder.file('workspace.json', JSON.stringify(workspacePayload, null, 2))
  jsonFolder.file('boards.json', JSON.stringify(visibleBoards, null, 2))

  const memberRows = (Array.isArray(workspaceMembers.value) ? workspaceMembers.value : []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    username: m.username,
    role: m.role,
    type: m.type,
    lastActiveAt: m.lastActiveAt,
    boardCount: m.boardCount
  }))
  csvFolder.file(
    'members.csv',
    toCsv(
      ['id', 'name', 'email', 'username', 'role', 'type', 'lastActiveAt', 'boardCount'],
      memberRows
    )
  )

  const boardRows = visibleBoards.map((board) => ({
    id: board.id,
    title: board.title,
    description: board.description,
    visibility: board.visibility,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    listCount: Array.isArray(board.lists) ? board.lists.length : 0,
    cardCount: Array.isArray(board.lists) ? board.lists.reduce((sum, list) => sum + (Array.isArray(list.cards) ? list.cards.length : 0), 0) : 0,
    memberCount: Array.isArray(board.members) ? board.members.length : 0
  }))
  csvFolder.file(
    'boards.csv',
    toCsv(
      ['id', 'title', 'description', 'visibility', 'createdAt', 'updatedAt', 'listCount', 'cardCount', 'memberCount'],
      boardRows
    )
  )

  const listRows = []
  const cardRows = []
  const attachmentRows = []
  const activityRows = []

  const attachmentsFolder = includeAttachments ? zip.folder('attachments') : null

  visibleBoards.forEach((board) => {
    const boardId = board.id
    const boardTitle = String(board.title || '').trim()
    const lists = Array.isArray(board.lists) ? board.lists : []
    lists.forEach((list) => {
      const listId = list.id
      const listTitle = list.title

      listRows.push({
        boardId,
        boardTitle,
        listId,
        listTitle,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
      })

      const cards = Array.isArray(list.cards) ? list.cards : []
      cards.forEach((card) => {
        const cardId = card.id
        const cardTitle = card.title
        const attachments = Array.isArray(card.attachments) ? card.attachments : []

        cardRows.push({
          boardId,
          boardTitle,
          listId,
          listTitle,
          cardId,
          cardTitle,
          description: card.description,
          dueDate: card.dueDate,
          archived: card.archived,
          archivedAt: card.archivedAt,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          labelIds: Array.isArray(card.labelIds) ? card.labelIds.join('|') : '',
          assignees: Array.isArray(card.assignees) ? card.assignees.join('|') : '',
          commentCount: Array.isArray(card.comments) ? card.comments.length : 0,
          attachmentCount: attachments.length
        })

        attachments.forEach((attachment) => {
          const attachmentId = attachment.id
          const attachmentName = attachment.name
          const attachmentUrl = attachment.url
          const attachmentType = attachment.type
          const attachmentSize = attachment.size

          let filePath = ''
          if (includeAttachments && attachmentsFolder) {
            const parsed = parseBase64DataUrl(attachmentUrl)
            if (parsed) {
              const safeBoard = sanitizeExportFileName(boardTitle, boardId)
              const safeCard = sanitizeExportFileName(cardTitle, cardId)
              const safeName = sanitizeExportFileName(attachmentName, attachmentId)
              filePath = `${safeBoard}/${safeCard}/${safeName}`
              attachmentsFolder.folder(safeBoard).folder(safeCard).file(safeName, parsed.bytes, {
                binary: true
              })
            }
          }

          attachmentRows.push({
            boardId,
            boardTitle,
            listId,
            listTitle,
            cardId,
            cardTitle,
            attachmentId,
            name: attachmentName,
            type: attachmentType,
            size: attachmentSize,
            filePath,
            url: includeAttachments ? (filePath ? '' : attachmentUrl) : attachmentUrl
          })
        })
      })
    })

    const activity = Array.isArray(board.activity) ? board.activity : []
    activity.forEach((entry) => {
      activityRows.push({
        boardId,
        boardTitle,
        activityId: entry.id,
        type: entry.type,
        message: entry.message,
        createdAt: entry.createdAt
      })
    })
  })

  csvFolder.file(
    'lists.csv',
    toCsv(
      ['boardId', 'boardTitle', 'listId', 'listTitle', 'createdAt', 'updatedAt'],
      listRows
    )
  )
  csvFolder.file(
    'cards.csv',
    toCsv(
      [
        'boardId',
        'boardTitle',
        'listId',
        'listTitle',
        'cardId',
        'cardTitle',
        'description',
        'dueDate',
        'archived',
        'archivedAt',
        'createdAt',
        'updatedAt',
        'labelIds',
        'assignees',
        'commentCount',
        'attachmentCount'
      ],
      cardRows
    )
  )
  csvFolder.file(
    'attachments.csv',
    toCsv(
      [
        'boardId',
        'boardTitle',
        'listId',
        'listTitle',
        'cardId',
        'cardTitle',
        'attachmentId',
        'name',
        'type',
        'size',
        'filePath',
        'url'
      ],
      attachmentRows
    )
  )
  csvFolder.file(
    'activity.csv',
    toCsv(
      ['boardId', 'boardTitle', 'activityId', 'type', 'message', 'createdAt'],
      activityRows
    )
  )

  return zip.generateAsync({ type: 'blob' })
}

async function downloadWorkspaceExport(exportItem) {
  const includeAttachments = Boolean(exportItem?.includeAttachments)
  try {
    ElMessage.info(t('workspaceHome.exportGenerating'))
    const blob = await buildWorkspaceExportZip(includeAttachments)
    const timestamp = new Date(exportItem?.createdAt || Date.now())
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19)
    const filename = `lowtrello-workspace-export-${timestamp}.zip`
    triggerDownload(blob, filename)
  } catch (error) {
    console.error('Failed to export workspace zip', error)
    ElMessage.error(t('workspaceHome.exportFailed'))
  }
}

watch(
  boards,
  () => {
    const sanitized = sanitizeRecentBoardStarIds(starredRecentBoardIds.value)
    if (sanitized.length !== starredRecentBoardIds.value.length) {
      starredRecentBoardIds.value = sanitized
      persistRecentBoardStars()
    }
  },
  { immediate: true }
)

watch(
  () => route.query.q,
  (query) => {
    if (String(query || '').trim()) {
      activeSideNav.value = 'home'
      activeWorkspaceTab.value = 'boards'
    }
  },
  { immediate: true }
)

function createDefaultMembers() {
  const currentName = userStore.currentUser?.name || t('accountMenu.nameFallback')
  const currentEmail = String(userStore.currentUser?.email || '').trim()
  const now = new Date().toISOString()
  const currentUsername = guessUsernameFromEmail(currentEmail, 'you')

  return [
    {
      id: 'member-owner',
      name: currentName,
      email: currentEmail,
      role: 'admin',
      type: 'members',
      username: currentUsername,
      lastActiveAt: now,
      boardCount: 0
    },
    {
      id: 'member-design',
      name: 'Design Partner',
      email: 'design@example.com',
      role: 'member',
      type: 'members',
      username: 'design-partner',
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      boardCount: 0
    }
  ]
}

function guessUsernameFromEmail(email, fallback) {
  const raw = String(email || '').trim()
  const atIndex = raw.indexOf('@')
  if (atIndex > 0) {
    return raw.slice(0, atIndex)
  }

  return String(fallback || '').trim() || 'user'
}

function normalizeMemberType(type) {
  if (type === 'guest-single' || type === 'guest-multi') {
    return type
  }

  return 'members'
}

function normalizeMemberRole(role) {
  if (role === 'admin' || role === 'observer') {
    return role
  }

  return 'member'
}

function normalizeMembers(rawMembers) {
  if (!Array.isArray(rawMembers) || !rawMembers.length) {
    return createDefaultMembers()
  }

  const normalized = rawMembers.map((item, index) => {
    const name = String(item?.name || '').trim() || `Member ${index + 1}`
    const email = String(item?.email || '').trim()
    const type = normalizeMemberType(item?.type)
    const username = String(item?.username || '').trim() || guessUsernameFromEmail(email, `user${index + 1}`)
    const lastActiveAt = String(item?.lastActiveAt || '').trim() || new Date().toISOString()
    const boardCount = Number.isFinite(Number(item?.boardCount)) ? Math.max(0, Number(item?.boardCount)) : 0

    return {
      id: String(item?.id || createId('member')),
      name,
      email,
      role: normalizeMemberRole(item?.role),
      type,
      username,
      lastActiveAt,
      boardCount
    }
  })

  const memberList = normalized.filter((item) => item.type === 'members')
  if (memberList.length && !memberList.some((item) => item.role === 'admin')) {
    memberList[0].role = 'admin'
  }

  if (!memberList.length) {
    return createDefaultMembers()
  }

  return normalized
}

function normalizeJoinRequests(rawRequests) {
  if (!Array.isArray(rawRequests) || !rawRequests.length) {
    return []
  }

  return rawRequests.map((item, index) => {
    const name = String(item?.name || '').trim() || `Requester ${index + 1}`
    const username = String(item?.username || '').trim() || `requester${index + 1}`

    return {
      id: String(item?.id || createId('request')),
      name,
      username
    }
  })
}

function normalizeWorkspaceExports(rawExports) {
  if (!Array.isArray(rawExports) || !rawExports.length) {
    return []
  }

  return rawExports.map((item) => ({
    id: String(item?.id || createId('export')),
    createdAt: String(item?.createdAt || new Date().toISOString()),
    includeAttachments: Boolean(item?.includeAttachments)
  }))
}

function hydrateWorkspacePanels() {
  workspaceMembers.value = normalizeMembers(loadFromStorage(WORKSPACE_MEMBERS_KEY, []))
  workspaceJoinRequests.value = normalizeJoinRequests(loadFromStorage(WORKSPACE_JOIN_REQUESTS_KEY, []))
  workspaceExports.value = normalizeWorkspaceExports(loadFromStorage(WORKSPACE_EXPORTS_KEY, []))

  const savedSettings = loadFromStorage(WORKSPACE_SETTINGS_KEY, {})
  workspaceSettingsForm.workspaceName = String(savedSettings.workspaceName || workspaceName.value)
  workspaceSettingsForm.workspaceDescription = String(
    savedSettings.workspaceDescription || userStore.currentUser?.workspaceDescription || ''
  )
  workspaceSettingsForm.defaultBoardVisibility = ['workspace', 'private', 'public'].includes(savedSettings.defaultBoardVisibility)
    ? savedSettings.defaultBoardVisibility
    : 'workspace'
  workspaceSettingsForm.allowMemberInvite = typeof savedSettings.allowMemberInvite === 'boolean'
    ? savedSettings.allowMemberInvite
    : true
  workspaceSettingsForm.allowPublicBoard = typeof savedSettings.allowPublicBoard === 'boolean'
    ? savedSettings.allowPublicBoard
    : false
  workspaceSettingsForm.workspaceVisibility = savedSettings.workspaceVisibility === 'public' ? 'public' : 'private'
  workspaceSettingsForm.boardCreateRule = savedSettings.boardCreateRule === 'admins' ? 'admins' : 'members'
  workspaceSettingsForm.boardDeleteRule = savedSettings.boardDeleteRule === 'members' ? 'members' : 'admins'
  workspaceSettingsForm.aiEnabled = Boolean(savedSettings.aiEnabled)
}

function persistWorkspaceSettings() {
  const nextWorkspaceName = workspaceSettingsForm.workspaceName.trim() || workspaceName.value
  const nextWorkspaceDescription = workspaceSettingsForm.workspaceDescription.trim()

  saveToStorage(WORKSPACE_SETTINGS_KEY, {
    workspaceName: nextWorkspaceName,
    workspaceDescription: nextWorkspaceDescription,
    defaultBoardVisibility: workspaceSettingsForm.defaultBoardVisibility,
    allowMemberInvite: workspaceSettingsForm.allowMemberInvite,
    allowPublicBoard: workspaceSettingsForm.allowPublicBoard,
    workspaceVisibility: workspaceSettingsForm.workspaceVisibility,
    boardCreateRule: workspaceSettingsForm.boardCreateRule,
    boardDeleteRule: workspaceSettingsForm.boardDeleteRule,
    aiEnabled: workspaceSettingsForm.aiEnabled
  })
}

function saveWorkspaceMembers() {
  const membersOnly = workspaceMembers.value.filter((member) => member.type === 'members')
  if (!membersOnly.some((member) => member.role === 'admin') && membersOnly.length) {
    membersOnly[0].role = 'admin'
  }

  saveToStorage(WORKSPACE_MEMBERS_KEY, workspaceMembers.value)
}

function persistWorkspaceJoinRequests() {
  saveToStorage(WORKSPACE_JOIN_REQUESTS_KEY, workspaceJoinRequests.value)
}

function persistWorkspaceExports() {
  saveToStorage(WORKSPACE_EXPORTS_KEY, workspaceExports.value)
}

function sanitizeRecentBoardStarIds(rawIds) {
  if (!Array.isArray(rawIds)) {
    return []
  }

  const boardIdSet = new Set(boards.value.map((board) => board.id))

  return rawIds
    .map((id) => String(id || '').trim())
    .filter((id, index, list) => id && boardIdSet.has(id) && list.indexOf(id) === index)
    .slice(0, HOME_RECENT_STAR_LIMIT)
}

function hydrateRecentBoardStars() {
  const loaded = loadFromStorage(HOME_RECENT_STARS_KEY, [])
  starredRecentBoardIds.value = sanitizeRecentBoardStarIds(loaded)
}

function persistRecentBoardStars() {
  saveToStorage(HOME_RECENT_STARS_KEY, starredRecentBoardIds.value)
}

function isRecentBoardStarred(boardId) {
  return starredRecentBoardIds.value.includes(boardId)
}

function toggleRecentBoardStar(boardId) {
  const nextId = String(boardId || '').trim()
  if (!nextId) {
    return
  }

  if (isRecentBoardStarred(nextId)) {
    starredRecentBoardIds.value = starredRecentBoardIds.value.filter((id) => id !== nextId)
    ElMessage.success(t('workspaceHome.recentUnstarredHint'))
  } else {
    starredRecentBoardIds.value = [nextId, ...starredRecentBoardIds.value.filter((id) => id !== nextId)]
      .slice(0, HOME_RECENT_STAR_LIMIT)
    ElMessage.success(t('workspaceHome.recentStarredHint'))
  }

  persistRecentBoardStars()
}

function reorderStarredBoards(sourceBoardId, targetBoardId) {
  const sourceId = String(sourceBoardId || '').trim()
  const targetId = String(targetBoardId || '').trim()

  if (!sourceId || !targetId || sourceId === targetId) {
    return
  }

  const nextOrder = [...starredRecentBoardIds.value]
  const sourceIndex = nextOrder.indexOf(sourceId)
  const targetIndex = nextOrder.indexOf(targetId)

  if (sourceIndex < 0 || targetIndex < 0) {
    return
  }

  nextOrder.splice(sourceIndex, 1)
  nextOrder.splice(targetIndex, 0, sourceId)
  starredRecentBoardIds.value = nextOrder
  persistRecentBoardStars()
}

function onStarBoardDragStart(boardId, event) {
  if (recentGroup.value !== 'starred') {
    return
  }

  const dragId = String(boardId || '').trim()
  if (!dragId) {
    return
  }

  draggingStarBoardId.value = dragId

  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', dragId)
  }
}

function onStarBoardDragOver(boardId, event) {
  if (recentGroup.value !== 'starred') {
    return
  }

  const targetId = String(boardId || '').trim()
  if (!targetId || draggingStarBoardId.value === targetId) {
    return
  }

  event.preventDefault()
  if (event?.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onStarBoardDrop(boardId, event) {
  if (recentGroup.value !== 'starred') {
    return
  }

  event.preventDefault()
  const targetId = String(boardId || '').trim()
  const sourceFromEvent = String(event?.dataTransfer?.getData('text/plain') || '').trim()
  const sourceId = draggingStarBoardId.value || sourceFromEvent

  reorderStarredBoards(sourceId, targetId)
  draggingStarBoardId.value = ''
}

function onStarBoardDragEnd() {
  draggingStarBoardId.value = ''
}

function resetSearchFilters() {
  searchFilters.sortBy = 'relevance'
  searchFilters.type = 'all'
  searchFilters.visibility = 'all'
  searchFilters.labelId = ''
  searchFilters.assignee = ''
  searchFilters.dueState = 'all'
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getHighlightSegments(value) {
  const source = String(value || '')
  if (!source) {
    return []
  }

  if (!highlightTokens.value.length) {
    return [
      {
        text: source,
        match: false
      }
    ]
  }

  const pattern = new RegExp(`(${highlightTokens.value.map((item) => escapeRegExp(item)).join('|')})`, 'ig')
  const rawSegments = source.split(pattern).filter((item) => item !== '')

  return rawSegments.map((segment) => ({
    text: segment,
    match: highlightTokens.value.includes(segment.toLowerCase())
  }))
}

function getSearchFieldLabel(fieldKey) {
  const normalized = String(fieldKey || '').trim()
  if (!normalized) {
    return t('workspaceHome.globalSearchFieldUnknown')
  }

  const keyMap = {
    boardTitle: 'workspaceHome.globalSearchFieldBoardTitle',
    boardDescription: 'workspaceHome.globalSearchFieldBoardDescription',
    cardTitle: 'workspaceHome.globalSearchFieldCardTitle',
    cardDescription: 'workspaceHome.globalSearchFieldCardDescription',
    listTitle: 'workspaceHome.globalSearchFieldListTitle',
    comments: 'workspaceHome.globalSearchFieldComments',
    checklist: 'workspaceHome.globalSearchFieldChecklist',
    assignees: 'workspaceHome.globalSearchFieldAssignees'
  }

  return t(keyMap[normalized] || 'workspaceHome.globalSearchFieldUnknown')
}

function openSearchBoard(boardId) {
  const board = boardStore.findBoard(boardId)
  if (!boardStore.canAccessBoard(board, viewerAccess.value)) {
    ElMessage.warning(t('boardHome.noAccess'))
    return
  }

  boardStore.setCurrentBoard(boardId)
  router.push({
    name: 'board',
    params: { id: boardId },
    query: {
      q: globalSearchKeyword.value || undefined
    }
  })
}

function openSearchCard(result) {
  boardStore.setCurrentBoard(result.boardId)
  router.push({
    name: 'board',
    params: { id: result.boardId },
    query: {
      q: globalSearchKeyword.value || undefined,
      listId: result.listId,
      cardId: result.cardId
    }
  })
}

function formatSearchDueDate(value) {
  if (!value) {
    return t('workspaceHome.globalSearchDueNone')
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return t('workspaceHome.globalSearchDueNone')
  }

  return parsed.toLocaleDateString(userStore.locale === 'en' ? 'en-US' : 'zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

function formatSearchUpdateDate(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '--'
  }

  return parsed.toLocaleDateString(userStore.locale === 'en' ? 'en-US' : 'zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

function openBoard(boardId) {
  const board = boardStore.findBoard(boardId)
  if (!boardStore.canAccessBoard(board, viewerAccess.value)) {
    ElMessage.warning(t('boardHome.noAccess'))
    return
  }

  boardStore.setCurrentBoard(boardId)
  router.push({
    name: 'board',
    params: { id: boardId }
  })
}

function handleTemplateNavigate(target) {
  if (target === 'home') {
    activeSideNav.value = 'home'
    activeWorkspaceTab.value = 'boards'
    return
  }

  activeSideNav.value = 'boards'
  activeWorkspaceTab.value = 'boards'
}

function openWorkspacePanel() {
  activeSideNav.value = 'boards'
  activeWorkspaceTab.value = 'boards'

  if (route.query.q) {
    const nextQuery = { ...route.query }
    delete nextQuery.q
    router.replace({ query: nextQuery })
  }
}

function toggleWorkspaceManage() {
  const next = !workspaceManageExpanded.value
  workspaceManageExpanded.value = next

  if (next) {
    openWorkspacePanel()
  }
}

function setWorkspaceTab(tabKey) {
  openWorkspacePanel()
  activeWorkspaceTab.value = String(tabKey || '').trim() || 'boards'
}

function canRemoveWorkspaceMember(member) {
  if (!member) {
    return false
  }

  const isOwner = member.id === ownerMemberId.value
  const isSelf = String(member.email || '').trim().toLowerCase() === currentUserEmail.value

  if (!isOwner) {
    return true
  }

  if (!isSelf) {
    return false
  }

  const adminCount = workspaceMembers.value.filter((item) => item.type === 'members' && item.role === 'admin').length
  return adminCount > 1
}

function getWorkspaceMemberActionLabel(member) {
  const isSelf = String(member?.email || '').trim().toLowerCase() === currentUserEmail.value
  return isSelf ? t('workspaceHome.memberLeave') : t('workspaceHome.removeMember')
}

function formatMemberLastActive(value) {
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

function formatExportDate(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '--'
  }

  return parsed.toLocaleString(userStore.locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function openCreateDialog() {
  createTitleTouched.value = false
  moreBackgroundPanelVisible.value = false
  moreBackgroundPage.value = 1
  editingBoardId.value = ''
  createForm.title = ''
  createForm.visibility = workspaceSettingsForm.defaultBoardVisibility
  createForm.background = {
    ...DEFAULT_BOARD_BACKGROUND
  }
  createDialogVisible.value = true
}

function openEditDialog(board) {
  editingBoardId.value = board.id
  editForm.title = board.title
  editForm.description = board.description
  editDialogVisible.value = true
}

function resetCreateForm() {
  createTitleTouched.value = false
  moreBackgroundPanelVisible.value = false
  moreBackgroundPage.value = 1
  createForm.title = ''
  createForm.visibility = 'workspace'
  createForm.background = {
    ...DEFAULT_BOARD_BACKGROUND
  }
}

function resetEditForm() {
  editingBoardId.value = ''
  editForm.title = ''
  editForm.description = ''
}

function setImageBackground(imageUrl) {
  createForm.background = {
    kind: 'image',
    value: imageUrl
  }
}

function pickImageFromPanel(imageUrl) {
  setImageBackground(imageUrl)
  closeMoreBackgroundPanel()
}

function openMoreBackgroundPanel() {
  moreBackgroundPage.value = 1
  moreBackgroundPanelVisible.value = true
}

function closeMoreBackgroundPanel() {
  moreBackgroundPanelVisible.value = false
}

function goMoreBackgroundPage(nextPage) {
  moreBackgroundPage.value = Math.min(
    moreBackgroundTotalPages.value,
    Math.max(1, Number(nextPage) || 1)
  )
}

function setColorBackground(color) {
  createForm.background = {
    kind: 'color',
    value: color
  }
}

function isSelectedImage(imageUrl) {
  return createForm.background.kind === 'image' && createForm.background.value === imageUrl
}

function isSelectedColor(color) {
  return createForm.background.kind === 'color' && createForm.background.value === color
}

function submitCreateBoard(fromTemplate) {
  createTitleTouched.value = true
  const title = createForm.title.trim()
  if (!title) {
    ElMessage.warning(t('boardHome.titleRequired'))
    return
  }

  const newBoard = boardStore.createBoard({
    title,
    description: '',
    visibility: workspaceSettingsForm.allowPublicBoard ? createForm.visibility : (createForm.visibility === 'public' ? 'workspace' : createForm.visibility),
    background: createForm.background,
    ownerEmail: currentUserEmail.value,
    workspaceKey: currentWorkspaceKey.value,
    fromTemplate: Boolean(fromTemplate)
  })

  createDialogVisible.value = false
  ElMessage.success(t(fromTemplate ? 'boardHome.createdFromTemplate' : 'boardHome.created'))
  openBoard(newBoard.id)
}

function createBoardFromTemplate(templatePayload = {}) {
  const title = String(templatePayload.title || '').trim() || t('boardHome.createBoard')

  const newBoard = boardStore.createBoard({
    title,
    description: String(templatePayload.description || '').trim(),
    visibility: workspaceSettingsForm.allowPublicBoard
      ? workspaceSettingsForm.defaultBoardVisibility
      : (workspaceSettingsForm.defaultBoardVisibility === 'public' ? 'workspace' : workspaceSettingsForm.defaultBoardVisibility),
    background: templatePayload.background || { ...DEFAULT_BOARD_BACKGROUND },
    ownerEmail: currentUserEmail.value,
    workspaceKey: currentWorkspaceKey.value,
    fromTemplate: true,
    templateLists: Array.isArray(templatePayload.lists) ? templatePayload.lists : undefined
  })

  ElMessage.success(t('boardHome.createdFromTemplate'))
  activeSideNav.value = 'boards'
  activeWorkspaceTab.value = 'boards'
  openBoard(newBoard.id)
}

function submitEditBoard() {
  const title = editForm.title.trim()
  if (!title) {
    ElMessage.warning(t('boardHome.titleRequired'))
    return
  }

  boardStore.updateBoard(editingBoardId.value, {
    title,
    description: editForm.description.trim()
  })
  ElMessage.success(t('boardHome.updated'))
  editDialogVisible.value = false
}

function getBoardCoverStyle(board) {
  return getBoardBackgroundStyle(board?.background)
}

function inviteMember() {
  if (!workspaceSettingsForm.allowMemberInvite) {
    ElMessage.warning(t('workspaceHome.inviteDisabled'))
    return
  }

  const raw = String(inviteForm.query || '').trim()
  if (!raw) {
    ElMessage.warning(t('workspaceHome.memberQueryRequired'))
    return
  }

  const isEmailLike = raw.includes('@')
  const email = isEmailLike ? raw.toLowerCase() : ''
  const name = isEmailLike ? (raw.split('@')[0] || raw) : raw

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    ElMessage.warning(t('auth.emailRequired'))
    return
  }

  if (email && workspaceMembers.value.some((member) => String(member.email || '').toLowerCase() === email)) {
    ElMessage.warning(t('workspaceHome.memberExists'))
    return
  }

  const username = isEmailLike ? guessUsernameFromEmail(email, name) : String(name || '').trim().toLowerCase().replace(/\s+/g, '-')

  workspaceMembers.value.unshift({
    id: createId('member'),
    name: String(name || '').trim() || t('accountMenu.nameFallback'),
    email,
    role: normalizeMemberRole(inviteForm.role),
    type: 'members',
    username,
    lastActiveAt: new Date().toISOString(),
    boardCount: 0
  })

  saveWorkspaceMembers()
  inviteForm.query = ''
  inviteForm.role = 'member'
  ElMessage.success(t('workspaceHome.memberAdded'))
}

function removeMember(memberId) {
  const target = workspaceMembers.value.find((member) => member.id === memberId)
  if (!target) {
    return
  }

  const isSelf = String(target.email || '').trim().toLowerCase() === currentUserEmail.value
  const isOwner = target.id === ownerMemberId.value

  if (isOwner && !isSelf) {
    return
  }

  if (isOwner && isSelf) {
    const adminCount = workspaceMembers.value.filter((item) => item.type === 'members' && item.role === 'admin').length
    if (adminCount <= 1) {
      ElMessage.warning(t('workspaceHome.memberLeaveBlocked'))
      return
    }
  }

  workspaceMembers.value = workspaceMembers.value.filter((member) => member.id !== memberId)
  saveWorkspaceMembers()
  ElMessage.success(isSelf ? t('workspaceHome.memberLeft') : t('workspaceHome.memberRemoved'))
}

function saveWorkspaceSettings() {
  const nextWorkspaceName = workspaceSettingsForm.workspaceName.trim()
  const nextWorkspaceDescription = workspaceSettingsForm.workspaceDescription.trim()

  if (nextWorkspaceName) {
    userStore.updateProfile({
      workspaceName: nextWorkspaceName,
      workspaceDescription: nextWorkspaceDescription
    })
  }

  persistWorkspaceSettings()
  ElMessage.success(t('workspaceHome.settingsSaved'))
}

function approveWorkspaceJoinRequest(requestId) {
  const targetId = String(requestId || '').trim()
  const req = workspaceJoinRequests.value.find((item) => item.id === targetId)
  if (!req) {
    return
  }

  workspaceJoinRequests.value = workspaceJoinRequests.value.filter((item) => item.id !== targetId)
  persistWorkspaceJoinRequests()

  workspaceMembers.value.unshift({
    id: createId('member'),
    name: req.name,
    email: '',
    role: 'member',
    type: 'members',
    username: req.username,
    lastActiveAt: new Date().toISOString(),
    boardCount: 0
  })
  saveWorkspaceMembers()
  ElMessage.success(t('workspaceHome.requestApproved'))
}

function rejectWorkspaceJoinRequest(requestId) {
  const targetId = String(requestId || '').trim()
  const exists = workspaceJoinRequests.value.some((item) => item.id === targetId)
  if (!exists) {
    return
  }

  workspaceJoinRequests.value = workspaceJoinRequests.value.filter((item) => item.id !== targetId)
  persistWorkspaceJoinRequests()
  ElMessage.success(t('workspaceHome.requestRejected'))
}

async function createWorkspaceExport() {
  const exportItem = {
    id: createId('export'),
    createdAt: new Date().toISOString(),
    includeAttachments: Boolean(exportForm.includeAttachments)
  }

  workspaceExports.value.unshift(exportItem)
  persistWorkspaceExports()
  ElMessage.success(t('workspaceHome.exportCreated'))
  await downloadWorkspaceExport(exportItem)
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

async function deleteBoard(board) {
  await ElMessageBox.confirm(
    t('boardHome.deleteConfirmContent', { title: board.title }),
    t('boardHome.deleteConfirmTitle'),
    {
    type: 'warning',
    confirmButtonText: t('boardHome.confirmDelete'),
    cancelButtonText: t('common.cancel')
    }
  )

  boardStore.deleteBoard(board.id)
  ElMessage.success(t('boardHome.deleted'))
}

async function handleBoardCommand(command, board) {
  if (command === 'open') {
    openBoard(board.id)
    return
  }

  if (command === 'edit') {
    openEditDialog(board)
    return
  }

  if (command === 'delete') {
    await deleteBoard(board)
  }
}
</script>

<style scoped>
.workspace-home {
  display: grid;
  grid-template-columns: 288px minmax(0, 1fr);
  min-height: calc(100vh - 56px);
  background: #f3f4f6;
}

.workspace-sidebar {
  border-right: 1px solid #d7dde8;
  background: #f1f2f4;
  padding: 20px 16px;
  width: 288px;
  min-height: 730px;
  box-sizing: border-box;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-nav-item {
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #23354d;
  height: 40px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}

.sidebar-nav-item span {
  font-size: 14px;
  font-weight: 600;
}

.sidebar-nav-item:hover {
  background: #e6e9ef;
}

.sidebar-nav-item.active {
  background: #dce7f6;
  color: #0a61e1;
}

.sidebar-divider {
  border-top: 1px solid #dde2ea;
  margin: 16px 0;
}

.workspace-section-title {
  margin: 0 0 8px;
  font-size: 14px;
  color: #566b87;
  font-weight: 600;
}

.workspace-switch {
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 6px 8px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #20344f;
}

.workspace-switch-caret {
  margin-left: auto;
  color: #7a8aa1;
  transition: transform 120ms ease;
}

.workspace-switch-caret.expanded {
  transform: rotate(180deg);
}

.workspace-switch:hover {
  background: #e6e9ef;
}

.workspace-avatar {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  background: linear-gradient(180deg, #5a6ee0, #2164d8);
  color: #ffffff;
  font-weight: 700;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.workspace-avatar.large {
  width: 30px;
  height: 30px;
}

.workspace-name {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  text-align: left;
}

.workspace-arrow {
  color: #5b6f8d;
}

.workspace-manage-list {
  margin-top: 6px;
  padding-left: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.workspace-manage-item {
  border: 0;
  background: transparent;
  text-align: left;
  color: #4d6586;
  font-size: 14px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.workspace-manage-item:hover {
  background: #e9edf4;
}

.workspace-manage-item.active {
  background: #e9edf4;
  color: #20344f;
  font-weight: 600;
}

.workspace-main {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.workspace-search-panel {
  border: 1px solid #d7e0ed;
  border-radius: 14px;
  background: #ffffff;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.search-panel-header h2 {
  margin: 0;
  color: #1f334f;
  font-size: 18px;
}

.search-panel-header p {
  margin: 4px 0 0;
  color: #617895;
  font-size: 13px;
}

.search-filter-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.search-result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.search-result-column {
  border: 1px solid #dbe4f0;
  border-radius: 12px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
}

.search-result-head h3 {
  margin: 0;
  color: #1f334f;
  font-size: 14px;
}

.search-board-item,
.search-card-item {
  border: 1px solid #d7e1ee;
  border-radius: 10px;
  background: #ffffff;
  width: 100%;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-board-item strong,
.search-card-main strong {
  color: #203450;
  font-size: 13px;
}

.search-board-item span,
.search-card-main span,
.search-card-meta {
  color: #607896;
  font-size: 12px;
}

.search-card-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}


.search-metrics {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-score-chip {
  padding: 2px 8px;
  border-radius: 999px;
  background: #e7f0fb;
  color: #1f4f84;
  font-size: 11px;
  font-weight: 600;
}

.search-field-chip-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.search-field-chip {
  padding: 2px 8px;
  border-radius: 999px;
  background: #f2f5fa;
  color: #4b6280;
  font-size: 11px;
}
.search-highlight-line mark,
.search-snippet mark {
  background: #fde68a;
  color: #6b4b00;
  border-radius: 3px;
  padding: 0 1px;
}

.search-snippet {
  margin: 4px 0 0;
  color: #586f8c;
  font-size: 12px;
  line-height: 1.4;
}

.search-card-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-board-item:hover,
.search-card-item:hover {
  border-color: #aac0de;
}

.search-empty {
  margin: 0;
  color: #647a96;
  font-size: 12px;
  text-align: center;
  padding: 14px 0;
}

.workspace-home-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 244px;
  gap: 18px;
  align-items: start;
}

.home-main-column {
  border: 1px solid #d7e0ed;
  border-radius: 14px;
  background: #ffffff;
  min-height: 640px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.home-inbox-head h2 {
  margin: 0;
  color: #1f334f;
  font-size: 26px;
}

.home-inbox-head p {
  margin: 8px 0 0;
  color: #607896;
  font-size: 14px;
}

.home-inbox-card {
  border: 1px solid #d5deec;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fbff, #edf4ff);
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.home-inbox-illustration {
  width: 88px;
  height: 88px;
  border-radius: 18px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #cfdcf5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex: none;
  box-shadow: inset 0 0 0 1px rgba(34, 60, 97, 0.1);
}

.wolf-mark {
  font-size: 34px;
  line-height: 1;
}

.glass-mark {
  position: absolute;
  right: 8px;
  bottom: 6px;
  font-size: 16px;
  line-height: 1;
}

.home-inbox-copy h3 {
  margin: 0;
  color: #1f334f;
  font-size: 18px;
}

.home-inbox-copy p {
  margin: 8px 0 0;
  color: #4f6785;
  font-size: 14px;
  line-height: 1.5;
}

.home-right-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home-right-block {
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-group-switch {
  display: inline-flex;
  gap: 6px;
}

.recent-group-btn {
  border: 0;
  border-radius: 999px;
  height: 28px;
  padding: 0 10px;
  background: #edf2f8;
  color: #2b4362;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.recent-group-btn.active {
  background: #dce8f9;
  color: #0f63e6;
}

.recent-drag-hint {
  margin: -2px 0 0;
  color: #6c809b;
  font-size: 12px;
}

.mini-board-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-board-tile {
  width: 160px;
  min-width: 160px;
  max-width: 160px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(20, 43, 74, 0.14);
  box-shadow: 0 1px 2px rgba(20, 43, 74, 0.12);
}

.mini-board-tile.draggable {
  cursor: grab;
}

.mini-board-tile.dragging {
  opacity: 0.7;
}

.mini-board-cover {
  width: 100%;
  height: 100%;
  padding: 8px;
  display: flex;
  align-items: flex-end;
  position: relative;
  background-size: cover;
  background-position: center;
}

.mini-board-star-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #4b6280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 100ms ease, color 100ms ease;
}

.mini-board-star-btn:hover {
  transform: scale(1.05);
}

.mini-board-star-btn.active {
  color: #e2b203;
  background: rgba(255, 255, 255, 0.98);
}

.mini-board-title {
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  max-width: calc(100% - 26px);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-right-empty {
  width: 160px;
  min-height: 72px;
  border: 1px dashed #c4cfdf;
  border-radius: 10px;
  background: #f8fbff;
  color: #637b97;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6px;
}

.home-quick-create-btn {
  border: 0;
  border-radius: 10px;
  height: 38px;
  background: #e8edf4;
  color: #2b4362;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.home-quick-create-btn:hover {
  background: #dce4ee;
}

.workspace-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.workspace-boards-panel,
.workspace-exports-panel {
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #ffffff;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workspace-boards-toolbar {
  display: grid;
  grid-template-columns: 190px 160px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.workspace-toolbar-select {
  width: 100%;
}

.workspace-toolbar-search {
  width: 100%;
}

.workspace-block-title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #1f334f;
  font-size: 16px;
}

.board-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.lowtrello-board-card {
  width: 160px;
  border: 1px solid #ced7e3;
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(20, 43, 74, 0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.lowtrello-board-card.large {
  width: 240px;
}

.lowtrello-board-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(20, 43, 74, 0.14);
}

.board-cover {
  height: 72px;
  background: linear-gradient(140deg, #5e57d8, #cd63ba);
}

.board-footer {
  min-height: 42px;
  background: #ffffff;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #1f324c;
}

.board-footer.compact {
  align-items: flex-start;
}

.board-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.board-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-visibility-chip {
  width: fit-content;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 600;
}

.board-visibility-chip.workspace {
  background: #e6edf8;
  color: #21508f;
}

.board-visibility-chip.private {
  background: #fae9ea;
  color: #9d2d33;
}

.board-visibility-chip.public {
  background: #e6f4ec;
  color: #1f7d4b;
}

.board-menu-btn {
  border: 0;
  background: transparent;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: #5b6f89;
  cursor: pointer;
}

.board-menu-btn:hover {
  background: #edf1f7;
}

.create-board-card {
  width: 240px;
  border: 1px dashed #b9c3d3;
  border-radius: 10px;
  background: #e6e8ec;
  color: #475e7e;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  min-height: 116px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.create-board-card:hover {
  background: #dde2ea;
}

.create-board-plus {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

:deep(.create-board-dialog .el-dialog__header) {
  padding: 10px 14px 0;
  margin-right: 0;
}

:deep(.create-board-dialog .el-dialog__body) {
  padding: 10px 14px 14px;
}

.create-dialog-header {
  display: grid;
  grid-template-columns: 24px 1fr 24px;
  align-items: center;
}

.create-dialog-header h3 {
  margin: 0;
  text-align: center;
  color: #1d3554;
  font-size: 16px;
  font-weight: 700;
}

.create-dialog-close {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #506987;
  cursor: pointer;
}

.create-dialog-close:hover {
  background: #eef2f8;
}

.create-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.create-preview-card {
  width: 200px;
  height: 116px;
  margin: 0 auto;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.48);
  overflow: hidden;
  padding: 8px;
  box-shadow: 0 6px 20px rgba(15, 35, 60, 0.2);
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  height: 100%;
}

.preview-grid span {
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 0 0 1px rgba(8, 33, 65, 0.08);
}

.create-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.create-block-label,
.create-field-label {
  margin: 0;
  color: #223754;
  font-size: 12px;
  font-weight: 700;
}

.required-star {
  color: #d14343;
}

.background-option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.background-image-option,
.background-more-option {
  width: 62px;
  height: 38px;
  border-radius: 7px;
  border: 2px solid transparent;
  background: #e9edf5;
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #1f3858;
  font-size: 18px;
  font-weight: 700;
}

.background-more-option {
  border: 2px dashed #afbfda;
}

.background-image-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.background-image-option.active,
.background-color-option.active {
  border-color: #0f63e6;
  box-shadow: 0 0 0 1px rgba(15, 99, 230, 0.25);
}

.background-more-option:hover,
.background-image-option:hover,
.background-color-option:hover {
  filter: brightness(1.03);
}

.background-option-row.colors {
  margin-top: 2px;
}

.background-secondary-panel {
  margin-top: 4px;
  border: 1px solid #d5deec;
  border-radius: 10px;
  background: #f8fbff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.secondary-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.secondary-panel-header h4 {
  margin: 0;
  font-size: 13px;
  color: #1f3656;
}

.secondary-panel-close {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #587292;
  cursor: pointer;
}

.secondary-panel-close:hover {
  background: #e8eff9;
}

.secondary-panel-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.secondary-image-option {
  height: 44px;
  border-radius: 7px;
  border: 2px solid transparent;
  padding: 0;
  overflow: hidden;
  background: #e6edf7;
  cursor: pointer;
}

.secondary-image-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.secondary-image-option.active {
  border-color: #0f63e6;
  box-shadow: 0 0 0 1px rgba(15, 99, 230, 0.22);
}

.secondary-panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.secondary-page-btn {
  border: 1px solid #c9d6ea;
  border-radius: 8px;
  background: #ffffff;
  color: #2f4c71;
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;
}

.secondary-page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-page-indicator {
  color: #536d8c;
  font-size: 12px;
  font-weight: 600;
}

.background-color-option {
  width: 32px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
}

.create-title-input {
  height: 36px;
  border-radius: 8px;
  border: 1px solid #b7c4d8;
  outline: none;
  padding: 0 10px;
  color: #1f334f;
  font-size: 14px;
}

.create-title-input:focus {
  border-color: #0f63e6;
  box-shadow: 0 0 0 2px rgba(15, 99, 230, 0.15);
}

.create-title-input.error {
  border-color: #d14343;
  box-shadow: 0 0 0 2px rgba(209, 67, 67, 0.14);
}

.create-field-error {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #b32929;
  font-size: 12px;
}

.visibility-select {
  width: 100%;
}

.create-dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.create-submit-btn,
.create-template-btn {
  width: 100%;
  margin: 0;
}

.create-submit-btn:disabled {
  opacity: 0.6;
}

.create-dialog-license {
  margin: 2px 0 0;
  color: #6c819d;
  font-size: 11px;
  line-height: 1.4;
}

.create-dialog-license a {
  color: #0f63e6;
  text-decoration: none;
}

.create-dialog-license a:hover {
  text-decoration: underline;
}

.workspace-main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.workspace-identity {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.workspace-identity h2 {
  margin: 0;
  font-size: 16px;
  color: #1e3250;
}

.workspace-tabs {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.workspace-tab {
  border: 0;
  border-radius: 8px;
  background: #ebedf0;
  color: #2a3f5e;
  height: 34px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.workspace-tab:hover {
  background: #dfe4ec;
}

.workspace-tab.active {
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #d0d8e4;
}

.workspace-placeholder {
  border: 1px dashed #b8c3d3;
  border-radius: 10px;
  background: #f9fafb;
  color: #607696;
  padding: 28px 18px;
}

.workspace-members-panel,
.workspace-settings-panel {
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #ffffff;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workspace-members-invite-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px auto;
  gap: 8px;
  align-items: center;
}

.workspace-members-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.workspace-member-tabs {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.workspace-member-tab {
  border: 0;
  border-radius: 999px;
  height: 30px;
  padding: 0 12px;
  background: #edf2f8;
  color: #2b4362;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.workspace-member-tab.active {
  background: #dce8f9;
  color: #0f63e6;
}

.workspace-member-search {
  width: min(360px, 100%);
}

.workspace-member-table {
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #f8fbff;
  overflow: hidden;
}

.member-table-head {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 0.6fr 0.9fr 0.7fr;
  gap: 10px;
  padding: 10px;
  color: #5b6f8d;
  font-size: 12px;
  font-weight: 700;
  background: #ffffff;
  border-bottom: 1px solid #d7e0ed;
}

.member-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 0.6fr 0.9fr 0.7fr;
  gap: 10px;
  padding: 10px;
  align-items: center;
  background: #f8fbff;
}

.member-row + .member-row {
  border-top: 1px solid #d7e0ed;
}

.member-cell {
  color: #1f334f;
  font-size: 13px;
  min-width: 0;
}

.member-cell.name {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.member-name-stack {
  min-width: 0;
}

.member-empty {
  margin: 0;
  padding: 14px 10px;
  color: #647a96;
  font-size: 12px;
  text-align: center;
}

.workspace-requests {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.request-item {
  border: 1px solid #d7e0ed;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.request-main {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.request-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hide-sm {
  display: block;
}

.workspace-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.workspace-setting-card {
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #f8fbff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-card-head h4 {
  margin: 0;
  font-size: 14px;
  color: #1f334f;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.setting-card-head p {
  margin: 6px 0 0;
  color: #617895;
  font-size: 12px;
}

.setting-control {
  width: min(360px, 100%);
}

.setting-inline-switch {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.inline-switch-label {
  color: #2b4362;
  font-size: 13px;
  font-weight: 600;
}

.workspace-export-create {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.workspace-export-hint {
  margin: 10px 0 0;
  color: #617895;
  font-size: 12px;
  line-height: 1.5;
}

.workspace-export-list {
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-item {
  border: 1px solid #d7e0ed;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.export-item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.export-item strong {
  color: #1f334f;
  font-size: 13px;
}

.export-item span {
  color: #617895;
  font-size: 12px;
}

.export-empty {
  margin: 0;
  color: #647a96;
  font-size: 12px;
  text-align: center;
  padding: 12px 0;
}

.panel-head h3 {
  margin: 0;
  font-size: 16px;
  color: #1f334f;
}

.panel-head p {
  margin: 4px 0 0;
  color: #617895;
  font-size: 13px;
}

.workspace-recent-panel {
  margin: 12px 0;
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px;
}

.workspace-subhead {
  margin: 0 0 10px;
  color: #1f334f;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.workspace-member-intro {
  margin: 8px 0 0;
  color: #617895;
  font-size: 12px;
  line-height: 1.5;
}

.member-invite-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) 128px auto;
  gap: 8px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  border: 1px solid #d7e0ed;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.member-main {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.member-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #0f63e6;
  color: #ffffff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.member-name {
  margin: 0;
  color: #1f334f;
  font-weight: 600;
  font-size: 14px;
}

.member-email {
  margin: 2px 0 0;
  color: #637993;
  font-size: 12px;
}

.member-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.member-role-select {
  width: 124px;
}

.workspace-settings-form {
  width: min(640px, 100%);
}

.workspace-setting-switches {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workspace-setting-switch-item {
  border: 1px solid #d7e0ed;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.switch-title {
  margin: 0;
  color: #1f334f;
  font-size: 14px;
  font-weight: 600;
}

.switch-sub {
  margin: 3px 0 0;
  color: #627895;
  font-size: 12px;
}

.workspace-settings-actions {
  display: flex;
  justify-content: flex-end;
}

.closed-boards-btn {
  width: fit-content;
  border: 0;
  border-radius: 8px;
  background: #e8ebef;
  color: #243954;
  font-size: 16px;
  font-weight: 600;
  padding: 10px 14px;
  cursor: pointer;
}

.closed-boards-btn:hover {
  background: #dfe4ec;
}

.recent-empty {
  border: 1px dashed #b7c2d3;
  border-radius: 10px;
  background: #f9fafb;
  color: #607696;
  min-height: 116px;
  width: min(360px, 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.workspace-board-grid {
  min-height: 120px;
}

:deep(.danger-item) {
  color: #d43131;
}

@media (max-width: 1100px) {
  .workspace-home {
    grid-template-columns: 1fr;
  }

  .workspace-sidebar {
    width: 100%;
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid #d7dde8;
  }

  .workspace-main {
    padding: 20px 14px;
  }

  .search-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-result-grid {
    grid-template-columns: 1fr;
  }

  .workspace-home-overview {
    grid-template-columns: 1fr;
  }

  .home-main-column {
    min-height: 420px;
  }

  .home-right-column {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    align-items: start;
  }

  .home-quick-create-btn {
    height: 42px;
  }

  .workspace-main-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 760px) {
  .search-filter-grid {
    grid-template-columns: 1fr;
  }

  .member-invite-grid {
    grid-template-columns: 1fr;
  }

  .workspace-members-invite-row {
    grid-template-columns: 1fr;
  }

  .workspace-boards-toolbar {
    grid-template-columns: 1fr;
  }

  .workspace-settings-grid {
    grid-template-columns: 1fr;
  }

  .hide-sm {
    display: none;
  }

  .member-table-head,
  .member-row {
    grid-template-columns: 1.6fr 0.9fr 0.7fr;
  }

  .member-item {
    flex-direction: column;
    align-items: stretch;
  }

  .member-actions {
    justify-content: space-between;
  }

  .workspace-tabs {
    flex-wrap: wrap;
  }

  .home-inbox-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .home-right-column {
    grid-template-columns: 1fr;
  }

  .mini-board-tile,
  .home-right-empty {
    width: 100%;
    min-width: 0;
    max-width: none;
  }

  .workspace-identity h2,
  .workspace-block-title,
  .closed-boards-btn {
    font-size: 16px;
  }
}
</style>

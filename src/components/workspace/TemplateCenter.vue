<template>
  <section class="template-page">
    <aside class="template-nav-panel">
      <h2>{{ text.navTitle }}</h2>

      <div class="template-category-list">
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          :class="['template-category-item', { active: selectedCategory === category.id }]"
          @click="selectedCategory = category.id"
        >
          {{ localeText(category.label) }}
        </button>
      </div>

      <div class="template-nav-bottom">
        <button type="button" class="template-nav-bottom-item" @click="emit('navigate', 'home')">
          {{ text.bottomHome }}
        </button>
        <button type="button" class="template-nav-bottom-item" @click="emit('navigate', 'boards')">
          {{ text.bottomWorkspace }}
        </button>
      </div>
    </aside>

    <section class="template-content-panel">
      <header class="template-content-header">
        <h2>{{ text.headerTitle }}</h2>

        <label class="template-search" :aria-label="text.searchPlaceholder">
          <el-icon><Search /></el-icon>
          <input
            v-model="searchKeyword"
            type="search"
            :placeholder="text.searchPlaceholder"
          >
        </label>
      </header>

      <section class="template-filter-panel">
        <div class="template-sort-row">
          <span>{{ text.sortLabel }}</span>
          <el-select v-model="sortBy" class="template-sort-select" size="small">
            <el-option :label="text.sortByUses" value="uses" />
            <el-option :label="text.sortByLatest" value="latest" />
          </el-select>
        </div>

        <div class="template-tag-row">
          <span>{{ text.tagFilterLabel }}</span>
          <div class="template-tag-list">
            <button
              type="button"
              :class="['template-tag-item', { active: selectedTag === 'all' }]"
              @click="selectedTag = 'all'"
            >
              {{ text.tagAll }}
            </button>
            <button
              v-for="tag in availableTags"
              :key="tag.id"
              type="button"
              :class="['template-tag-item', { active: selectedTag === tag.id }]"
              @click="selectedTag = tag.id"
            >
              {{ tag.label }}
            </button>
          </div>
        </div>
      </section>

      <section class="template-top-grid">
        <article class="template-top-card">
          <h3>{{ text.favoriteTitle }}</h3>
          <div v-if="favoriteTemplates.length" class="template-mini-list">
            <button
              v-for="item in favoriteTemplates"
              :key="item.id"
              type="button"
              class="template-mini-item"
              @click="openTemplateDetail(item.id)"
            >
              <span class="template-mini-cover" :style="getTemplateCoverStyle(item)"></span>
              <span class="template-mini-meta">
                <span class="template-mini-name">{{ item.title }}</span>
                <span class="template-mini-sub">{{ item.categoryName }}</span>
              </span>
            </button>
          </div>
          <p v-else class="template-top-empty">{{ text.favoriteEmpty }}</p>
        </article>

        <article class="template-top-card">
          <h3>{{ text.recentTitle }}</h3>
          <div v-if="recentTemplates.length" class="template-mini-list">
            <button
              v-for="item in recentTemplates"
              :key="item.id"
              type="button"
              class="template-mini-item"
              @click="openTemplateDetail(item.id)"
            >
              <span class="template-mini-cover" :style="getTemplateCoverStyle(item)"></span>
              <span class="template-mini-meta">
                <span class="template-mini-name">{{ item.title }}</span>
                <span class="template-mini-sub">{{ formatUses(item.uses) }}</span>
              </span>
            </button>
          </div>
          <p v-else class="template-top-empty">{{ text.recentEmpty }}</p>
        </article>
      </section>

      <section class="template-block">
        <h3>{{ text.featuredCategoryTitle }}</h3>
        <div class="featured-category-row">
          <button
            v-for="category in featuredCategories"
            :key="category.id"
            type="button"
            class="featured-category-item"
            @click="selectedCategory = category.id"
          >
            <span class="featured-category-icon">{{ localeText(category.badge) }}</span>
            <span>{{ localeText(category.label) }}</span>
          </button>
        </div>
      </section>

      <section class="template-block">
        <h3>{{ text.spotlightTitle }}</h3>
        <div class="template-grid spotlight">
          <article
            v-for="item in spotlightTemplates"
            :key="item.id"
            class="template-card spotlight-card"
            @click="openTemplateDetail(item.id)"
          >
            <div class="template-cover-wrap">
              <div class="template-cover" :style="getTemplateCoverStyle(item)"></div>
              <button class="template-fav-btn" type="button" @click.stop="toggleFavorite(item.id)">
                <el-icon>
                  <StarFilled v-if="isFavorite(item.id)" />
                  <Star v-else />
                </el-icon>
              </button>
            </div>

            <div class="template-meta">
              <p class="template-name">{{ item.title }}</p>
              <p class="template-desc">{{ item.description }}</p>
              <div class="template-footer">
                <span class="template-sub">{{ item.creator }} · {{ formatUses(item.uses) }}</span>
                <el-button size="small" @click.stop="openTemplateDetail(item.id)">{{ text.detailAction }}</el-button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="template-block">
        <h3>{{ resultsHeading }}</h3>

        <div v-if="isResultLoading" class="template-skeleton-grid">
          <article v-for="index in skeletonCardCount" :key="`skeleton-${index}`" class="template-card skeleton-card">
            <div class="template-cover skeleton-block"></div>
            <div class="template-meta skeleton-meta">
              <span class="skeleton-line line-1"></span>
              <span class="skeleton-line line-2"></span>
              <span class="skeleton-line line-3"></span>
            </div>
          </article>
        </div>

        <div
          v-else-if="visibleTemplates.length"
          ref="templateResultsViewport"
          class="template-results-viewport"
          @scroll="onResultsViewportScroll"
        >
          <div class="template-virtual-spacer" :style="{ height: `${virtualPaddingTop}px` }"></div>

          <div class="template-virtual-rows">
            <div
              v-for="row in virtualVisibleRows"
              :key="`row-${row.rowIndex}`"
              ref="virtualRowRefs"
              :data-row-index="row.rowIndex"
              class="template-grid virtualized template-virtual-row"
              :style="{ '--virtual-columns': String(virtualColumnCount) }"
            >
              <article
                v-for="item in row.items"
                :key="item.id"
                class="template-card"
                @click="openTemplateDetail(item.id)"
              >
                <div class="template-cover-wrap">
                  <div class="template-cover" :style="getTemplateCoverStyle(item)"></div>
                  <button class="template-fav-btn" type="button" @click.stop="toggleFavorite(item.id)">
                    <el-icon>
                      <StarFilled v-if="isFavorite(item.id)" />
                      <Star v-else />
                    </el-icon>
                  </button>
                </div>

                <div class="template-meta">
                  <p class="template-name">{{ item.title }}</p>
                  <p class="template-desc">{{ item.description }}</p>
                  <div class="template-footer">
                    <span class="template-sub">{{ item.creator }} · {{ formatUses(item.uses) }}</span>
                    <el-button size="small" @click.stop="openTemplateDetail(item.id)">{{ text.detailAction }}</el-button>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div class="template-virtual-spacer" :style="{ height: `${virtualPaddingBottom}px` }"></div>

          <div ref="templateLoadAnchor" class="template-load-anchor">
            <span v-if="isAppending">{{ text.loadingMore }}</span>
            <span v-else-if="hasMoreTemplates">{{ text.loadMoreHint }}</span>
            <span v-else>{{ text.noMoreTemplates }}</span>
          </div>

          <div v-if="isAppending" class="template-skeleton-grid append-loading">
            <article v-for="index in appendSkeletonCount" :key="`append-skeleton-${index}`" class="template-card skeleton-card">
              <div class="template-cover skeleton-block"></div>
              <div class="template-meta skeleton-meta">
                <span class="skeleton-line line-1"></span>
                <span class="skeleton-line line-2"></span>
                <span class="skeleton-line line-3"></span>
              </div>
            </article>
          </div>
        </div>

        <div v-else class="template-empty">{{ text.empty }}</div>
      </section>
    </section>

    <el-drawer
      v-model="detailDrawerVisible"
      :show-close="false"
      :size="430"
      append-to-body
      class="template-detail-drawer"
    >
      <section v-if="detailTemplate" class="template-detail-panel">
        <header class="detail-head">
          <div>
            <h3>{{ detailTemplate.title }}</h3>
            <p>{{ detailTemplate.description }}</p>
          </div>
          <button class="detail-close" type="button" @click="detailDrawerVisible = false">×</button>
        </header>

        <div class="detail-cover" :style="getTemplateCoverStyle(detailTemplate)"></div>

        <div class="detail-facts">
          <p>
            <strong>{{ text.templateCategoryLabel }}</strong>
            <span>{{ detailTemplate.categoryName }}</span>
          </p>
          <p>
            <strong>{{ text.templateCreatorLabel }}</strong>
            <span class="detail-author-info">
              <span class="detail-author-avatar" :style="detailAuthorAvatarStyle">{{ detailAuthorAvatarText }}</span>
              <span>{{ detailTemplate.author?.name || detailTemplate.creator }}</span>
            </span>
          </p>
          <p>
            <strong>{{ text.templateUsageLabel }}</strong>
            <span>{{ formatUses(detailTemplate.uses) }}</span>
          </p>
          <p>
            <strong>{{ text.templateUpdatedLabel }}</strong>
            <span>{{ detailUpdatedAtText }}</span>
          </p>
          <p>
            <strong>{{ text.templateStatsLabel }}</strong>
            <span>{{ templateStats }}</span>
          </p>
        </div>

        <div class="detail-share-layer">
          <el-button @click="copyTemplateFromDetail">{{ text.copyTemplateAction }}</el-button>
          <el-button @click="shareTemplateFromDetail">{{ text.shareTemplateAction }}</el-button>
        </div>

        <section class="detail-lists">
          <h4>{{ text.listPreviewTitle }}</h4>
          <div class="detail-list-grid">
            <article v-for="item in detailListPreview" :key="item.title" class="detail-list-item">
              <p class="detail-list-title">{{ item.title }}</p>
              <p v-for="card in item.cards" :key="card.title" class="detail-list-card">{{ card.title }}</p>
            </article>
          </div>
        </section>

        <footer class="detail-actions">
          <el-button @click="toggleFavorite(detailTemplate.id)">
            {{ isFavorite(detailTemplate.id) ? text.unfavoriteAction : text.favoriteAction }}
          </el-button>
          <el-button type="primary" @click="useTemplateFromDetail">{{ text.createFromTemplateAction }}</el-button>
        </footer>
      </section>
    </el-drawer>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Search, Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { loadFromStorage, saveToStorage } from '../../utils/storage'
import {
  BOARD_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_FEATURED_CATEGORY_IDS,
  TEMPLATE_SPOTLIGHT_IDS,
  TEMPLATE_TAG_LABELS,
  cloneTemplateLists,
  pickLocaleText
} from '../../utils/templateCatalog'

const FAVORITE_TEMPLATES_KEY = 'lowtrello.templates.favorite_ids.v1'
const RECENT_TEMPLATES_KEY = 'lowtrello.templates.recent_ids.v1'
const RECENT_TEMPLATES_LIMIT = 8
const TEMPLATE_PAGE_SIZE = 9
const TEMPLATE_GRID_MIN_WIDTH = 220
const TEMPLATE_GRID_GAP = 10
const TEMPLATE_CARD_ROW_HEIGHT_FALLBACK = 190
const TEMPLATE_OVERSCAN_ROWS = 2
const TEMPLATE_SKELETON_MIN_COUNT = 4
const RESULT_LOADING_DELAY = 180
const APPEND_LOADING_DELAY = 180

const emit = defineEmits(['use-template', 'navigate'])

const userStore = useUserStore()
const locale = computed(() => (userStore.locale === 'en' ? 'en' : 'zh'))

const searchKeyword = ref('')
const selectedCategory = ref('business')
const selectedTag = ref('all')
const sortBy = ref('uses')
const visibleTemplateCount = ref(TEMPLATE_PAGE_SIZE)
const detailDrawerVisible = ref(false)
const detailTemplateId = ref('')
const favoriteTemplateIds = ref([])
const recentTemplateIds = ref([])
const templateResultsViewport = ref(null)
const templateLoadAnchor = ref(null)
const virtualRowRefs = ref([])
const observerRef = ref(null)
const resizeObserverRef = ref(null)
const loadingTimerRef = ref(null)
const appendTimerRef = ref(null)
const resultsViewportWidth = ref(0)
const resultsViewportHeight = ref(0)
const resultsScrollTop = ref(0)
const rowHeightCache = ref({})
const isResultLoading = ref(true)
const isAppending = ref(false)
const resultLoadToken = ref(0)

const TEXTS = {
  zh: {
    navTitle: '模板',
    bottomHome: '主页',
    bottomWorkspace: '工作区',
    headerTitle: '模板',
    searchPlaceholder: '查找模板',
    favoriteTitle: '收藏模板',
    favoriteEmpty: '还没有收藏模板。',
    recentTitle: '最近使用模板',
    recentEmpty: '还没有最近使用记录。',
    featuredCategoryTitle: '特色类别',
    spotlightTitle: '引人注目的新模板',
    detailAction: '查看详情',
    favoriteAction: '收藏模板',
    unfavoriteAction: '取消收藏',
    copyTemplateAction: '复制模板',
    shareTemplateAction: '分享模板',
    createFromTemplateAction: '使用模板创建面板',
    empty: '未找到匹配模板。',
    sortLabel: '排序',
    sortByUses: '按使用量排序',
    sortByLatest: '按最新排序',
    tagFilterLabel: '标签筛选',
    tagAll: '全部',
    loadingMore: '正在加载更多模板...',
    loadMoreHint: '向下滚动加载更多',
    noMoreTemplates: '没有更多模板了',
    searchResultsPrefix: '搜索结果',
    categorySuffix: '模板',
    usesSuffix: '次使用',
    templateCategoryLabel: '分类',
    templateCreatorLabel: '创建者',
    templateUsageLabel: '使用量',
    templateUpdatedLabel: '最近更新',
    templateStatsLabel: '模板结构',
    listPreviewTitle: '看板结构预览',
    templateCreatedHint: '已根据模板创建面板。',
    templateCopiedHint: '模板副本已创建。',
    templateShareHint: '模板分享链接已复制。',
    templateShareFailed: '分享失败，请稍后重试。',
    listUnit: '列',
    cardUnit: '张卡片'
  },
  en: {
    navTitle: 'Templates',
    bottomHome: 'Home',
    bottomWorkspace: 'Workspace',
    headerTitle: 'Templates',
    searchPlaceholder: 'Find templates',
    favoriteTitle: 'Favorite templates',
    favoriteEmpty: 'No favorite templates yet.',
    recentTitle: 'Recently used templates',
    recentEmpty: 'No recent usage yet.',
    featuredCategoryTitle: 'Featured categories',
    spotlightTitle: 'Fresh templates',
    detailAction: 'View details',
    favoriteAction: 'Add to favorites',
    unfavoriteAction: 'Remove favorite',
    copyTemplateAction: 'Copy template',
    shareTemplateAction: 'Share template',
    createFromTemplateAction: 'Create board from template',
    empty: 'No templates found.',
    sortLabel: 'Sort',
    sortByUses: 'Sort by usage',
    sortByLatest: 'Sort by latest',
    tagFilterLabel: 'Tag filter',
    tagAll: 'All',
    loadingMore: 'Loading more templates...',
    loadMoreHint: 'Scroll to load more',
    noMoreTemplates: 'No more templates',
    searchResultsPrefix: 'Search results',
    categorySuffix: 'templates',
    usesSuffix: 'uses',
    templateCategoryLabel: 'Category',
    templateCreatorLabel: 'Creator',
    templateUsageLabel: 'Usage',
    templateUpdatedLabel: 'Last update',
    templateStatsLabel: 'Board structure',
    listPreviewTitle: 'Board structure preview',
    templateCreatedHint: 'Board created from template.',
    templateCopiedHint: 'Template copy board created.',
    templateShareHint: 'Template share link copied.',
    templateShareFailed: 'Share failed. Please try again.',
    listUnit: 'lists',
    cardUnit: 'cards'
  }
}

const text = computed(() => TEXTS[locale.value])
const categories = TEMPLATE_CATEGORIES
const allTemplateIds = new Set(BOARD_TEMPLATES.map((item) => item.id))

const normalizedTemplates = computed(() => {
  return BOARD_TEMPLATES.map((template) => {
    const category = categories.find((item) => item.id === template.categoryId)
    const listCount = Array.isArray(template.lists) ? template.lists.length : 0
    const cardCount = Array.isArray(template.lists)
      ? template.lists.reduce((sum, list) => sum + (Array.isArray(list.cards) ? list.cards.length : 0), 0)
      : 0

    return {
      ...template,
      title: pickLocaleText(locale.value, template.title),
      description: pickLocaleText(locale.value, template.description),
      categoryName: category ? pickLocaleText(locale.value, category.label) : '',
      tagIds: Array.isArray(template.tags) ? template.tags : [],
      tagNames: Array.isArray(template.tags)
        ? template.tags.map((tag) => labelForTag(tag))
        : [],
      listCount,
      cardCount
    }
  })
})

const featuredCategories = computed(() => {
  return TEMPLATE_FEATURED_CATEGORY_IDS
    .map((id) => categories.find((item) => item.id === id))
    .filter(Boolean)
})

const spotlightTemplates = computed(() => {
  return TEMPLATE_SPOTLIGHT_IDS
    .map((id) => normalizedTemplates.value.find((item) => item.id === id))
    .filter(Boolean)
})

const favoriteTemplates = computed(() => {
  return favoriteTemplateIds.value
    .map((id) => normalizedTemplates.value.find((item) => item.id === id))
    .filter(Boolean)
})

const recentTemplates = computed(() => {
  return recentTemplateIds.value
    .map((id) => normalizedTemplates.value.find((item) => item.id === id))
    .filter(Boolean)
})

const preFilteredTemplates = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const source = normalizedTemplates.value

  if (keyword) {
    return source.filter((item) => {
      return [item.title, item.description, item.creator, item.categoryName, ...item.tagNames]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }

  return source.filter((item) => item.categoryId === selectedCategory.value)
})

const availableTags = computed(() => {
  const ids = []
  preFilteredTemplates.value.forEach((item) => {
    item.tagIds.forEach((tag) => {
      if (!ids.includes(tag)) {
        ids.push(tag)
      }
    })
  })

  return ids.map((id) => ({ id, label: labelForTag(id) }))
})

const filteredTemplates = computed(() => {
  if (selectedTag.value === 'all') {
    return preFilteredTemplates.value
  }

  return preFilteredTemplates.value.filter((item) => item.tagIds.includes(selectedTag.value))
})

const sortedTemplates = computed(() => {
  const cloned = [...filteredTemplates.value]
  if (sortBy.value === 'latest') {
    return cloned.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  return cloned.sort((a, b) => Number(b.uses || 0) - Number(a.uses || 0))
})

const visibleTemplates = computed(() => {
  return sortedTemplates.value.slice(0, visibleTemplateCount.value)
})

const hasMoreTemplates = computed(() => {
  return visibleTemplates.value.length < sortedTemplates.value.length
})

const virtualColumnCount = computed(() => {
  const width = resultsViewportWidth.value
  if (!width) {
    return 1
  }

  return Math.max(1, Math.floor((width + TEMPLATE_GRID_GAP) / (TEMPLATE_GRID_MIN_WIDTH + TEMPLATE_GRID_GAP)))
})

const visibleTemplateRows = computed(() => {
  const rows = []
  const columns = virtualColumnCount.value

  for (let index = 0; index < visibleTemplates.value.length; index += columns) {
    rows.push({
      rowIndex: Math.floor(index / columns),
      items: visibleTemplates.value.slice(index, index + columns)
    })
  }

  return rows
})

const estimatedCardWidth = computed(() => {
  const columns = virtualColumnCount.value
  if (columns <= 0 || !resultsViewportWidth.value) {
    return TEMPLATE_GRID_MIN_WIDTH
  }

  const innerWidth = Math.max(0, resultsViewportWidth.value - TEMPLATE_GRID_GAP * (columns - 1))
  return Math.max(TEMPLATE_GRID_MIN_WIDTH, Math.floor(innerWidth / columns))
})

const adaptiveFallbackRowHeight = computed(() => {
  if (estimatedCardWidth.value >= 280) {
    return 206
  }

  if (estimatedCardWidth.value >= 240) {
    return 198
  }

  return TEMPLATE_CARD_ROW_HEIGHT_FALLBACK
})

const rowOffsets = computed(() => {
  const offsets = [0]
  let running = 0

  for (let rowIndex = 0; rowIndex < visibleTemplateRows.value.length; rowIndex += 1) {
    const cachedHeight = Number(rowHeightCache.value[rowIndex]) || adaptiveFallbackRowHeight.value
    const rowHeight = Math.max(adaptiveFallbackRowHeight.value, cachedHeight)
    running += rowHeight

    if (rowIndex < visibleTemplateRows.value.length - 1) {
      running += TEMPLATE_GRID_GAP
    }

    offsets.push(running)
  }

  return offsets
})

const totalVirtualHeight = computed(() => {
  return rowOffsets.value[rowOffsets.value.length - 1] || 0
})

const virtualStartRow = computed(() => {
  if (!visibleTemplateRows.value.length) {
    return 0
  }

  const base = findRowIndexByOffset(resultsScrollTop.value)
  return Math.max(0, base - TEMPLATE_OVERSCAN_ROWS)
})

const virtualEndRow = computed(() => {
  if (!visibleTemplateRows.value.length) {
    return 0
  }

  const viewportBottom = resultsScrollTop.value + (resultsViewportHeight.value || 0)
  const endBase = findRowIndexByOffset(viewportBottom)
  return Math.min(visibleTemplateRows.value.length, endBase + 1 + TEMPLATE_OVERSCAN_ROWS)
})

const virtualVisibleRows = computed(() => {
  return visibleTemplateRows.value.slice(virtualStartRow.value, virtualEndRow.value)
})

const virtualPaddingTop = computed(() => {
  return rowOffsets.value[virtualStartRow.value] || 0
})

const virtualPaddingBottom = computed(() => {
  const consumed = rowOffsets.value[virtualEndRow.value] || 0
  return Math.max(0, totalVirtualHeight.value - consumed)
})

const skeletonCardCount = computed(() => {
  return Math.max(TEMPLATE_SKELETON_MIN_COUNT, virtualColumnCount.value * 2)
})

const appendSkeletonCount = computed(() => {
  return Math.max(virtualColumnCount.value, TEMPLATE_SKELETON_MIN_COUNT)
})

const resultsHeading = computed(() => {
  const keyword = searchKeyword.value.trim()
  if (keyword) {
    return `${text.value.searchResultsPrefix} · "${keyword}"`
  }

  const matchedCategory = categories.find((item) => item.id === selectedCategory.value)
  const categoryLabel = matchedCategory ? pickLocaleText(locale.value, matchedCategory.label) : ''
  if (locale.value === 'en') {
    return `${categoryLabel} ${text.value.categorySuffix}`
  }

  return `${categoryLabel}${text.value.categorySuffix}`
})

const detailTemplate = computed(() => {
  if (!detailTemplateId.value) {
    return null
  }

  return normalizedTemplates.value.find((item) => item.id === detailTemplateId.value) || null
})

const detailListPreview = computed(() => {
  if (!detailTemplate.value || !Array.isArray(detailTemplate.value.lists)) {
    return []
  }

  return detailTemplate.value.lists.slice(0, 4).map((list) => {
    const cards = Array.isArray(list.cards) ? list.cards.slice(0, 3) : []
    return {
      title: String(list.title || '').trim(),
      cards: cards.map((card) => ({
        title: String(card.title || '').trim() || 'Task'
      }))
    }
  })
})

const templateStats = computed(() => {
  if (!detailTemplate.value) {
    return ''
  }

  if (locale.value === 'en') {
    return `${detailTemplate.value.listCount} ${text.value.listUnit} · ${detailTemplate.value.cardCount} ${text.value.cardUnit}`
  }

  return `${detailTemplate.value.listCount}${text.value.listUnit} · ${detailTemplate.value.cardCount}${text.value.cardUnit}`
})

const detailAuthorAvatarText = computed(() => {
  if (!detailTemplate.value) {
    return ''
  }

  const raw = String(detailTemplate.value.author?.avatar || detailTemplate.value.author?.name || detailTemplate.value.creator || '')
    .replace(/\s+/g, '')
  return raw.slice(0, 2).toUpperCase()
})

const detailAuthorAvatarStyle = computed(() => {
  return {
    background: detailTemplate.value?.author?.color || '#0f63e6'
  }
})

const detailUpdatedAtText = computed(() => {
  if (!detailTemplate.value?.updatedAt) {
    return '--'
  }

  const date = new Date(detailTemplate.value.updatedAt)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

onMounted(() => {
  favoriteTemplateIds.value = sanitizeTemplateIds(loadFromStorage(FAVORITE_TEMPLATES_KEY, []), 30)
  recentTemplateIds.value = sanitizeTemplateIds(loadFromStorage(RECENT_TEMPLATES_KEY, []), RECENT_TEMPLATES_LIMIT)
  triggerResultLoading()
})

onBeforeUnmount(() => {
  if (observerRef.value) {
    observerRef.value.disconnect()
    observerRef.value = null
  }

  if (resizeObserverRef.value) {
    resizeObserverRef.value.disconnect()
    resizeObserverRef.value = null
  }

  if (loadingTimerRef.value) {
    clearTimeout(loadingTimerRef.value)
    loadingTimerRef.value = null
  }

  if (appendTimerRef.value) {
    clearTimeout(appendTimerRef.value)
    appendTimerRef.value = null
  }
})

watch(availableTags, (tags) => {
  if (selectedTag.value === 'all') {
    return
  }

  if (!tags.some((item) => item.id === selectedTag.value)) {
    selectedTag.value = 'all'
  }
})

watch(
  () => [searchKeyword.value, selectedCategory.value, selectedTag.value, sortBy.value],
  () => {
    triggerResultLoading()
  }
)

watch(
  () => [hasMoreTemplates.value, isResultLoading.value],
  () => {
    nextTick(() => {
      setupInfiniteObserver()
    })
  }
)

watch(
  () => visibleTemplates.value.length,
  () => {
    nextTick(() => {
      syncResultsViewportMetrics()
      measureVirtualRowHeights()
      setupInfiniteObserver()
    })
  }
)

watch(
  () => [virtualVisibleRows.value.length, virtualStartRow.value, virtualEndRow.value, resultsViewportWidth.value, isResultLoading.value],
  () => {
    if (isResultLoading.value) {
      return
    }

    nextTick(() => {
      measureVirtualRowHeights()
    })
  }
)

watch(
  () => virtualColumnCount.value,
  (nextColumns, previousColumns) => {
    if (!previousColumns || nextColumns === previousColumns) {
      return
    }

    rowHeightCache.value = {}

    nextTick(() => {
      measureVirtualRowHeights()
    })
  }
)

function sanitizeTemplateIds(value, limit) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => String(item || '').trim())
    .filter((item, index, source) => item && source.indexOf(item) === index && allTemplateIds.has(item))
    .slice(0, limit)
}

function persistFavoriteTemplateIds() {
  saveToStorage(FAVORITE_TEMPLATES_KEY, favoriteTemplateIds.value)
}

function persistRecentTemplateIds() {
  saveToStorage(RECENT_TEMPLATES_KEY, recentTemplateIds.value)
}

function labelForTag(tagId) {
  const labels = TEMPLATE_TAG_LABELS[tagId]
  if (!labels) {
    return tagId
  }

  return pickLocaleText(locale.value, labels)
}

function localeText(value) {
  return pickLocaleText(locale.value, value)
}

function findRowIndexByOffset(offsetValue) {
  if (!visibleTemplateRows.value.length) {
    return 0
  }

  const target = Math.max(0, Number(offsetValue) || 0)
  const offsets = rowOffsets.value
  let left = 0
  let right = offsets.length - 1
  let answer = 0

  while (left <= right) {
    const middle = Math.floor((left + right) / 2)
    if (offsets[middle] <= target) {
      answer = middle
      left = middle + 1
    } else {
      right = middle - 1
    }
  }

  return Math.min(visibleTemplateRows.value.length - 1, Math.max(0, answer))
}

function syncResultsViewportMetrics() {
  if (!templateResultsViewport.value) {
    return
  }

  resultsViewportWidth.value = templateResultsViewport.value.clientWidth
  resultsViewportHeight.value = templateResultsViewport.value.clientHeight
}

function measureVirtualRowHeights() {
  const refs = Array.isArray(virtualRowRefs.value) ? virtualRowRefs.value : []
  if (!refs.length) {
    return
  }

  const nextCache = {
    ...rowHeightCache.value
  }
  let cacheChanged = false

  refs.forEach((node) => {
    const rowIndex = Number(node?.dataset?.rowIndex)
    const rawHeight = Number(node?.offsetHeight) || 0
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || rawHeight <= 0) {
      return
    }

    const normalizedHeight = Math.max(adaptiveFallbackRowHeight.value, Math.round(rawHeight))
    if (Math.abs((Number(nextCache[rowIndex]) || 0) - normalizedHeight) > 1) {
      nextCache[rowIndex] = normalizedHeight
      cacheChanged = true
    }
  })

  if (cacheChanged) {
    rowHeightCache.value = nextCache
  }
}

function setupViewportObserver() {
  if (resizeObserverRef.value) {
    resizeObserverRef.value.disconnect()
    resizeObserverRef.value = null
  }

  if (!templateResultsViewport.value || typeof ResizeObserver === 'undefined') {
    return
  }

  resizeObserverRef.value = new ResizeObserver(() => {
    syncResultsViewportMetrics()
    nextTick(() => {
      measureVirtualRowHeights()
    })
  })

  resizeObserverRef.value.observe(templateResultsViewport.value)
}

function onResultsViewportScroll(event) {
  resultsScrollTop.value = Number(event?.target?.scrollTop) || 0
}

function resetResultsViewport() {
  resultsScrollTop.value = 0

  if (templateResultsViewport.value) {
    templateResultsViewport.value.scrollTop = 0
  }
}

function triggerResultLoading() {
  resultLoadToken.value += 1
  const currentToken = resultLoadToken.value

  if (loadingTimerRef.value) {
    clearTimeout(loadingTimerRef.value)
    loadingTimerRef.value = null
  }

  if (appendTimerRef.value) {
    clearTimeout(appendTimerRef.value)
    appendTimerRef.value = null
  }

  isAppending.value = false
  isResultLoading.value = true
  visibleTemplateCount.value = TEMPLATE_PAGE_SIZE
  rowHeightCache.value = {}

  nextTick(() => {
    resetResultsViewport()
  })

  loadingTimerRef.value = setTimeout(() => {
    if (currentToken !== resultLoadToken.value) {
      return
    }

    isResultLoading.value = false

    nextTick(() => {
      syncResultsViewportMetrics()
      measureVirtualRowHeights()
      setupViewportObserver()
      setupInfiniteObserver()
    })
  }, RESULT_LOADING_DELAY)
}

function setupInfiniteObserver() {
  if (observerRef.value) {
    observerRef.value.disconnect()
    observerRef.value = null
  }

  if (isResultLoading.value || !hasMoreTemplates.value || !templateLoadAnchor.value || typeof IntersectionObserver === 'undefined') {
    return
  }

  observerRef.value = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMoreTemplates()
      }
    },
    {
      root: templateResultsViewport.value || null,
      rootMargin: '120px 0px 120px 0px'
    }
  )

  observerRef.value.observe(templateLoadAnchor.value)
}

function loadMoreTemplates() {
  if (!hasMoreTemplates.value || isAppending.value || isResultLoading.value) {
    return
  }

  isAppending.value = true

  if (appendTimerRef.value) {
    clearTimeout(appendTimerRef.value)
  }

  appendTimerRef.value = setTimeout(() => {
    visibleTemplateCount.value += TEMPLATE_PAGE_SIZE
    isAppending.value = false

    nextTick(() => {
      measureVirtualRowHeights()
      setupInfiniteObserver()
    })
  }, APPEND_LOADING_DELAY)
}

function getTemplateCoverStyle(template) {
  if (template.background?.kind === 'image') {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(9, 30, 66, 0.1), rgba(9, 30, 66, 0.35)), url("${template.background.value}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }

  return {
    background: template.background?.value || '#0c66e4'
  }
}

function formatUses(uses) {
  const value = Number(uses) || 0

  if (locale.value === 'en') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k ${text.value.usesSuffix}`
    }
    return `${value} ${text.value.usesSuffix}`
  }

  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万${text.value.usesSuffix}`
  }

  return `${value}${text.value.usesSuffix}`
}

function isFavorite(templateId) {
  return favoriteTemplateIds.value.includes(templateId)
}

function toggleFavorite(templateId) {
  if (isFavorite(templateId)) {
    favoriteTemplateIds.value = favoriteTemplateIds.value.filter((id) => id !== templateId)
  } else {
    favoriteTemplateIds.value = [templateId, ...favoriteTemplateIds.value.filter((id) => id !== templateId)].slice(0, 30)
  }

  persistFavoriteTemplateIds()
}

function openTemplateDetail(templateId) {
  detailTemplateId.value = templateId
  detailDrawerVisible.value = true
}

function markTemplateRecent(templateId) {
  recentTemplateIds.value = [templateId, ...recentTemplateIds.value.filter((id) => id !== templateId)]
    .slice(0, RECENT_TEMPLATES_LIMIT)
  persistRecentTemplateIds()
}

function copySuffixTitle(title) {
  if (locale.value === 'en') {
    return `${title} (Copy)`
  }

  return `${title}（副本）`
}

async function copyTextToClipboard(payload) {
  const textToCopy = String(payload || '')
  if (!textToCopy) {
    return false
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(textToCopy)
    return true
  }

  if (typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = textToCopy
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const succeeded = document.execCommand('copy')
  document.body.removeChild(textarea)
  return succeeded
}

async function copyTemplateFromDetail() {
  if (!detailTemplate.value) {
    return
  }

  emit('use-template', {
    id: `${detailTemplate.value.id}-copy-${Date.now()}`,
    title: copySuffixTitle(detailTemplate.value.title),
    description: detailTemplate.value.description,
    background: detailTemplate.value.background,
    lists: cloneTemplateLists(detailTemplate.value.lists)
  })

  markTemplateRecent(detailTemplate.value.id)
  ElMessage.success(text.value.templateCopiedHint)
  detailDrawerVisible.value = false
}

async function shareTemplateFromDetail() {
  if (!detailTemplate.value) {
    return
  }

  const shareUrl = `https://lowtrello.local/templates/${detailTemplate.value.id}`

  try {
    const copied = await copyTextToClipboard(shareUrl)
    if (!copied) {
      throw new Error('copy failed')
    }
    ElMessage.success(text.value.templateShareHint)
  } catch {
    ElMessage.warning(text.value.templateShareFailed)
  }
}

function useTemplateFromDetail() {
  if (!detailTemplate.value) {
    return
  }

  emit('use-template', {
    id: detailTemplate.value.id,
    title: detailTemplate.value.title,
    description: detailTemplate.value.description,
    background: detailTemplate.value.background,
    lists: cloneTemplateLists(detailTemplate.value.lists)
  })

  markTemplateRecent(detailTemplate.value.id)
  ElMessage.success(text.value.templateCreatedHint)
  detailDrawerVisible.value = false
}
</script>

<style scoped>
.template-page {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 14px;
}

.template-nav-panel {
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #f4f6fa;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-nav-panel h2 {
  margin: 0;
  color: #1f334f;
  font-size: 15px;
}

.template-category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.template-category-item {
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #2f486a;
  text-align: left;
  font-size: 13px;
  padding: 8px 10px;
  cursor: pointer;
}

.template-category-item:hover {
  background: #e6edf8;
}

.template-category-item.active {
  background: #dce7f6;
  color: #0a61e1;
  font-weight: 600;
}

.template-nav-bottom {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #d9e2ef;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.template-nav-bottom-item {
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  color: #244264;
  font-size: 13px;
  height: 32px;
  cursor: pointer;
}

.template-nav-bottom-item:hover {
  background: #e9f2ff;
}

.template-content-panel {
  border: 1px solid #d7e0ed;
  border-radius: 12px;
  background: #ffffff;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.template-content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.template-content-header h2 {
  margin: 0;
  color: #1f334f;
  font-size: 18px;
}

.template-search {
  width: min(280px, 100%);
  position: relative;
}

.template-search .el-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #68809d;
}

.template-search input {
  width: 100%;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #c9d4e4;
  padding: 0 10px 0 32px;
  outline: none;
  color: #203652;
}

.template-search input:focus {
  border-color: #0f63e6;
  box-shadow: 0 0 0 2px rgba(15, 99, 230, 0.14);
}

.template-filter-panel {
  border: 1px solid #d7e0ed;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-sort-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #2f4868;
  font-size: 13px;
}

.template-sort-select {
  width: 170px;
}

.template-tag-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.template-tag-row > span {
  color: #2f4868;
  font-size: 13px;
  line-height: 30px;
  flex: none;
}

.template-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-tag-item {
  border: 1px solid #d4deec;
  border-radius: 999px;
  height: 30px;
  padding: 0 12px;
  background: #ffffff;
  color: #264668;
  font-size: 12px;
  cursor: pointer;
}

.template-tag-item:hover {
  background: #ebf3ff;
}

.template-tag-item.active {
  border-color: #0f63e6;
  background: #dfeeff;
  color: #0f63e6;
  font-weight: 600;
}

.template-top-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.template-top-card {
  border: 1px solid #d4deec;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-top-card h3 {
  margin: 0;
  color: #1f334f;
  font-size: 14px;
}

.template-mini-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.template-mini-item {
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  padding: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  cursor: pointer;
}

.template-mini-item:hover {
  background: #e9f2ff;
}

.template-mini-cover {
  width: 42px;
  height: 28px;
  border-radius: 6px;
  flex: none;
}

.template-mini-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.template-mini-name {
  color: #1f334f;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-mini-sub {
  color: #6f859f;
  font-size: 11px;
}

.template-top-empty {
  margin: 0;
  color: #6f859f;
  font-size: 12px;
}

.template-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-block h3 {
  margin: 0;
  color: #1f334f;
  font-size: 15px;
}

.featured-category-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.featured-category-item {
  border: 1px solid #d4deec;
  border-radius: 10px;
  background: #f6f9ff;
  color: #264668;
  height: 34px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}

.featured-category-item:hover {
  background: #e9f1ff;
}

.featured-category-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0f63e6;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.template-grid.virtualized {
  grid-template-columns: repeat(var(--virtual-columns), minmax(0, 1fr));
}

.template-grid.virtualized .template-card {
  min-height: 190px;
}

.template-grid.spotlight {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.template-card {
  border: 1px solid #d4deec;
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.template-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(20, 43, 74, 0.14);
}

.template-cover-wrap {
  position: relative;
}

.template-cover {
  height: 84px;
}

.template-fav-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #f59f00;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.template-meta {
  padding: 9px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-results-viewport {
  max-height: 560px;
  overflow-y: auto;
  padding-right: 4px;
}

.template-virtual-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-virtual-row {
  width: 100%;
}

.template-virtual-spacer {
  width: 100%;
  pointer-events: none;
}

.template-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.template-skeleton-grid.append-loading {
  margin-top: 10px;
}

.skeleton-card {
  cursor: default;
  box-shadow: none;
}

.skeleton-card:hover {
  transform: none;
  box-shadow: none;
}

.skeleton-block,
.skeleton-line {
  background: linear-gradient(110deg, #edf2fa 30%, #f8fbff 45%, #edf2fa 60%);
  background-size: 220% 100%;
  animation: templateSkeletonShimmer 1.1s linear infinite;
}

.skeleton-meta {
  gap: 8px;
}

.skeleton-line {
  height: 10px;
  border-radius: 999px;
}

.skeleton-line.line-1 {
  width: 68%;
}

.skeleton-line.line-2 {
  width: 92%;
}

.skeleton-line.line-3 {
  width: 54%;
  margin-top: auto;
}

.template-name {
  margin: 0;
  color: #1f334f;
  font-size: 14px;
  font-weight: 600;
}

.template-desc {
  margin: 0;
  color: #607896;
  font-size: 12px;
  min-height: 34px;
}

.template-sub {
  margin: 0;
  color: #6f859f;
  font-size: 11px;
}

.template-footer {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.template-empty {
  border: 1px dashed #cad6e7;
  border-radius: 10px;
  background: #f9fbff;
  color: #5f7695;
  font-size: 13px;
  padding: 16px;
  text-align: center;
}

.template-load-anchor {
  margin-top: 10px;
  min-height: 34px;
  border: 1px dashed #d6e1ef;
  border-radius: 8px;
  background: #f8fbff;
  color: #6d829d;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes templateSkeletonShimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -20% 0;
  }
}

:deep(.template-detail-drawer .el-drawer__body) {
  padding: 0;
}

.template-detail-panel {
  height: 100%;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.detail-head h3 {
  margin: 0;
  color: #1f334f;
  font-size: 18px;
}

.detail-head p {
  margin: 4px 0 0;
  color: #607896;
  font-size: 13px;
}

.detail-close {
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 8px;
  background: #edf2f9;
  color: #3a5374;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.detail-cover {
  border-radius: 10px;
  height: 126px;
}

.detail-facts {
  border: 1px solid #d4deec;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-facts p {
  margin: 0;
  color: #2f4868;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.detail-facts strong {
  color: #1f334f;
}

.detail-author-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.detail-author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
}

.detail-share-layer {
  display: flex;
  gap: 8px;
}

.detail-share-layer .el-button {
  flex: 1;
}

.detail-lists {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-lists h4 {
  margin: 0;
  color: #1f334f;
  font-size: 14px;
}

.detail-list-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.detail-list-item {
  border: 1px solid #d4deec;
  border-radius: 10px;
  background: #ffffff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-list-title {
  margin: 0;
  color: #1f334f;
  font-size: 13px;
  font-weight: 600;
}

.detail-list-card {
  margin: 0;
  border-radius: 7px;
  background: #f4f7fb;
  color: #516984;
  font-size: 12px;
  padding: 5px 7px;
}

.detail-actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
}

@media (max-width: 1100px) {
  .template-page {
    grid-template-columns: 1fr;
  }

  .template-sort-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .template-sort-select {
    width: 100%;
  }

  .template-tag-row {
    flex-direction: column;
    gap: 6px;
  }

  .template-tag-row > span {
    line-height: 1.4;
  }

  .template-results-viewport {
    max-height: 520px;
  }

  .template-top-grid {
    grid-template-columns: 1fr;
  }

  .detail-list-grid {
    grid-template-columns: 1fr;
  }

  .template-nav-bottom {
    margin-top: 6px;
  }
}
</style>

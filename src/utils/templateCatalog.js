import { COLOR_BACKGROUND_OPTIONS, IMAGE_BACKGROUND_OPTIONS, MORE_IMAGE_BACKGROUND_OPTIONS } from './boardBackgrounds'

function imageAt(index) {
  const all = [...IMAGE_BACKGROUND_OPTIONS, ...MORE_IMAGE_BACKGROUND_OPTIONS]
  return all[index % all.length]?.full || IMAGE_BACKGROUND_OPTIONS[0].full
}

function colorAt(index) {
  return COLOR_BACKGROUND_OPTIONS[index % COLOR_BACKGROUND_OPTIONS.length]
}

export const TEMPLATE_CATEGORIES = [
  {
    id: 'business',
    label: { zh: '业务', en: 'Business' },
    badge: { zh: '业', en: 'BI' }
  },
  {
    id: 'design',
    label: { zh: '设计', en: 'Design' },
    badge: { zh: '设', en: 'DE' }
  },
  {
    id: 'education',
    label: { zh: '教育', en: 'Education' },
    badge: { zh: '教', en: 'ED' }
  },
  {
    id: 'engineering',
    label: { zh: '工程开发', en: 'Engineering' },
    badge: { zh: '工', en: 'EN' }
  },
  {
    id: 'marketing',
    label: { zh: '营销', en: 'Marketing' },
    badge: { zh: '营', en: 'MK' }
  },
  {
    id: 'hr-operations',
    label: { zh: 'HR 与运营', en: 'HR & Ops' },
    badge: { zh: '人', en: 'HR' }
  },
  {
    id: 'personal',
    label: { zh: '个人', en: 'Personal' },
    badge: { zh: '个', en: 'PE' }
  },
  {
    id: 'productivity',
    label: { zh: '生产力', en: 'Productivity' },
    badge: { zh: '效', en: 'PR' }
  },
  {
    id: 'product-management',
    label: { zh: '产品管理', en: 'Product Management' },
    badge: { zh: '产', en: 'PM' }
  },
  {
    id: 'project-management',
    label: { zh: '项目管理', en: 'Project Management' },
    badge: { zh: '项', en: 'PJ' }
  },
  {
    id: 'remote-work',
    label: { zh: '远程办公', en: 'Remote Work' },
    badge: { zh: '远', en: 'RW' }
  },
  {
    id: 'sales',
    label: { zh: '销售', en: 'Sales' },
    badge: { zh: '销', en: 'SA' }
  },
  {
    id: 'support',
    label: { zh: '支持', en: 'Support' },
    badge: { zh: '支', en: 'SU' }
  },
  {
    id: 'team-management',
    label: { zh: '团队管理', en: 'Team Management' },
    badge: { zh: '团', en: 'TM' }
  }
]

export const TEMPLATE_FEATURED_CATEGORY_IDS = [
  'business',
  'design',
  'education',
  'engineering',
  'marketing',
  'productivity',
  'remote-work'
]

export const TEMPLATE_SPOTLIGHT_IDS = [
  'my-tasks',
  'new-hire-onboarding',
  'tier-list'
]

const RAW_BOARD_TEMPLATES = [
  {
    id: 'my-tasks',
    categoryId: 'productivity',
    creator: 'LowTrello',
    uses: 84210,
    title: { zh: 'My Tasks', en: 'My Tasks' },
    description: { zh: '跟踪个人待办事项', en: 'Track your personal tasks' },
    background: { kind: 'image', value: imageAt(0) },
    lists: [
      { title: 'Backlog', cards: [{ title: 'Capture quick tasks' }] },
      { title: 'Today', cards: [{ title: 'Top 3 priorities' }] },
      { title: 'Done', cards: [{ title: 'Review completed work' }] }
    ]
  },
  {
    id: 'new-hire-onboarding',
    categoryId: 'hr-operations',
    creator: 'LowTrello',
    uses: 51620,
    title: { zh: 'New Hire Onboarding', en: 'New Hire Onboarding' },
    description: { zh: '帮助新员工快速融入', en: 'Help new hires ramp up quickly' },
    background: { kind: 'image', value: imageAt(1) },
    lists: [
      { title: 'Before day 1', cards: [{ title: 'Prepare account and device' }] },
      { title: 'Week 1', cards: [{ title: 'Meet team and setup tools' }] },
      { title: 'First month', cards: [{ title: 'Deliver first milestone' }] }
    ]
  },
  {
    id: 'tier-list',
    categoryId: 'product-management',
    creator: 'LowTrello',
    uses: 40310,
    title: { zh: 'Tier List', en: 'Tier List' },
    description: { zh: '创建项目优先级列表', en: 'Create priority tiers for items' },
    background: { kind: 'image', value: imageAt(2) },
    lists: [
      { title: 'S Tier', cards: [{ title: 'Critical initiatives' }] },
      { title: 'A Tier', cards: [{ title: 'Important opportunities' }] },
      { title: 'B Tier', cards: [{ title: 'Nice to have' }] }
    ]
  },
  {
    id: 'easy-peasy-crm',
    categoryId: 'business',
    creator: 'LowTrello',
    uses: 72340,
    title: { zh: 'Easy Peasy CRM', en: 'Easy Peasy CRM' },
    description: { zh: '客户关系管理', en: 'Customer relationship workflow' },
    background: { kind: 'color', value: colorAt(0) },
    lists: [
      { title: 'Leads', cards: [{ title: 'Capture inbound lead' }] },
      { title: 'Qualified', cards: [{ title: 'Discovery call booked' }] },
      { title: 'Won', cards: [{ title: 'Contract signed' }] }
    ]
  },
  {
    id: 'lean-canvas',
    categoryId: 'business',
    creator: 'LowTrello',
    uses: 48950,
    title: { zh: 'Lean Canvas', en: 'Lean Canvas' },
    description: { zh: '商业模式画布', en: 'Plan and validate your business model' },
    background: { kind: 'color', value: colorAt(1) },
    lists: [
      { title: 'Problem', cards: [{ title: 'Top customer pain points' }] },
      { title: 'Solution', cards: [{ title: 'Core value proposition' }] },
      { title: 'Metrics', cards: [{ title: 'Success metrics' }] }
    ]
  },
  {
    id: 'nonprofit-project-management',
    categoryId: 'business',
    creator: 'LowTrello',
    uses: 31580,
    title: { zh: 'Nonprofit Project Management', en: 'Nonprofit Project Management' },
    description: { zh: '非营利项目管理', en: 'Coordinate nonprofit campaigns and milestones' },
    background: { kind: 'image', value: imageAt(3) },
    lists: [
      { title: 'Planning', cards: [{ title: 'Define outreach goals' }] },
      { title: 'Execution', cards: [{ title: 'Run campaign activities' }] },
      { title: 'Impact', cards: [{ title: 'Collect success stories' }] }
    ]
  },
  {
    id: 'design-system-sprint',
    categoryId: 'design',
    creator: 'LowTrello',
    uses: 23110,
    title: { zh: 'Design System Sprint', en: 'Design System Sprint' },
    description: { zh: '设计资产和规范冲刺', en: 'Plan tokens, components and documentation' },
    background: { kind: 'image', value: imageAt(4) },
    lists: [
      { title: 'Research', cards: [{ title: 'Audit current UI' }] },
      { title: 'Build', cards: [{ title: 'Create shared components' }] },
      { title: 'Adopt', cards: [{ title: 'Migrate product screens' }] }
    ]
  },
  {
    id: 'course-planner',
    categoryId: 'education',
    creator: 'LowTrello',
    uses: 18540,
    title: { zh: 'Course Planner', en: 'Course Planner' },
    description: { zh: '课程规划与进度跟踪', en: 'Plan modules, assignments and grading' },
    background: { kind: 'color', value: colorAt(2) },
    lists: [
      { title: 'Syllabus', cards: [{ title: 'Outline weekly topics' }] },
      { title: 'Assignments', cards: [{ title: 'Prepare exercise pack' }] },
      { title: 'Review', cards: [{ title: 'Collect student feedback' }] }
    ]
  },
  {
    id: 'engineering-sprint',
    categoryId: 'engineering',
    creator: 'LowTrello',
    uses: 62980,
    title: { zh: 'Engineering Sprint', en: 'Engineering Sprint' },
    description: { zh: '工程开发冲刺规划', en: 'Track sprint stories, QA and release' },
    background: { kind: 'color', value: colorAt(3) },
    lists: [
      { title: 'Todo', cards: [{ title: 'Refine backlog issues' }] },
      { title: 'In progress', cards: [{ title: 'Implement story points' }] },
      { title: 'Release', cards: [{ title: 'Prepare release notes' }] }
    ]
  },
  {
    id: 'campaign-calendar',
    categoryId: 'marketing',
    creator: 'LowTrello',
    uses: 44200,
    title: { zh: 'Campaign Calendar', en: 'Campaign Calendar' },
    description: { zh: '营销活动排期与执行', en: 'Schedule campaign work across channels' },
    background: { kind: 'image', value: imageAt(5) },
    lists: [
      { title: 'Plan', cards: [{ title: 'Define campaign goal' }] },
      { title: 'Create', cards: [{ title: 'Draft campaign assets' }] },
      { title: 'Launch', cards: [{ title: 'Publish and monitor' }] }
    ]
  },
  {
    id: 'product-roadmap',
    categoryId: 'product-management',
    creator: 'LowTrello',
    uses: 55730,
    title: { zh: 'Product Roadmap', en: 'Product Roadmap' },
    description: { zh: '产品路线图和版本节奏', en: 'Organize initiatives and release milestones' },
    background: { kind: 'image', value: imageAt(6) },
    lists: [
      { title: 'Now', cards: [{ title: 'Q2 top initiative' }] },
      { title: 'Next', cards: [{ title: 'Q3 strategic bet' }] },
      { title: 'Later', cards: [{ title: 'Explore future ideas' }] }
    ]
  },
  {
    id: 'project-delivery',
    categoryId: 'project-management',
    creator: 'LowTrello',
    uses: 52140,
    title: { zh: 'Project Delivery', en: 'Project Delivery' },
    description: { zh: '项目里程碑和交付管理', en: 'Coordinate scope, execution and handover' },
    background: { kind: 'image', value: imageAt(7) },
    lists: [
      { title: 'Scope', cards: [{ title: 'Finalize project scope' }] },
      { title: 'Execution', cards: [{ title: 'Track milestone status' }] },
      { title: 'Delivery', cards: [{ title: 'Customer sign-off' }] }
    ]
  },
  {
    id: 'remote-standup',
    categoryId: 'remote-work',
    creator: 'LowTrello',
    uses: 33790,
    title: { zh: 'Remote Standup', en: 'Remote Standup' },
    description: { zh: '远程团队同步与阻塞跟踪', en: 'Run async standups for distributed teams' },
    background: { kind: 'color', value: colorAt(4) },
    lists: [
      { title: 'Yesterday', cards: [{ title: 'What was completed' }] },
      { title: 'Today', cards: [{ title: 'Plan for today' }] },
      { title: 'Blockers', cards: [{ title: 'Need support from team' }] }
    ]
  },
  {
    id: 'sales-pipeline',
    categoryId: 'sales',
    creator: 'LowTrello',
    uses: 47900,
    title: { zh: 'Sales Pipeline', en: 'Sales Pipeline' },
    description: { zh: '销售线索到成交全流程', en: 'Manage opportunities from lead to close' },
    background: { kind: 'image', value: imageAt(8) },
    lists: [
      { title: 'Prospect', cards: [{ title: 'Lead qualification checklist' }] },
      { title: 'Proposal', cards: [{ title: 'Send quote package' }] },
      { title: 'Closed', cards: [{ title: 'Deal summary' }] }
    ]
  },
  {
    id: 'support-triage',
    categoryId: 'support',
    creator: 'LowTrello',
    uses: 29100,
    title: { zh: 'Support Triage', en: 'Support Triage' },
    description: { zh: '客服工单分级处理', en: 'Prioritize and resolve support tickets' },
    background: { kind: 'image', value: imageAt(9) },
    lists: [
      { title: 'New', cards: [{ title: 'Incoming tickets' }] },
      { title: 'Investigating', cards: [{ title: 'Reproduce issue details' }] },
      { title: 'Resolved', cards: [{ title: 'Confirm with customer' }] }
    ]
  },
  {
    id: 'team-operating-rhythm',
    categoryId: 'team-management',
    creator: 'LowTrello',
    uses: 26540,
    title: { zh: 'Team Operating Rhythm', en: 'Team Operating Rhythm' },
    description: { zh: '团队周会节奏与决策记录', en: 'Run weekly cadence with actions and decisions' },
    background: { kind: 'image', value: imageAt(10) },
    lists: [
      { title: 'Agenda', cards: [{ title: 'Weekly meeting agenda' }] },
      { title: 'Decisions', cards: [{ title: 'Key decisions log' }] },
      { title: 'Actions', cards: [{ title: 'Owner and due date' }] }
    ]
  },
  {
    id: 'personal-life-planner',
    categoryId: 'personal',
    creator: 'LowTrello',
    uses: 19880,
    title: { zh: 'Personal Life Planner', en: 'Personal Life Planner' },
    description: { zh: '个人生活规划与习惯跟踪', en: 'Organize personal goals and habits' },
    background: { kind: 'image', value: imageAt(11) },
    lists: [
      { title: 'Goals', cards: [{ title: 'Quarterly life goals' }] },
      { title: 'Habits', cards: [{ title: 'Daily routine tracker' }] },
      { title: 'Wins', cards: [{ title: 'Celebrate small wins' }] }
    ]
  }
]

const TEMPLATE_AUTHOR_POOL = [
  { name: 'Mia Chen', avatar: 'MC', color: '#0f63e6' },
  { name: 'Noah Park', avatar: 'NP', color: '#1f7d4b' },
  { name: 'Ava Lin', avatar: 'AL', color: '#9d2d33' },
  { name: 'Leo Wang', avatar: 'LW', color: '#7c4dff' },
  { name: 'Sofia Kim', avatar: 'SK', color: '#b45309' }
]

const CATEGORY_TAGS = {
  business: ['crm', 'strategy', 'pipeline'],
  design: ['ux', 'wireframe', 'design-system'],
  education: ['learning', 'course', 'teaching'],
  engineering: ['agile', 'sprint', 'devops'],
  marketing: ['campaign', 'content', 'social'],
  'hr-operations': ['onboarding', 'people', 'process'],
  personal: ['life', 'habit', 'goal'],
  productivity: ['todo', 'focus', 'weekly'],
  'product-management': ['roadmap', 'prioritization', 'discovery'],
  'project-management': ['milestone', 'delivery', 'planning'],
  'remote-work': ['async', 'standup', 'distributed'],
  sales: ['deal', 'customer', 'revenue'],
  support: ['ticket', 'sla', 'support'],
  'team-management': ['team', 'meeting', 'decision']
}

export const TEMPLATE_TAG_LABELS = {
  crm: { zh: 'CRM', en: 'CRM' },
  strategy: { zh: '战略', en: 'Strategy' },
  pipeline: { zh: '线索管道', en: 'Pipeline' },
  ux: { zh: 'UX', en: 'UX' },
  wireframe: { zh: '线框图', en: 'Wireframe' },
  'design-system': { zh: '设计系统', en: 'Design System' },
  learning: { zh: '学习', en: 'Learning' },
  course: { zh: '课程', en: 'Course' },
  teaching: { zh: '教学', en: 'Teaching' },
  agile: { zh: '敏捷', en: 'Agile' },
  sprint: { zh: '冲刺', en: 'Sprint' },
  devops: { zh: 'DevOps', en: 'DevOps' },
  campaign: { zh: '活动', en: 'Campaign' },
  content: { zh: '内容', en: 'Content' },
  social: { zh: '社媒', en: 'Social' },
  onboarding: { zh: '入职', en: 'Onboarding' },
  people: { zh: '人员', en: 'People' },
  process: { zh: '流程', en: 'Process' },
  life: { zh: '生活', en: 'Life' },
  habit: { zh: '习惯', en: 'Habit' },
  goal: { zh: '目标', en: 'Goal' },
  todo: { zh: '待办', en: 'Todo' },
  focus: { zh: '专注', en: 'Focus' },
  weekly: { zh: '周计划', en: 'Weekly' },
  roadmap: { zh: '路线图', en: 'Roadmap' },
  prioritization: { zh: '优先级', en: 'Prioritization' },
  discovery: { zh: '需求探索', en: 'Discovery' },
  milestone: { zh: '里程碑', en: 'Milestone' },
  delivery: { zh: '交付', en: 'Delivery' },
  planning: { zh: '规划', en: 'Planning' },
  async: { zh: '异步协作', en: 'Async' },
  standup: { zh: '站会', en: 'Standup' },
  distributed: { zh: '分布式团队', en: 'Distributed' },
  deal: { zh: '成交', en: 'Deal' },
  customer: { zh: '客户', en: 'Customer' },
  revenue: { zh: '营收', en: 'Revenue' },
  ticket: { zh: '工单', en: 'Ticket' },
  sla: { zh: 'SLA', en: 'SLA' },
  support: { zh: '支持', en: 'Support' },
  team: { zh: '团队', en: 'Team' },
  meeting: { zh: '会议', en: 'Meeting' },
  decision: { zh: '决策', en: 'Decision' }
}

function recentUpdateAt(index) {
  const base = new Date('2026-04-10T09:30:00.000Z')
  base.setDate(base.getDate() - index * 2)
  return base.toISOString()
}

function tagsFor(categoryId) {
  const tags = CATEGORY_TAGS[categoryId]
  return Array.isArray(tags) ? tags : []
}

export const BOARD_TEMPLATES = RAW_BOARD_TEMPLATES.map((template, index) => {
  return {
    ...template,
    creator: template.creator || 'LowTrello',
    author: template.author || TEMPLATE_AUTHOR_POOL[index % TEMPLATE_AUTHOR_POOL.length],
    updatedAt: template.updatedAt || recentUpdateAt(index),
    tags: Array.isArray(template.tags) && template.tags.length ? template.tags : tagsFor(template.categoryId)
  }
})

export function pickLocaleText(locale, value) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  if (locale === 'en') {
    return value.en || value.zh || ''
  }

  return value.zh || value.en || ''
}

export function cloneTemplateLists(lists) {
  if (!Array.isArray(lists)) {
    return []
  }

  return lists.map((list) => ({
    title: String(list?.title || '').trim(),
    cards: Array.isArray(list?.cards)
      ? list.cards.map((card) => ({
          title: String(card?.title || '').trim(),
          description: String(card?.description || '').trim()
        }))
      : []
  }))
}

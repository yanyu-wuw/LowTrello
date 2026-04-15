import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import HomeDashboardView from '../views/HomeDashboardView.vue'
import BoardView from '../views/BoardView.vue'
import ProfileVisibilityView from '../views/ProfileVisibilityView.vue'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: LandingView,
    meta: {
      titleKey: 'route.landingTitle'
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      guestOnly: true,
      titleKey: 'route.loginTitle'
    }
  },
  {
    path: '/home',
    name: 'home',
    component: HomeDashboardView,
    meta: {
      shell: 'workspace',
      requiresAuth: true,
      titleKey: 'route.homeTitle'
    }
  },
  {
    path: '/app',
    name: 'workspace',
    component: HomeView,
    meta: {
      shell: 'workspace',
      requiresAuth: true,
      titleKey: 'route.workspaceTitle'
    }
  },
  {
    path: '/board/:id',
    name: 'board',
    component: BoardView,
    meta: {
      shell: 'workspace',
      requiresAuth: true,
      titleKey: 'route.boardTitle'
    }
  },
  {
    path: '/settings/:section(manage-account|profile-visibility|activity|cards|settings|labs|theme|create-workspace|help|shortcuts)',
    name: 'settings-section',
    component: ProfileVisibilityView,
    meta: {
      shell: 'workspace',
      requiresAuth: true,
      titleKey: 'route.settingsTitle'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  let isLoggedIn = Boolean(userStore.isAuthenticated)

  if (to.meta?.requiresAuth && !isLoggedIn) {
    await userStore.restoreSession()
    isLoggedIn = Boolean(userStore.isAuthenticated)
  }

  if (to.meta?.guestOnly && !isLoggedIn) {
    await userStore.restoreSession()
    isLoggedIn = Boolean(userStore.isAuthenticated)
  }

  if (to.meta?.requiresAuth && !isLoggedIn) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (to.meta?.guestOnly && isLoggedIn) {
    return {
      name: 'workspace'
    }
  }

  return true
})

router.afterEach((to) => {
  const userStore = useUserStore()
  const title = typeof to.meta?.titleKey === 'string' ? userStore.t(to.meta.titleKey) : 'LowTrello'
  document.title = title
})

export default router

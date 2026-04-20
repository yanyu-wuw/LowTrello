import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createId } from '../utils/id'
import { messages } from '../i18n/messages'
import http, { configureAuthHandlers } from '../lib/http'
import { loadFromStorage, loadString, saveString, saveToStorage } from '../utils/storage'

const USER_KEY = 'lowtrello.user.v1'
const LOCALE_KEY = 'lowtrello.locale.v1'

function createDefaultUser() {
  return {
    id: createId('user'),
    name: 'Demo User',
    email: '',
    avatar: ''
  }
}

function getByPath(source, path) {
  return path.split('.').reduce((result, key) => {
    if (result && Object.prototype.hasOwnProperty.call(result, key)) {
      return result[key]
    }
    return null
  }, source)
}

export const useUserStore = defineStore('user', () => {
  // NOTE: accessToken must stay in-memory (Pinia) only.
  // We still keep non-sensitive profile fields in localStorage for convenience.
  const savedUser = loadFromStorage(USER_KEY, {
    profile: createDefaultUser()
  })

  // Migration: older versions persisted accessToken/isAuthenticated in localStorage.
  // Proactively wipe those fields so tokens are not left behind after upgrading.
  if (savedUser && typeof savedUser === 'object' && typeof savedUser.accessToken === 'string' && savedUser.accessToken) {
    saveToStorage(USER_KEY, {
      profile: savedUser.profile || createDefaultUser()
    })
  }

  const currentUser = ref(savedUser?.profile || createDefaultUser())
  const accessToken = ref('')
  const persistAccessToken = ref(false)
  const isAuthenticated = ref(false)
  const workspaces = ref([])
  const currentWorkspaceId = ref('')
  const locale = ref(loadString(LOCALE_KEY, 'zh'))
  const restoreAttempted = ref(false)
  const restoreInFlight = ref(null)

  const members = computed(() => [
    { id: 'member-current', name: currentUser.value.name || 'Demo User' },
    { id: 'member-design', name: 'Design Partner' },
    { id: 'member-engineer', name: 'Engineer' }
  ])

  function persistUser() {
    saveToStorage(USER_KEY, {
      profile: currentUser.value
    })
  }

  function clearSession() {
    accessToken.value = ''
    isAuthenticated.value = false
    workspaces.value = []
    currentWorkspaceId.value = ''
    persistUser()
  }

  function setSession({ accessToken: nextToken, user }, { remember = true } = {}) {
    accessToken.value = String(nextToken || '')
    isAuthenticated.value = Boolean(accessToken.value)

    if (user && typeof user === 'object') {
      currentUser.value = {
        ...currentUser.value,
        id: user.id || currentUser.value.id,
        email: user.email || currentUser.value.email,
        name: user.name || currentUser.value.name
      }
    }

    persistUser()

    // Fire-and-forget: hydrate workspace context for board APIs.
    if (isAuthenticated.value) {
      loadWorkspaces().catch(() => {})
    }
  }

  async function loadWorkspaces() {
    if (!isAuthenticated.value || !accessToken.value) {
      workspaces.value = []
      currentWorkspaceId.value = ''
      return []
    }

    const data = await http.authedJson('/api/workspaces')
    const list = Array.isArray(data) ? data : []
    workspaces.value = list
    const firstId = list?.[0]?.workspace?.id
    currentWorkspaceId.value = typeof firstId === 'string' ? firstId : ''
    return list
  }

  function updateProfile(payload = {}) {
    currentUser.value = {
      ...currentUser.value,
      ...payload
    }
    persistUser()
  }

  function loginWithEmail(email) {
    const trimmedEmail = String(email || '').trim()
    if (!trimmedEmail) {
      return false
    }

    const nameFromEmail = trimmedEmail.split('@')[0] || 'User'
    currentUser.value = {
      ...currentUser.value,
      email: trimmedEmail,
      name: nameFromEmail
    }
    isAuthenticated.value = true
    persistUser()
    return true
  }

  async function loginWithPassword(email, password, { remember = true } = {}) {
    const trimmedEmail = String(email || '').trim().toLowerCase()
    const trimmedPassword = String(password || '').trim()
    if (!trimmedEmail || !trimmedPassword) {
      return { ok: false, reason: 'INVALID_INPUT' }
    }

    try {
      const data = await http.json('/api/auth/login', {
        method: 'POST',
        body: {
          email: trimmedEmail,
          password: trimmedPassword
        }
      })

      setSession(data, { remember })
      return { ok: true }
    } catch (error) {
      if (error?.status === 401) return { ok: false, reason: 'INVALID_CREDENTIALS' }
      if (error?.status === 403 && error?.payload?.error === 'EMAIL_NOT_VERIFIED') {
        return { ok: false, reason: 'EMAIL_NOT_VERIFIED' }
      }
      throw error
    }
  }

  async function registerWithPassword({ email, password, name }, { remember = true } = {}) {
    const trimmedEmail = String(email || '').trim().toLowerCase()
    const trimmedPassword = String(password || '').trim()
    const trimmedName = String(name || '').trim()
    if (!trimmedEmail || !trimmedPassword || !trimmedName) {
      return { ok: false, reason: 'INVALID_INPUT' }
    }

    try {
      const data = await http.json('/api/auth/register', {
        method: 'POST',
        body: {
          email: trimmedEmail,
          password: trimmedPassword,
          name: trimmedName
        }
      })

      if (data?.accessToken) {
        setSession(data, { remember })
        return { ok: true, requiresVerification: false }
      }

      return { ok: true, requiresVerification: Boolean(data?.requiresVerification ?? true) }
    } catch (error) {
      if (error?.status === 409) return { ok: false, reason: 'EMAIL_EXISTS' }
      throw error
    }
  }

  async function verifyEmailCode(email, code, { remember = true } = {}) {
    const trimmedEmail = String(email || '').trim().toLowerCase()
    const trimmedCode = String(code || '').trim()
    if (!trimmedEmail || !trimmedCode) {
      return { ok: false, reason: 'INVALID_INPUT' }
    }

    try {
      const data = await http.json('/api/auth/verify', {
        method: 'POST',
        body: {
          email: trimmedEmail,
          code: trimmedCode
        }
      })

      setSession(data, { remember })
      return { ok: true }
    } catch (error) {
      if (error?.status === 400) {
        return { ok: false, reason: error?.payload?.error || 'VERIFY_FAILED' }
      }
      throw error
    }
  }

  async function resendVerificationCode(email) {
    const trimmedEmail = String(email || '').trim().toLowerCase()
    if (!trimmedEmail) {
      return { ok: false, reason: 'INVALID_INPUT' }
    }

    try {
      await http.json('/api/auth/resend-code', {
        method: 'POST',
        body: {
          email: trimmedEmail
        }
      })
      return { ok: true }
    } catch (error) {
      if (error?.status === 429) return { ok: false, reason: 'TOO_MANY_REQUESTS' }
      throw error
    }
  }

  async function requestPasswordReset(email) {
    const trimmedEmail = String(email || '').trim().toLowerCase()
    if (!trimmedEmail) {
      return { ok: false, reason: 'INVALID_INPUT' }
    }

    try {
      await http.json('/api/auth/request-password-reset', {
        method: 'POST',
        body: {
          email: trimmedEmail
        }
      })
      return { ok: true }
    } catch (error) {
      if (error?.status === 429) return { ok: false, reason: 'TOO_MANY_REQUESTS' }
      throw error
    }
  }

  async function resetPassword({ email, code, newPassword }) {
    const trimmedEmail = String(email || '').trim().toLowerCase()
    const trimmedCode = String(code || '').trim()
    const trimmedPassword = String(newPassword || '')
    if (!trimmedEmail || !trimmedCode || !trimmedPassword) {
      return { ok: false, reason: 'INVALID_INPUT' }
    }

    try {
      await http.json('/api/auth/reset-password', {
        method: 'POST',
        body: {
          email: trimmedEmail,
          code: trimmedCode,
          newPassword: trimmedPassword
        }
      })
      return { ok: true }
    } catch (error) {
      if (error?.status === 400) {
        return { ok: false, reason: error?.payload?.error || 'RESET_FAILED' }
      }
      throw error
    }
  }

  async function refreshAccessToken() {
    try {
      const data = await http.json('/api/auth/refresh', {
        method: 'POST',
        body: {}
      })

      setSession(data, { remember: persistAccessToken.value })
      return true
    } catch (error) {
      if (error?.status === 401) {
        clearSession()
        return false
      }

      throw error
    }
  }

  async function restoreSession() {
    if (isAuthenticated.value) return true
    if (restoreAttempted.value) return Boolean(isAuthenticated.value)

    if (restoreInFlight.value) {
      return await restoreInFlight.value
    }

    restoreAttempted.value = true
    restoreInFlight.value = (async () => {
      try {
        return await refreshAccessToken()
      } catch {
        return false
      } finally {
        restoreInFlight.value = null
      }
    })()

    return await restoreInFlight.value
  }

  function loginWithProvider(providerName) {
    currentUser.value = {
      ...currentUser.value,
      email: `${providerName.toLowerCase()}@example.com`,
      name: providerName
    }
    isAuthenticated.value = true
    persistUser()
  }

  async function logout() {
    try {
      await http.json('/api/auth/logout', { method: 'POST', body: {} })
    } catch {
      // ignore network errors on logout
    }

    clearSession()
  }

  function setLocale(nextLocale) {
    locale.value = nextLocale === 'en' ? 'en' : 'zh'
    saveString(LOCALE_KEY, locale.value)
  }

  function t(path, vars = {}) {
    const dictionary = messages[locale.value] || messages.zh
    const fallback = messages.zh
    let value = getByPath(dictionary, path)

    if (typeof value !== 'string') {
      value = getByPath(fallback, path)
    }

    if (typeof value !== 'string') {
      return path
    }

    return value.replace(/\{(\w+)\}/g, (_, key) => {
      return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : `{${key}}`
    })
  }

  // Bind auth handlers once the store is created (Pinia is ready).
  // This lets the shared http module attach Bearer tokens and auto-refresh on 401.
  configureAuthHandlers({
    getAccessToken: () => String(accessToken.value || ''),
    refreshAccessToken,
    onUnauthorized: clearSession
  })

  return {
    currentUser,
    members,
    isAuthenticated,
    accessToken,
    workspaces,
    currentWorkspaceId,
    locale,
    t,
    loadWorkspaces,
    setLocale,
    loginWithEmail,
    loginWithPassword,
    registerWithPassword,
    verifyEmailCode,
    resendVerificationCode,
    requestPasswordReset,
    resetPassword,
    refreshAccessToken,
    restoreSession,
    loginWithProvider,
    logout,
    updateProfile
  }
})

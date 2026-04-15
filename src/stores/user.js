import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createId } from '../utils/id'
import { messages } from '../i18n/messages'
import { loadFromStorage, loadString, saveString, saveToStorage } from '../utils/storage'

const USER_KEY = 'lowtrello.user.v1'
const LOCALE_KEY = 'lowtrello.locale.v1'

async function readJsonSafely(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function apiJson(path, { method = 'GET', body, headers } = {}) {
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (response.ok) {
    return await response.json()
  }

  const payload = await readJsonSafely(response)
  const error = new Error(payload?.error || `HTTP_${response.status}`)
  error.status = response.status
  error.payload = payload
  throw error
}

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
  const savedUser = loadFromStorage(USER_KEY, {
    isAuthenticated: false,
    profile: createDefaultUser(),
    accessToken: '',
    persistAccessToken: true
  })

  const currentUser = ref(savedUser?.profile || createDefaultUser())
  const accessToken = ref(String(savedUser?.accessToken || ''))
  const persistAccessToken = ref(Boolean(savedUser?.persistAccessToken))
  const isAuthenticated = ref(Boolean(savedUser?.isAuthenticated && accessToken.value))
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
      isAuthenticated: isAuthenticated.value,
      profile: currentUser.value,
      accessToken: persistAccessToken.value ? accessToken.value : '',
      persistAccessToken: persistAccessToken.value
    })
  }

  function setSession({ accessToken: nextToken, user }, { remember = true } = {}) {
    accessToken.value = String(nextToken || '')
    persistAccessToken.value = Boolean(remember)
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
      const data = await apiJson('/api/auth/login', {
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
      const data = await apiJson('/api/auth/register', {
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
      const data = await apiJson('/api/auth/verify', {
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
      await apiJson('/api/auth/resend-code', {
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
      await apiJson('/api/auth/request-password-reset', {
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
      await apiJson('/api/auth/reset-password', {
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
      const data = await apiJson('/api/auth/refresh', {
        method: 'POST',
        body: {}
      })

      setSession(data, { remember: persistAccessToken.value })
      return true
    } catch (error) {
      if (error?.status === 401) {
        accessToken.value = ''
        isAuthenticated.value = false
        persistUser()
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
      await apiJson('/api/auth/logout', { method: 'POST', body: {} })
    } catch {
      // ignore network errors on logout
    }

    accessToken.value = ''
    isAuthenticated.value = false
    persistUser()
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

  return {
    currentUser,
    members,
    isAuthenticated,
    accessToken,
    locale,
    t,
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

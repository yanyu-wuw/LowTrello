import axios from 'axios'

const client = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

let authHandlers = {
  getAccessToken: () => '',
  refreshAccessToken: async () => false,
  onUnauthorized: () => {}
}

let refreshInFlight = null

export function configureAuthHandlers(nextHandlers = {}) {
  authHandlers = {
    ...authHandlers,
    ...(nextHandlers || {})
  }
}

function getAxiosErrorMeta(error) {
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status,
      payload: error.response?.data
    }
  }

  return {
    status: undefined,
    payload: undefined
  }
}

function toHttpError(error) {
  const { status, payload } = getAxiosErrorMeta(error)
  const message = payload?.error || (status ? `HTTP_${status}` : 'NETWORK_ERROR')

  const err = new Error(message)
  err.status = status
  err.payload = payload
  err.raw = error
  return err
}

function shouldSkipRefresh(url) {
  const value = String(url || '')
  return value.startsWith('/api/auth/refresh') || value.startsWith('/api/auth/login') || value.startsWith('/api/auth/logout')
}

async function doRefreshOnce() {
  if (refreshInFlight) {
    return await refreshInFlight
  }

  refreshInFlight = (async () => {
    try {
      return await authHandlers.refreshAccessToken()
    } finally {
      refreshInFlight = null
    }
  })()

  return await refreshInFlight
}

async function requestJson(url, { method = 'GET', body, headers, auth = false } = {}) {
  const token = auth ? String(authHandlers.getAccessToken() || '') : ''

  const doRequest = async (nextToken) => {
    return await client.request({
      url,
      method,
      data: body ?? undefined,
      headers: {
        ...(auth && nextToken ? { Authorization: `Bearer ${nextToken}` } : {}),
        ...(headers || {})
      }
    })
  }

  try {
    const response = await doRequest(token)
    return response.data
  } catch (error) {
    const { status } = getAxiosErrorMeta(error)

    if (auth && status === 401 && token && !shouldSkipRefresh(url)) {
      const refreshed = await doRefreshOnce()
      if (refreshed) {
        try {
          const again = await doRequest(String(authHandlers.getAccessToken() || ''))
          return again.data
        } catch (error2) {
          const meta2 = getAxiosErrorMeta(error2)
          if (meta2.status === 401) {
            authHandlers.onUnauthorized?.()
          }
          throw toHttpError(error2)
        }
      }

      authHandlers.onUnauthorized?.()
    }

    throw toHttpError(error)
  }
}

const http = {
  configureAuthHandlers,

  request(url, options) {
    return requestJson(url, options)
  },

  json(url, options) {
    return requestJson(url, { ...(options || {}), auth: false })
  },

  authedJson(url, options) {
    return requestJson(url, { ...(options || {}), auth: true })
  }
}

export default http

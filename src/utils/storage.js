export function loadFromStorage(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch (error) {
    console.error(`Failed to parse storage key: ${key}`, error)
    return fallback
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to save storage key: ${key}`, error)
  }
}

export function loadString(key, fallback = '') {
  try {
    const rawValue = localStorage.getItem(key)
    return rawValue ?? fallback
  } catch (error) {
    console.error(`Failed to load storage key: ${key}`, error)
    return fallback
  }
}

export function saveString(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.error(`Failed to save storage key: ${key}`, error)
  }
}

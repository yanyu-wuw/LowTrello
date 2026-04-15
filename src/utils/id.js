export function createId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  const timePart = Date.now().toString(36)
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${timePart}-${randomPart}`
}

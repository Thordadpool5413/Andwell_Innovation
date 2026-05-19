const DB_KEY = "andwell-command-center"

function getDb() {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function setDb(data: Record<string, unknown>) {
  if (typeof window === "undefined") return
  localStorage.setItem(DB_KEY, JSON.stringify(data))
}

export const db = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback
    const store = getDb()
    return (store?.[key] as T) ?? fallback
  },
  set(key: string, value: unknown) {
    const store = getDb()
    store![key] = value
    setDb(store!)
  },
}

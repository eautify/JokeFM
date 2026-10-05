export const storageKeys = {
  settings: 'jokefm:settings', favorites: 'jokefm:favorites', history: 'jokefm:history',
  stats: 'jokefm:stats', playlists: 'jokefm:playlists', metadata: 'jokefm:metadata', version: 'jokefm:version',
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? { ...fallback as object, ...JSON.parse(value) } as T : fallback
  } catch { return fallback }
}

export function saveJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage may be disabled or full */ }
}

export function exportLibrary(data: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'jokefm-library.json'
  link.click()
  URL.revokeObjectURL(link.href)
}

export function validateImport(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('That file is not a JokeFM data export.')
  const data = value as Record<string, unknown>
  if (data.version !== 1 || !Array.isArray(data.favorites) || !Array.isArray(data.history)) throw new Error('The file format is invalid or not supported.')
  for (const item of [...data.favorites, ...data.history, ...(Array.isArray(data.playlists) ? data.playlists : [])]) {
    if (!item || typeof item !== 'object') throw new Error('The file contains an invalid joke record.')
    const joke = item as Record<string, unknown>
    if (typeof joke.key !== 'string' || typeof joke.category !== 'string' || !['single', 'twopart'].includes(String(joke.type)) || typeof joke.lang !== 'string' || typeof joke.id !== 'number' || !Number.isFinite(joke.id)) throw new Error('The file contains an invalid joke record.')
    if (joke.type === 'single' && typeof joke.joke !== 'string') throw new Error('The file contains an invalid single joke.')
    if (joke.type === 'twopart' && (typeof joke.setup !== 'string' || typeof joke.delivery !== 'string')) throw new Error('The file contains an invalid two-part joke.')
  }
  return data
}

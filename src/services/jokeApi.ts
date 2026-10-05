export type Joke = {
  id: number
  key: string
  category: string
  type: 'single' | 'twopart'
  joke: string | null
  setup: string | null
  delivery: string | null
  flags: Record<string, boolean>
  safe: boolean
  lang: string
  fetchedAt: number
}

export type JokeQuery = {
  categories?: string[]
  type?: string
  amount?: number
  lang?: string
  flags?: string[]
  safeMode?: boolean
  contains?: string
}

const API = 'https://v2.jokeapi.dev'
const flags = ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit']
let previousRequestAt = 0

export function buildJokeUrl(query: JokeQuery = {}) {
  const categories = query.categories?.length ? query.categories : ['Any']
  const url = new URL(`/joke/${categories.join(',')}`, API)
  const params = url.searchParams
  if (query.amount && query.amount > 1) params.set('amount', String(Math.min(10, query.amount)))
  if (query.type && query.type !== 'mixed' && query.type !== 'any') params.set('type', query.type)
  if (query.lang) params.set('lang', query.lang)
  if (query.flags?.length) params.set('blacklistFlags', query.flags.join(','))
  if (query.safeMode) params.set('safe-mode', '')
  if (query.contains?.trim()) params.set('contains', query.contains.trim())
  return url.toString()
}

function normalize(raw: any): Joke {
  if (!raw || raw.error || !Number.isFinite(raw.id) || !raw.category || !['single', 'twopart'].includes(raw.type)) {
    throw new Error(raw?.message || 'JokeAPI returned an unexpected response.')
  }
  return {
    id: raw.id,
    key: `${raw.lang || 'en'}:${raw.id}`,
    category: raw.category,
    type: raw.type,
    joke: raw.type === 'single' ? String(raw.joke || '') : null,
    setup: raw.type === 'twopart' ? String(raw.setup || '') : null,
    delivery: raw.type === 'twopart' ? String(raw.delivery || '') : null,
    flags: Object.fromEntries(flags.map(flag => [flag, Boolean(raw.flags?.[flag])])),
    safe: Boolean(raw.safe),
    lang: raw.lang || 'en',
    fetchedAt: Date.now(),
  }
}

export async function fetchJokes(query: JokeQuery = {}, signal?: AbortSignal): Promise<Joke[]> {
  const now = Date.now()
  if (now - previousRequestAt < 350) throw new Error('Please wait a moment before requesting another comedy packet.')
  previousRequestAt = now
  let response: Response
  try {
    response = await fetch(buildJokeUrl(query), { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('JokeAPI cannot be reached. Check your connection and try again.')
  }
  if (response.status === 429) throw new Error('Request limit reached. Please retry shortly.')
  if (!response.ok) throw new Error(response.status === 404 ? 'No jokes found for those filters.' : `JokeAPI signal error (${response.status}).`)
  const data = await response.json()
  if (data.error) throw new Error(data.message || 'No jokes found. Try changing a filter.')
  const list = Array.isArray(data.jokes) ? data.jokes : [data]
  const jokes = list.map(normalize)
  if (!jokes.length) throw new Error('No jokes found. Try changing a filter.')
  return jokes
}

export async function fetchMetadata(endpoint: string) {
  const allowed = new Set(['info', 'categories', 'languages', 'flags', 'formats', 'ping'])
  if (!allowed.has(endpoint)) throw new Error('Unknown metadata endpoint.')
  const response = await fetch(`${API}/${endpoint}`)
  if (response.status === 429) throw new Error('Request limit reached. Please retry shortly.')
  if (!response.ok) throw new Error(`JokeAPI signal error (${response.status}).`)
  const data = await response.json()
  if (data.error) throw new Error(data.message || 'JokeAPI returned a metadata error.')
  return data
}

export const API_BASE = API

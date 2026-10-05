import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { API_BASE, fetchJokes, fetchMetadata, type Joke } from './services/jokeApi'
import { exportLibrary, loadJson, saveJson, storageKeys, validateImport } from './services/storage'
import './App.css'

type Page = 'HOME' | 'RADIO' | 'DISCOVER' | 'GAMES' | 'LIBRARY' | 'STATS' | 'API LAB' | 'SETTINGS'
type Settings = { safeMode: boolean; flags: string[]; pauseMs: number; rate: number; pitch: number; volume: number; voiceURI: string; jokeLanguage: string; autoPlay: boolean; introEnabled: boolean; station: string }
type PlayedJoke = Joke & { lastPlayed: number; playCount: number; completed: boolean }
type GameRecord = { id: string; score: number; questions: number; date: number }
const defaults: Settings = { safeMode: true, flags: ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit'], pauseMs: 1500, rate: 0.92, pitch: 1, volume: 1, voiceURI: '', jokeLanguage: 'en', autoPlay: true, introEnabled: true, station: 'Any' }
const stations = [
  { category: 'Any', name: 'Random FM', description: 'Random laughs across the JokeAPI universe.' },
  { category: 'Programming', name: 'Programmer Hour', description: 'A steady signal for devs and keyboard comedians.' },
  { category: 'Pun', name: 'Pun Parade', description: 'Wordplay, groaners, and premium dad energy.' },
  { category: 'Spooky', name: 'Spooky Signal', description: 'A slightly eerie comedy transmission.' },
  { category: 'Christmas', name: 'Holiday Radio', description: 'Seasonal cheer, available year round.' },
  { category: 'Dark', name: 'Dark Room', description: 'A darker channel. Review content filters first.' },
  { category: 'Misc', name: 'Miscellaneous', description: 'A grab bag of comedy bits.' },
]
const categories = ['Any', 'Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas']
const tabs: Page[] = ['HOME', 'RADIO', 'DISCOVER', 'GAMES', 'LIBRARY', 'STATS', 'API LAB', 'SETTINGS']

function textOf(joke: Joke) { return joke.type === 'single' ? joke.joke || '' : `${joke.setup || ''} ${joke.delivery || ''}` }
function loadArray<T>(key: string): T[] { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T[] : [] } catch { return [] } }
function optionText(joke: Joke) { return joke.type === 'single' ? joke.joke || '' : joke.delivery || '' }
function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) { return <label className="slider-label">{label}<span>{value.toFixed(2)}</span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}/></label> }
function MiniPlayer({ joke, progress, speaking, paused, favorite, onToggle, onPrevious, onNext, onFavorite }: { joke: Joke; progress: number; speaking: boolean; paused: boolean; favorite: boolean; onToggle: () => void; onPrevious: () => void; onNext: () => void; onFavorite: () => void }) {
  const status = speaking ? paused ? 'PAUSED' : 'ON AIR' : 'READY'
  return <div className="global-player" role="region" aria-label="JokeFM mini player"><div className={speaking && !paused ? 'mini-player-art playing' : 'mini-player-art'} aria-hidden="true"><span>♫</span><i/><i/></div><div className="mini-player-info"><div className="mini-player-status"><span>JOKEFM MINI DECK</span><span className={speaking && !paused ? 'mini-live on-air' : 'mini-live'}><i/>{status}</span></div><strong>{joke.category.toUpperCase()} · {joke.type === 'twopart' ? 'TWO-PART' : 'ONE-LINER'}</strong><span className="mini-player-joke">{joke.setup || joke.joke}</span><div className="mini-progress" role="progressbar" aria-label="Speech progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }}/></div></div><div className="mini-player-controls"><button aria-label="Previous joke" title="Previous" onClick={onPrevious}>|◀</button><button className="mini-play" aria-label={speaking && !paused ? 'Pause speech' : 'Speak joke'} onClick={onToggle}>{speaking && !paused ? 'Ⅱ' : '▶'}</button><button aria-label="Next joke" title="Next" onClick={onNext}>▶|</button><button className={favorite ? 'mini-favorite saved' : 'mini-favorite'} aria-label={favorite ? 'Remove favorite' : 'Save favorite'} onClick={onFavorite}>{favorite ? '♥' : '♡'}</button></div></div>
}

function App() {
  const [page, setPage] = useState<Page>(() => {
    const route = window.location.hash.slice(1).replace('-', ' ').toUpperCase()
    return tabs.includes(route as Page) ? route as Page : 'HOME'
  })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>(() => loadJson(storageKeys.settings, defaults))
  const [favorites, setFavorites] = useState<Joke[]>(() => loadArray(storageKeys.favorites))
  const [history, setHistory] = useState<PlayedJoke[]>(() => loadArray(storageKeys.history))
  const [playlists, setPlaylists] = useState<Joke[]>(() => loadArray(storageKeys.playlists))
  const [playlistName, setPlaylistName] = useState(() => { try { return localStorage.getItem('jokefm:playlist-name') || 'My Station' } catch { return 'My Station' } })
  const [gameResults, setGameResults] = useState<GameRecord[]>(() => loadArray(storageKeys.stats))
  const [joke, setJoke] = useState<Joke | null>(null)
  const [queue, setQueue] = useState<Joke[]>([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [search, setSearch] = useState('')
  const [discoverCategory, setDiscoverCategory] = useState('Any')
  const [discoverType, setDiscoverType] = useState('mixed')
  const [results, setResults] = useState<Joke[]>([])
  const [libraryTab, setLibraryTab] = useState<'Favorites' | 'History' | 'Playlist'>('Favorites')
  const [metadata, setMetadata] = useState<Record<string, unknown>>({})
  const [metaMessage, setMetaMessage] = useState('')
  const [metaEndpoint, setMetaEndpoint] = useState('info')
  const [labCategory, setLabCategory] = useState('Programming')
  const [labType, setLabType] = useState('mixed')
  const [labAmount, setLabAmount] = useState(5)
  const [labOutput, setLabOutput] = useState('')
  const [gameMode, setGameMode] = useState('punchline')
  const [gameJoke, setGameJoke] = useState<Joke | null>(null)
  const [gameOptions, setGameOptions] = useState<string[]>([])
  const [gameFeedback, setGameFeedback] = useState('')
  const [gameScore, setGameScore] = useState(0)
  const [gameCount, setGameCount] = useState(0)
  const [deliveryRevealed, setDeliveryRevealed] = useState(false)
  const [speedSeconds, setSpeedSeconds] = useState(15)
  const [speedEnabled, setSpeedEnabled] = useState(false)
  const speechRun = useRef(0)
  const queueRef = useRef<Joke[]>([])
  const queueIndexRef = useRef(queueIndex)
  const pageRef = useRef(page)
  const settingsRef = useRef(settings)
  const voicesRef = useRef(voices)
  const nextJokeRef = useRef<() => void>(() => {})
  const refillingRef = useRef(false)
  const timerRef = useRef<number | undefined>(undefined)
  const waitingRef = useRef(false)
  const waitUntilRef = useRef(0)
  const waitRemainingRef = useRef(0)
  const continueSpeechRef = useRef<() => void>(() => {})

  useEffect(() => { saveJson(storageKeys.settings, settings) }, [settings])
  useEffect(() => { saveJson(storageKeys.favorites, favorites.slice(0, 500)) }, [favorites])
  useEffect(() => { saveJson(storageKeys.history, history.slice(0, 250)) }, [history])
  useEffect(() => { saveJson(storageKeys.playlists, playlists.slice(0, 500)) }, [playlists])
  useEffect(() => { saveJson('jokefm:playlist-name', playlistName) }, [playlistName])
  useEffect(() => { saveJson(storageKeys.stats, gameResults.slice(0, 200)) }, [gameResults])
  useEffect(() => { saveJson(storageKeys.version, { version: 1 }) }, [])
  queueRef.current = queue
  queueIndexRef.current = queueIndex
  pageRef.current = page
  settingsRef.current = settings
  voicesRef.current = voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    let attempts = 0
    let retry: number | undefined
    const update = () => {
      const available = window.speechSynthesis.getVoices()
      setVoices(available)
      if (!available.length && attempts++ < 10) retry = window.setTimeout(update, 300)
    }
    update()
    window.speechSynthesis.onvoiceschanged = update
    return () => { window.speechSynthesis.onvoiceschanged = null; window.speechSynthesis.cancel(); window.clearTimeout(retry); window.clearTimeout(timerRef.current) }
  }, [])
  useEffect(() => {
    const onPopState = () => {
      const route = window.location.hash.slice(1).replace('-', ' ').toUpperCase()
      setPage(tabs.includes(route as Page) ? route as Page : 'HOME')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  useEffect(() => {
    if ((page === 'SETTINGS' || page === 'DISCOVER') && !metadata.languages) void loadMetadata('languages')
  }, [page, metadata.languages])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return
      if (event.code === 'Space') { event.preventDefault(); toggleSpeech() }
      else if (event.key === 'ArrowRight') void nextJoke()
      else if (event.key === 'ArrowLeft') void previousJoke()
      else if (event.key.toLowerCase() === 'r') speakCurrent()
      else if (event.key.toLowerCase() === 'f') toggleFavorite()
      else if (event.key.toLowerCase() === 'm') setSettings(s => ({ ...s, volume: s.volume ? 0 : 1 }))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  useEffect(() => {
    if (gameMode !== 'speed' || !gameJoke || !speedEnabled || gameFeedback) return
    if (speedSeconds <= 0) { setGameFeedback('Time is up. Start a new question to play again.'); return }
    const id = window.setTimeout(() => setSpeedSeconds(value => value - 1), 1000)
    return () => window.clearTimeout(id)
  }, [gameMode, gameJoke, speedEnabled, speedSeconds, gameFeedback])
  const favoriteKeys = useMemo(() => new Set(favorites.map(item => item.key)), [favorites])
  const currentStation = stations.find(item => item.category === settings.station) || stations[0]
  const selectedVoice = voices.find(voice => voice.voiceURI === settings.voiceURI)
  const languageData = metadata.languages as { jokeLanguages?: (string | { code?: string; lang?: string; name?: string })[] } | undefined
  const languageNames: Record<string, string> = { en: 'English', de: 'German', es: 'Spanish', cs: 'Czech', fr: 'French', pt: 'Portuguese' }
  const jokeLanguages = languageData?.jokeLanguages?.map(item => typeof item === 'string' ? ({ code: item, name: languageNames[item] || item.toUpperCase() }) : ({ code: item.lang || item.code || '', name: item.name || languageNames[item.lang || item.code || ''] || item.lang || item.code || '' })).filter(item => item.code) || [{ code: 'en', name: 'English' }]

  const loadJokes = useCallback(async (query: Parameters<typeof fetchJokes>[0] = {}, amount = 1) => {
    setLoading(true); setError('')
    try {
      const jokes = await fetchJokes({ categories: [settings.station], amount, safeMode: settings.safeMode, flags: settings.flags, lang: settings.jokeLanguage, ...query })
      return jokes
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load jokes.'); return [] }
    finally { setLoading(false) }
  }, [settings])

  useEffect(() => {
    if (page !== 'RADIO' || queue.length === 0 || queue.length - queueIndex - 1 !== 3 || refillingRef.current) return
    refillingRef.current = true
    void loadJokes({ categories: [settings.station] }, 10).then(items => {
      const seen = new Set(queueRef.current.map(item => item.key))
      const fresh = items.filter(item => !seen.has(item.key))
      if (fresh.length) setQueue(current => [...current, ...fresh])
    }).finally(() => { refillingRef.current = false })
  }, [page, queue.length, queueIndex, loadJokes, settings.station])

  function setCurrent(item: Joke, play = false) {
    setProgress(0)
    setJoke(item); setError(''); setNotice('Comedy packet received.');
    if (play) window.setTimeout(() => speakCurrent(item), 0)
  }

  async function getJoke(play = false) {
    window.speechSynthesis?.cancel(); setSpeaking(false); setPaused(false)
    const jokes = await loadJokes({}, 1)
    if (jokes[0]) { setQueue(jokes); setQueueIndex(0); setCurrent(jokes[0], play) }
  }

  const markPlayed = useCallback((item: Joke, completed: boolean) => {
    const now = Date.now()
    setHistory(previous => {
      const found = previous.find(row => row.key === item.key)
      const next: PlayedJoke = { ...item, lastPlayed: now, playCount: (found?.playCount || 0) + (completed ? 0 : 1), completed: completed || Boolean(found?.completed) }
      return [next, ...previous.filter(row => row.key !== item.key)].slice(0, 250)
    })
  }, [])

  function speakCurrent(item = joke) {
    if (!item) return
    if (!('speechSynthesis' in window)) { setError('Speech synthesis is unavailable. You can still read and use JokeFM.'); return }
    window.speechSynthesis.cancel(); window.clearTimeout(timerRef.current); waitingRef.current = false
    const run = ++speechRun.current
    const parts = item.type === 'twopart' ? [item.setup || '', item.delivery || ''] : [item.joke || '']
    const totalChars = Math.max(1, parts.reduce((sum, part) => sum + part.length, 0))
    setProgress(0)
    setSpeaking(true); setPaused(false); setNotice('Voice driver speaking.'); markPlayed(item, false)
    const say = (index: number) => {
      if (run !== speechRun.current) return
      if (index >= parts.length) { setProgress(100); setSpeaking(false); setPaused(false); setNotice('Joke complete. Ready for the next one.'); markPlayed(item, true); if (settingsRef.current.autoPlay && pageRef.current === 'RADIO') nextJokeRef.current(); return }
      const utterance = new SpeechSynthesisUtterance(parts[index])
      const playbackSettings = settingsRef.current
      const completedChars = parts.slice(0, index).reduce((sum, part) => sum + part.length, 0)
      const voice = voicesRef.current.find(candidate => candidate.voiceURI === playbackSettings.voiceURI) || voicesRef.current.find(candidate => candidate.lang.toLowerCase().startsWith(item.lang.toLowerCase()))
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang } else utterance.lang = item.lang
      utterance.rate = playbackSettings.rate; utterance.pitch = playbackSettings.pitch; utterance.volume = playbackSettings.volume
      utterance.onstart = () => setProgress(Math.min(99, completedChars / totalChars * 100))
      utterance.onboundary = event => {
        const partProgress = Math.min(parts[index].length, event.charIndex + Math.max(1, event.charLength || 1))
        setProgress(Math.min(99, (completedChars + partProgress) / totalChars * 100))
      }
      utterance.onend = () => { setProgress(Math.min(99, (completedChars + parts[index].length) / totalChars * 100)); if (index === 0 && parts.length > 1) { setNotice('Buffering punchline…'); waitingRef.current = true; waitRemainingRef.current = playbackSettings.pauseMs; waitUntilRef.current = Date.now() + playbackSettings.pauseMs; continueSpeechRef.current = () => { waitingRef.current = false; say(1) }; timerRef.current = window.setTimeout(() => { waitingRef.current = false; say(1) }, playbackSettings.pauseMs) } else { setProgress(100); waitingRef.current = false; setSpeaking(false); setPaused(false); setNotice('Joke complete. Ready for the next one.'); markPlayed(item, true); if (settingsRef.current.autoPlay && pageRef.current === 'RADIO') nextJokeRef.current() } }
      utterance.onerror = event => { if (event.error !== 'canceled' && run === speechRun.current) { setSpeaking(false); setPaused(false); setError('Voice playback stopped. The joke is still available to read.') } }
      window.speechSynthesis.speak(utterance)
    }
    say(0)
  }

  function testVoice() {
    if (!('speechSynthesis' in window)) { setError('Speech synthesis is unavailable in this browser.'); return }
    speechRun.current++
    window.clearTimeout(timerRef.current)
    waitingRef.current = false
    setPaused(false)
    window.speechSynthesis.cancel()
    const options = settingsRef.current
    const utterance = new SpeechSynthesisUtterance('Voice settings are ready. Your JokeFM signal is clear.')
    const voice = voicesRef.current.find(candidate => candidate.voiceURI === options.voiceURI) || voicesRef.current.find(candidate => candidate.lang.toLowerCase().startsWith(options.jokeLanguage.toLowerCase()))
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang } else utterance.lang = options.jokeLanguage
    utterance.rate = options.rate
    utterance.pitch = options.pitch
    utterance.volume = options.volume
    setSpeaking(true)
    utterance.onstart = () => { setSpeaking(true); setPaused(false); setNotice(`Testing ${voice?.name || 'the default browser voice'}.`) }
    utterance.onend = () => { setSpeaking(false); setPaused(false); setNotice('Voice test complete.') }
    utterance.onerror = () => { setSpeaking(false); setPaused(false); setError('The selected voice could not be started. Choose another voice or use Automatic.') }
    window.speechSynthesis.speak(utterance)
  }

  function toggleSpeech() {
    if (speaking && !paused) { if (waitingRef.current) { window.clearTimeout(timerRef.current); waitRemainingRef.current = Math.max(0, waitUntilRef.current - Date.now()) } else window.speechSynthesis.pause(); setPaused(true); setNotice('Playback paused.') }
    else if (paused) { if (waitingRef.current) { waitUntilRef.current = Date.now() + waitRemainingRef.current; timerRef.current = window.setTimeout(continueSpeechRef.current, waitRemainingRef.current) } else window.speechSynthesis.resume(); setPaused(false); setNotice('Playback resumed.') }
    else speakCurrent()
  }
  function stopSpeech() { speechRun.current++; window.speechSynthesis?.cancel(); window.clearTimeout(timerRef.current); waitingRef.current = false; setSpeaking(false); setPaused(false) }
  function navigate(next: Page) { setPage(next); window.history.pushState({ page: next }, '', `#${next.toLowerCase().replace(' ', '-')}`) }
  function toggleFavorite(item = joke) {
    if (!item) return
    setFavorites(current => current.some(saved => saved.key === item.key) ? current.filter(saved => saved.key !== item.key) : [item, ...current].slice(0, 500))
    setNotice(favoriteKeys.has(item.key) ? 'Removed from your library.' : 'Saved to your library.')
  }
  function addPlaylist(item = joke) {
    if (!item) return
    setPlaylists(current => current.some(saved => saved.key === item.key) ? current : [item, ...current].slice(0, 500))
    setNotice('Added to My Station.')
  }

  async function startRadio(category = settings.station) {
    stopSpeech(); navigate('RADIO'); setSettings(s => ({ ...s, station: category }))
    setLoading(true); setError('')
    try {
      const items = await fetchJokes({ categories: [category], amount: 10, safeMode: settings.safeMode, flags: settings.flags, lang: settings.jokeLanguage })
      const unique = [...new Map(items.map(item => [item.key, item])).values()]
      setQueue(unique); setQueueIndex(0)
      if (unique[0]) {
        setCurrent(unique[0]); setNotice(`${stations.find(s => s.category === category)?.name || 'Station'} is on air.`)
        if (settings.introEnabled && 'speechSynthesis' in window) {
          const intro = new SpeechSynthesisUtterance(`Welcome to JokeFM. You're listening to ${stations.find(s => s.category === category)?.name || 'your comedy station'}. Let's get into today's jokes.`)
          intro.rate = settings.rate; intro.pitch = settings.pitch; intro.volume = settings.volume
          const voice = voices.find(candidate => candidate.voiceURI === settings.voiceURI)
          if (voice) intro.voice = voice
          intro.onend = () => speakCurrent(unique[0])
          intro.onerror = () => speakCurrent(unique[0])
          setSpeaking(true); window.speechSynthesis.speak(intro)
        } else speakCurrent(unique[0])
      }
      else setError('No jokes found for this station. Try another channel.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not start radio.') }
    finally { setLoading(false) }
  }

  async function nextJoke() {
    const currentIndex = queueIndexRef.current
    if (currentIndex + 1 < queueRef.current.length) { stopSpeech(); const index = currentIndex + 1; setQueueIndex(index); setCurrent(queueRef.current[index], pageRef.current === 'RADIO' && settingsRef.current.autoPlay); return }
    const more = await loadJokes({}, 10)
    const seen = new Set(queueRef.current.map(item => item.key))
    const fresh = more.filter(item => !seen.has(item.key))
    if (!fresh.length) { const one = await loadJokes({}, 1); if (!one[0]) return; fresh.push(one[0]) }
    const expanded = [...queueRef.current, ...fresh]
    setQueue(expanded); const index = currentIndex + 1; setQueueIndex(index); setCurrent(expanded[index], pageRef.current === 'RADIO' && settingsRef.current.autoPlay)
  }
  nextJokeRef.current = () => { void nextJoke() }
  function previousJoke() { if (queueIndex > 0) { stopSpeech(); const index = queueIndex - 1; setQueueIndex(index); setCurrent(queueRef.current[index]) } }

  async function searchJokes(event?: FormEvent) {
    event?.preventDefault()
    if (!search.trim()) { setError('Enter a word or phrase to search.'); return }
    setLoading(true); setError('')
    try { setResults(await fetchJokes({ categories: [discoverCategory], amount: 10, type: discoverType, contains: search.trim(), safeMode: settings.safeMode, flags: settings.flags, lang: settings.jokeLanguage })) }
    catch (reason) { setResults([]); setError(reason instanceof Error ? reason.message : 'Search failed.') }
    finally { setLoading(false) }
  }

  async function startGame() {
    setGameFeedback(''); setDeliveryRevealed(false)
    setSpeedSeconds(15)
    const type = gameMode === 'punchline' || gameMode === 'finish' ? 'twopart' : 'mixed'
    const items = await loadJokes({ type, categories: ['Any'] }, 10)
    if (!items.length) return
    const selected = items[0]; setGameJoke(selected); setGameCount(n => n + 1)
    if (gameMode === 'punchline' && selected.type === 'twopart') {
      const other = items.slice(1).map(optionText).filter(Boolean).filter(text => text !== selected.delivery).slice(0, 3)
      setGameOptions([selected.delivery || '', ...other].sort(() => Math.random() - 0.5))
    } else if (gameMode === 'category') setGameOptions([...new Set([selected.category, ...categories.filter(item => item !== selected.category).sort(() => Math.random() - .5).slice(0, 3)])].sort(() => Math.random() - 0.5))
    else setGameOptions([])
  }
  function answerGame(answer: string) {
    if (!gameJoke || gameFeedback) return
    const correct = gameMode === 'category' ? answer === gameJoke.category : answer === gameJoke.delivery
    setGameFeedback(correct ? 'Correct! Point added.' : `Not quite. ${gameMode === 'category' ? `It was ${gameJoke.category}.` : `The punchline: ${gameJoke.delivery}`}`)
    if (correct) setGameScore(score => score + 1)
    setGameResults(items => [{ id: gameMode, score: correct ? 1 : 0, questions: 1, date: Date.now() }, ...items].slice(0, 200))
  }

  async function loadMetadata(endpoint = metaEndpoint) {
    setMetaMessage('Loading API metadata…')
    try {
      const cached = loadJson<Record<string, { fetchedAt: number; data: unknown }>>(storageKeys.metadata, {})
      const entry = cached[endpoint]
      const data = entry && Date.now() - entry.fetchedAt < 86400000 ? entry.data : await fetchMetadata(endpoint)
      setMetadata(previous => ({ ...previous, [endpoint]: data })); setMetaMessage(`${endpoint.toUpperCase()} DATA READY`)
      saveJson(storageKeys.metadata, { ...cached, [endpoint]: { fetchedAt: Date.now(), data } })
    } catch (reason) { setMetaMessage(reason instanceof Error ? reason.message : 'Metadata unavailable.') }
  }
  async function sendLabRequest() {
    setLabOutput('Sending request…')
    try { const items = await fetchJokes({ categories: [labCategory], amount: labAmount, type: labType, safeMode: settings.safeMode, flags: settings.flags, lang: settings.jokeLanguage }); setLabOutput(JSON.stringify(items, null, 2)) }
    catch (reason) { setLabOutput(reason instanceof Error ? reason.message : 'Request failed.') }
  }
  async function importData(file?: File) {
    if (!file) return
    try {
      const data = validateImport(JSON.parse(await file.text()))
      setFavorites([...new Map((data.favorites as Joke[]).map(item => [item.key, item])).values()].slice(0, 500)); setHistory([...new Map((data.history as PlayedJoke[]).map(item => [item.key, item])).values()].slice(0, 250))
      if (Array.isArray(data.playlists)) setPlaylists([...new Map((data.playlists as Joke[]).map(item => [item.key, item])).values()].slice(0, 500))
      if (Array.isArray(data.stats)) setGameResults(data.stats.filter((item): item is GameRecord => Boolean(item && typeof item === 'object' && typeof (item as GameRecord).id === 'string' && Number.isFinite((item as GameRecord).score) && Number.isFinite((item as GameRecord).questions) && Number.isFinite((item as GameRecord).date))).slice(0, 200))
      if (data.settings && typeof data.settings === 'object') {
        const candidate = data.settings as Partial<Settings>
        setSettings(current => ({ ...current, safeMode: typeof candidate.safeMode === 'boolean' ? candidate.safeMode : current.safeMode, flags: Array.isArray(candidate.flags) ? candidate.flags.filter(flag => defaults.flags.includes(flag)) : current.flags, pauseMs: [500, 1000, 1500, 2000, 2500, 3000].includes(candidate.pauseMs || -1) ? candidate.pauseMs! : current.pauseMs, rate: typeof candidate.rate === 'number' && candidate.rate >= .6 && candidate.rate <= 1.4 ? candidate.rate : current.rate, pitch: typeof candidate.pitch === 'number' && candidate.pitch >= .5 && candidate.pitch <= 1.5 ? candidate.pitch : current.pitch, volume: typeof candidate.volume === 'number' && candidate.volume >= 0 && candidate.volume <= 1 ? candidate.volume : current.volume, voiceURI: typeof candidate.voiceURI === 'string' ? candidate.voiceURI : current.voiceURI, jokeLanguage: typeof candidate.jokeLanguage === 'string' ? candidate.jokeLanguage : current.jokeLanguage, autoPlay: typeof candidate.autoPlay === 'boolean' ? candidate.autoPlay : current.autoPlay, introEnabled: typeof candidate.introEnabled === 'boolean' ? candidate.introEnabled : current.introEnabled, station: typeof candidate.station === 'string' && stations.some(item => item.category === candidate.station) ? candidate.station : current.station }))
      }
      setNotice('JokeFM data imported successfully.'); setError('')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not import that file.') }
  }

  function renderJokeCard(item: Joke, actions = true) {
    const saved = favoriteKeys.has(item.key)
    return <article className="result-card" key={item.key}><div className="result-meta"><span>{item.category.toUpperCase()}</span><span>{item.type === 'twopart' ? 'TWO-PART' : 'ONE-LINER'} · {item.lang.toUpperCase()}</span></div><div className="result-joke">{item.type === 'single' ? item.joke : <><b>{item.setup}</b><span>{item.delivery}</span></>}</div>{actions && <div className="result-actions"><button onClick={() => { stopSpeech(); setQueue([item]); setQueueIndex(0); setCurrent(item); navigate('HOME') }}>READ IN PLAYER</button><button onClick={() => speakCurrent(item)}>SPEAK</button><button onClick={() => toggleFavorite(item)}>{saved ? '♥ SAVED' : '♡ SAVE'}</button><button onClick={() => addPlaylist(item)}>+ MY STATION</button></div>}</article>
  }

  function renderHome() {
    return <><section className="welcome"><div className="eyebrow">✦ YOUR PERSONAL COMEDY RADIO ✦</div><h1>Tune in.<br/><em>Laugh out.</em></h1><p>Fresh jokes, delivered on your frequency.</p><div className="hero-actions"><button className="primary" onClick={() => getJoke(true)} disabled={loading}>{loading ? '◌ TUNING IN…' : '▶  GET A RANDOM JOKE'}</button><button className="secondary" onClick={() => startRadio()}>START RADIO SHOW</button><span className="api-note"><span className="signal-bars"><i/><i/><i/><i/></span> POWERED BY JOKEAPI</span></div></section><section className="player-layout"><article className="joke-panel"><div className="panel-top"><span><i className="live-dot"/> NOW PLAYING</span><span className="station">{joke ? `${joke.category.toUpperCase()} · ${joke.type === 'twopart' ? 'TWO-PART' : 'ONE-LINER'}` : 'JOKEFM · CHANNEL 01'}</span></div>{renderCurrentJoke()}{PlayerControls()}</article><aside className="side-stack">{StationPicker()}<div className="mini-panel library-card"><div className="mini-heading">YOUR LIBRARY <span>♥</span></div><div className="library-count">{String(favorites.length).padStart(2, '0')} <small>SAVED JOKES</small></div><p>{favorites.length ? 'Your favorite bits, saved for a rainy day.' : 'Save a joke you love and it will show up here.'}</p>{favorites[0] && <div className="favorite-preview">“{favorites[0].setup || favorites[0].joke}”</div>}</div></aside></section></>
  }

  function renderCurrentJoke() {
    return error ? <div className="empty-state error-state"><span className="empty-icon">!</span><h2>Signal interrupted</h2><p>{error}</p><button className="small-button" onClick={() => getJoke()}>RECONNECT ↗</button></div> : joke ? <div className="joke-content"><span className="joke-id">JOKE #{joke.id} · {joke.lang.toUpperCase()}</span>{joke.type === 'twopart' ? <><h2>{joke.setup}</h2><div className="pause-line"></div><h2 className="delivery">{joke.delivery}</h2></> : <h2>{joke.joke}</h2>}</div> : <div className="empty-state"><div className="radio-art"><span>♫</span><i/><i/><i/></div><h2>Your next laugh is<br/>just a button away.</h2><p>Press play to catch a fresh comedy signal.</p></div>
  }

  function PlayerControls() {
    return <><div className="player-controls"><button aria-label="Previous joke" title="Previous joke" onClick={previousJoke}>|◀</button><button className="play-button" aria-label={speaking && !paused ? 'Pause speech' : 'Speak joke'} onClick={toggleSpeech}>{speaking && !paused ? 'Ⅱ' : '▶'}</button><button aria-label="Next joke" title="Next joke" onClick={() => void nextJoke()}>▶|</button><button aria-label="Replay joke" title="Replay (R)" onClick={() => speakCurrent()}>↻</button><span className="control-spacer"/><button className={joke && favoriteKeys.has(joke.key) ? 'heart saved' : 'heart'} aria-label="Save favorite" onClick={() => toggleFavorite()}>{joke && favoriteKeys.has(joke.key) ? '♥' : '♡'}</button></div><div className="volume-control"><span>VOL</span><input aria-label="Speech volume" type="range" min="0" max="1" step=".05" value={settings.volume} onChange={event => setSettings(s => ({ ...s, volume: Number(event.target.value) }))}/><span>{Math.round(settings.volume * 100)}%</span></div><div className="progress-track" role="progressbar" aria-label="Speech progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span className="progress" style={{ width: `${progress}%` }}/></div></>
  }
  function StationPicker() {
    const stationNumber = String(Math.max(1, stations.findIndex(item => item.category === settings.station) + 1)).padStart(2, '0')
    return (
      <div className="mini-panel station-card dial-card">
        <div className="dial-heading">
          <div className="dial-heading-label"><span className="dial-led"/> ON THE DIAL</div>
          <span className="dial-count">STATION {stationNumber} <i>/ 07</i></span>
        </div>
        <div className="dial-display">
          <div className="dial-frequency"><strong>{stationNumber}</strong><span>JFM<br/>FM</span></div>
          <div className="dial-scale" aria-hidden="true"><div className="dial-scale-labels"><span>LOW</span><span>COMEDY BAND</span><span>HIGH</span></div><div className="dial-ticks"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="dial-needle" style={{ left: `${((Number(stationNumber) - 1) / 6) * 100}%` }}/></div>
        </div>
        <label className="dial-select-label" htmlFor="station-select">TUNING PRESET</label>
        <select className="dial-select" id="station-select" value={settings.station} onChange={event => { setSettings(s => ({ ...s, station: event.target.value })); if (page === 'RADIO') void startRadio(event.target.value) }}>{stations.map(item => <option key={item.category} value={item.category}>{item.name}</option>)}</select>
        <div className="dial-station-copy"><strong>{currentStation.name.toUpperCase()}</strong><p>{currentStation.description}</p></div>
        <button className="dial-tune-button" onClick={() => void startRadio(settings.station)}><span>TUNE THIS STATION</span><b>▶</b></button>
      </div>
    )
  }

  function renderPage() {
    if (page === 'HOME') return renderHome()
    if (page === 'RADIO') return <section className="screen"><ScreenTitle eyebrow="LIVE TRANSMISSION" title="Radio Mode" sub="Batch loaded, punchlines buffered, signal on."/><div className="radio-toolbar">{StationPicker()}<div className="mini-panel radio-queue"><div className="mini-heading">UP NEXT <span>{Math.max(0, queue.length - queueIndex - 1)} QUEUED</span></div><ol>{queue.slice(queueIndex + 1, queueIndex + 6).map((item, index) => <li key={item.key}><span>{String(index + 1).padStart(2, '0')}</span>{item.setup || item.joke}</li>)}</ol><div className="radio-options"><label><input type="checkbox" checked={settings.autoPlay} onChange={event => setSettings(s => ({ ...s, autoPlay: event.target.checked }))}/> Auto advance</label><button onClick={() => { const next = [...queue]; const rest = next.slice(Math.max(0, queueIndex + 1)).sort(() => Math.random() - .5); const mixed = [...next.slice(0, queueIndex + 1), ...rest]; setQueue(mixed) }}>SHUFFLE QUEUE</button></div></div></div><article className="joke-panel radio-now"><div className="panel-top"><span><i className="live-dot"/> {currentStation.name.toUpperCase()}</span><span className="station">{queueIndex >= 0 ? `${queueIndex + 1} / ${queue.length}` : 'QUEUE NOT STARTED'}</span></div>{renderCurrentJoke()}{PlayerControls()}</article><button className="primary" onClick={() => void startRadio()} disabled={loading}>{queue.length ? '↻ RELOAD 10-JOKE QUEUE' : '▶ START SHOW'}</button></section>
    if (page === 'DISCOVER') return <section className="screen"><ScreenTitle eyebrow="COMEDY DATABASE" title="Discover" sub="Search JokeAPI with filters. Requests only run when you submit."/><form className="search-form" onSubmit={searchJokes}><input aria-label="Search jokes" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search jokes for a word or phrase…"/><button className="primary">SEARCH</button></form><div className="filter-row"><label>Category<select value={discoverCategory} onChange={event => setDiscoverCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Type<select value={discoverType} onChange={event => setDiscoverType(event.target.value)}><option value="mixed">Any type</option><option value="single">One-liner</option><option value="twopart">Two-part</option></select></label><label>Language<select value={settings.jokeLanguage} onChange={event => setSettings(s => ({ ...s, jokeLanguage: event.target.value }))}>{jokeLanguages.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label></div><ResultList items={results} empty="Run a search to tune the database."/></section>
    if (page === 'GAMES') return renderGames()
    if (page === 'LIBRARY') return <section className="screen"><ScreenTitle eyebrow="LOCAL COLLECTION" title="Library" sub="Favorites, play history, and your personal station stay on this device."/><div className="library-tabs">{(['Favorites', 'History', 'Playlist'] as const).map(item => <button className={libraryTab === item ? 'selected' : ''} key={item} onClick={() => setLibraryTab(item)}>{item} ({item === 'Favorites' ? favorites.length : item === 'History' ? history.length : playlists.length})</button>)}</div>{libraryTab === 'Favorites' ? <ResultList items={favorites} empty="No favorites yet. Save a joke from the player or Discover." onRemove={item => setFavorites(list => list.filter(j => j.key !== item.key))}/> : libraryTab === 'History' ? <ResultList items={history} empty="Your played jokes will appear here."/> : <><div className="library-toolbar"><p>{playlistName.toUpperCase()} · {playlists.length} SAVED</p><button className="secondary" onClick={() => { setQueue(playlists); setQueueIndex(0); if (playlists[0]) { setCurrent(playlists[0], true); navigate('RADIO') } }}>▶ PLAY PLAYLIST</button><button className="secondary" onClick={() => { const name = window.prompt("Name this playlist", playlistName)?.trim(); if (name) setPlaylistName(name.slice(0, 40)) }}>RENAME</button><button className="secondary" onClick={() => setPlaylists(items => [...items].sort(() => Math.random() - .5))}>SHUFFLE</button><button className="secondary" onClick={() => setPlaylists([])}>CLEAR</button></div><ResultList items={playlists} empty="Add jokes to My Station from any joke card." onRemove={item => setPlaylists(list => list.filter(j => j.key !== item.key))}/></>}</section>
    if (page === 'STATS') return renderStats()
    if (page === 'API LAB') return renderApiLab()
    return renderSettings()
  }

  function ScreenTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) { return <div className="screen-title"><div className="eyebrow">✦ {eyebrow} ✦</div><h1>{title}</h1><p>{sub}</p></div> }
  function ResultList({ items, empty, onRemove }: { items: Joke[]; empty: string; onRemove?: (item: Joke) => void }) { return <div className="result-list">{items.length ? items.map(item => <div key={item.key}>{renderJokeCard(item)}{onRemove && <button className="remove-result" onClick={() => onRemove(item)}>REMOVE FROM THIS LIST</button>}</div>) : <div className="empty-box">{empty}</div>}</div> }

  function renderGames() {
    return <section className="screen"><ScreenTitle eyebrow="ARCADE / NO COINS REQUIRED" title="Games" sub="Lightweight comedy games. Results stay separate from your radio queue."/><div className="game-summary"><div><strong>{gameScore}</strong><small>SESSION SCORE</small></div><div><strong>{gameCount}</strong><small>QUESTIONS LOADED</small></div><div><strong>{gameResults.length}</strong><small>RECORDED ROUNDS</small></div></div><div className="game-select-row"><label>GAME MODE<select value={gameMode} onChange={event => { setGameMode(event.target.value); setGameJoke(null); setGameFeedback('') }}><option value="punchline">Punchline Guess</option><option value="finish">Finish the Joke</option><option value="category">Category Challenge</option><option value="speed">Speed Joke</option><option value="delivery">Delivery Challenge</option></select></label>{gameMode === 'speed' && <label><input type="checkbox" checked={speedEnabled} onChange={event => setSpeedEnabled(event.target.checked)}/> Enable timer (15 seconds)</label>}<button className="primary" onClick={() => void startGame()} disabled={loading}>NEW QUESTION</button></div>{gameJoke ? <article className="game-card"><div className="mini-heading">{gameMode.replace('-', ' ').toUpperCase()} · QUESTION {gameCount}</div><h2>{gameMode === 'category' ? textOf(gameJoke) : gameJoke.setup || gameJoke.joke}</h2><button className="secondary" onClick={() => speakCurrent(gameJoke)}>SPEAK QUESTION</button>{gameMode === 'punchline' && gameOptions.map((answer, index) => <button className="answer-option" key={`${answer}-${index}`} disabled={Boolean(gameFeedback)} onClick={() => answerGame(answer)}>{String.fromCharCode(65 + index)}. {answer}</button>)}{gameMode === 'category' && gameOptions.map(answer => <button className="answer-option" key={answer} disabled={Boolean(gameFeedback)} onClick={() => answerGame(answer)}>{answer}</button>)}{gameMode === 'finish' && <><button className="secondary" onClick={() => { setDeliveryRevealed(true); setGameFeedback('Punchline revealed. Check your answer.') }}>REVEAL PUNCHLINE</button>{deliveryRevealed && <><div className="revealed-answer">{gameJoke.delivery}</div><button className="secondary" onClick={() => { setGameScore(score => score + 1); setGameFeedback("Self-score recorded: point awarded.") }}>I GOT IT</button><button className="secondary" onClick={() => setGameFeedback("No point this time. Try another joke.")}>NOT THIS TIME</button></>}</>}{gameMode === 'delivery' && <><p>Deliver the setup out loud, then reveal the punchline when you are ready.</p><button className="secondary" onClick={() => setDeliveryRevealed(true)}>REVEAL PUNCHLINE</button>{deliveryRevealed && <div className="revealed-answer">{gameJoke.delivery}</div>}</>}{gameMode === 'speed' && <><button className="secondary" onClick={() => speakCurrent(gameJoke)}>SPEAK JOKE</button>{speedEnabled && <div className="speed-timer" aria-live="polite">{speedSeconds}s</div>}<button className="secondary" onClick={() => { setGameFeedback('You got it. Next question is ready.'); setGameScore(s => s + 1) }}>GOT IT</button></>}{gameFeedback && <div aria-live="polite" className="game-feedback">{gameFeedback}</div>}</article> : <div className="empty-box">Choose a game and load a question to play.</div>}</section>
  }
  function renderStats() {
    const played = history.reduce((sum, item) => sum + item.playCount, 0)
    const categoriesPlayed = history.reduce<Record<string, number>>((all, item) => ({ ...all, [item.category]: (all[item.category] || 0) + item.playCount }), {})
    const topCategory = Object.entries(categoriesPlayed).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    const activity = Array.from({ length: 14 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (13 - index)); const key = date.toDateString(); return history.filter(item => new Date(item.lastPlayed).toDateString() === key).length })
    return <section className="screen"><ScreenTitle eyebrow="YOUR COMEDY TELEMETRY" title="Statistics" sub="A small snapshot of how you use JokeFM. Everything is calculated locally."/><div className="stats-grid"><Stat value={played} label="JOKES PLAYED"/><Stat value={favorites.length} label="FAVORITES"/><Stat value={gameResults.length} label="GAME ROUNDS"/><Stat value={topCategory} label="TOP CATEGORY"/></div><div className="mini-panel activity-panel"><div className="mini-heading">RECENT ACTIVITY · 14 DAYS <span>LOCAL HISTORY</span></div><div className="activity-bars">{activity.map((count, index) => <div key={index} title={`${count} played`}><i style={{ height: `${Math.max(5, Math.min(100, count * 18))}%` }}/><small>{index % 2 === 0 ? index + 1 : ''}</small></div>)}</div><p>Daily bars show locally recorded played jokes.</p></div><div className="mini-panel activity-panel"><div className="mini-heading">RECENT GAME ROUNDS</div>{gameResults.length ? gameResults.slice(0, 8).map((row, index) => <div className="game-history-row" key={`${row.date}-${index}`}><span>{row.id.toUpperCase()}</span><span>{row.score} point{row.score === 1 ? '' : 's'}</span><time>{new Date(row.date).toLocaleDateString()}</time></div>) : <p>No game results yet. Start a round in Games.</p>}</div></section>
  }
  function Stat({ value, label }: { value: string | number; label: string }) { return <div className="stat-card"><strong>{value}</strong><small>{label}</small></div> }

  function renderApiLab() {
    const url = new URL(`/joke/${labCategory}`, API_BASE); if (labType !== 'mixed') url.searchParams.set('type', labType); if (labAmount > 1) url.searchParams.set('amount', String(labAmount)); url.searchParams.set('lang', settings.jokeLanguage); if (settings.flags.length) url.searchParams.set('blacklistFlags', settings.flags.join(',')); if (settings.safeMode) url.searchParams.set('safe-mode', '')
    const meta = metadata[metaEndpoint]
    return <section className="screen"><ScreenTitle eyebrow="DEVELOPER CONSOLE" title="API Lab" sub="Explore JokeAPI metadata and build a request with your current content settings."/><div className="api-status"><span className="live-dot"/> JOKEAPI · {metaMessage || 'STATUS NOT CHECKED'} <button className="secondary" onClick={() => void loadMetadata('ping')}>PING API</button></div><div className="api-layout"><div className="mini-panel api-builder"><div className="mini-heading">REQUEST BUILDER</div><label>Category<select value={labCategory} onChange={event => setLabCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Joke type<select value={labType} onChange={event => setLabType(event.target.value)}><option value="mixed">Mixed</option><option value="single">One-liner</option><option value="twopart">Two-part</option></select></label><label>Amount<input type="number" min="1" max="10" value={labAmount} onChange={event => setLabAmount(Math.max(1, Math.min(10, Number(event.target.value))))}/></label><div className="request-preview"><small>GENERATED REQUEST</small><code>{url.toString()}</code></div><button className="primary" onClick={() => void sendLabRequest()}>SEND REQUEST</button></div><div className="mini-panel metadata-panel"><div className="mini-heading">METADATA ENDPOINT</div><div className="metadata-links">{['info', 'categories', 'languages', 'flags', 'formats', 'ping'].map(name => <button className={metaEndpoint === name ? 'selected' : ''} key={name} onClick={() => { setMetaEndpoint(name); void loadMetadata(name) }}>/{name}</button>)}</div><p className="meta-message">{metaMessage || 'Select an endpoint to load its cached metadata.'}</p>{meta !== undefined && <pre>{JSON.stringify(meta, null, 2)}</pre>}</div></div>{labOutput && <div className="mini-panel output-panel"><div className="mini-heading">RESPONSE</div><pre>{labOutput}</pre></div>}</section>
  }

  function renderSettings() {
    return (
      <section className="screen settings-screen">
        <ScreenTitle eyebrow="JOKEFM OS / SYSTEM PREFERENCES" title="Settings" sub="Tune the sound, filter the signal, and manage local JokeFM data." />
        <div className="settings-console">
          <div className="settings-console-head">
            <div className="console-brand"><span className="console-badge">JFM</span><div><small>PERSONAL MEDIA SYSTEM</small><strong>CONTROL DECK <i>v1.0</i></strong></div></div>
            <div className="console-meter"><div><i className="live-dot" /> SYSTEM READY</div><span className="console-eq"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></span></div>
          </div>
          <div className="settings-grid settings-console-grid">
            <section className="mini-panel settings-panel audio-module">
              <div className="settings-module-head"><span className="module-index">01</span><div><small>PLAYBACK HARDWARE</small><h2>VOICE SYSTEM</h2></div><span className="module-ready">READY</span></div>
              <label className="setting-field">BROWSER VOICE<select value={settings.voiceURI} onChange={event => setSettings(s => ({ ...s, voiceURI: event.target.value }))}><option value="">Automatic · {selectedVoice?.name || 'system default'}</option>{voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}</select></label>
              <div className="voice-fallback">JOKE LANGUAGE: {settings.jokeLanguage.toUpperCase()} · VOICE: {selectedVoice ? `${selectedVoice.lang}${selectedVoice.lang.toLowerCase().startsWith(settings.jokeLanguage) ? '' : ' (language fallback)'}` : 'browser default'}{voices.length === 0 ? ' · loading voices' : ''}</div>
              <div className="slider-bank"><Slider label="SPEECH RATE" value={settings.rate} min={0.6} max={1.4} step={0.05} onChange={value => setSettings(s => ({ ...s, rate: value }))}/><Slider label="PITCH" value={settings.pitch} min={0.5} max={1.5} step={0.05} onChange={value => setSettings(s => ({ ...s, pitch: value }))}/><Slider label="VOLUME" value={settings.volume} min={0} max={1} step={0.05} onChange={value => setSettings(s => ({ ...s, volume: value }))}/></div>
              <label className="setting-field">PUNCHLINE PAUSE<select value={settings.pauseMs} onChange={event => setSettings(s => ({ ...s, pauseMs: Number(event.target.value) }))}>{[500, 1000, 1500, 2000, 2500, 3000].map(value => <option key={value} value={value}>{value / 1000}s</option>)}</select></label>
              <button className="secondary test-voice-button" onClick={testVoice}><span>▶</span> TEST VOICE</button>
              <small className="settings-hint">Changes apply to the next speech. Use the test signal to preview this setup.</small>
            </section>
            <section className="mini-panel settings-panel signal-module">
              <div className="settings-module-head"><span className="module-index">02</span><div><small>SIGNAL & CONTENT</small><h2>STATION FILTERS</h2></div><span className="module-ready">LOCAL</span></div>
              <label className="setting-field">JOKE LANGUAGE<select value={settings.jokeLanguage} onChange={event => setSettings(s => ({ ...s, jokeLanguage: event.target.value }))}>{jokeLanguages.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
              <div className="toggle-bank"><label className="check-setting"><input type="checkbox" checked={settings.introEnabled} onChange={event => setSettings(s => ({ ...s, introEnabled: event.target.checked }))}/><span>RADIO SHOW INTRO</span></label><label className="check-setting"><input type="checkbox" checked={settings.autoPlay} onChange={event => setSettings(s => ({ ...s, autoPlay: event.target.checked }))}/><span>AUTO ADVANCE RADIO</span></label><label className="check-setting"><input type="checkbox" checked={settings.safeMode} onChange={event => setSettings(s => ({ ...s, safeMode: event.target.checked }))}/><span>FAMILY FRIENDLY / SAFE MODE</span></label></div>
              <div className="filter-head"><span>CONTENT FILTERS</span><small>{settings.flags.length} ACTIVE</small></div>
              <div className="filter-grid">{['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit'].map(flag => <label className="check-setting filter-toggle" key={flag}><input type="checkbox" checked={settings.flags.includes(flag)} onChange={event => setSettings(s => ({ ...s, flags: event.target.checked ? [...s.flags, flag] : s.flags.filter(value => value !== flag) }))}/><span>{flag.toUpperCase()}</span></label>)}</div>
            </section>
            <section className="mini-panel settings-panel data-settings data-module">
              <div className="settings-module-head"><span className="module-index">03</span><div><small>ON-DEVICE STORAGE</small><h2>LIBRARY BACKUP</h2></div><span className="module-ready">PRIVATE</span></div>
              <p>Favorites, history, settings, and playlists are stored in this browser. Export a copy or restore a JokeFM backup.</p>
              <div className="data-actions"><button className="secondary" onClick={() => exportLibrary({ favorites, history, playlists, settings, stats: gameResults })}>↓ EXPORT DATA</button><label className="file-button">↑ IMPORT DATA<input type="file" accept="application/json,.json" onChange={event => void importData(event.target.files?.[0])}/></label><button className="secondary danger-button" onClick={() => { if (window.confirm('Clear JokeFM history and favorites from this browser?')) { setFavorites([]); setHistory([]); setPlaylists([]); setGameResults([]); setNotice('Local library cleared.') } }}>CLEAR LOCAL LIBRARY</button></div>
              <p className="shortcut-note">KEYS: SPACE PLAY/PAUSE · ←/→ TRACK · R REPLAY · F FAVORITE · M MUTE</p>
            </section>
          </div>
        </div>
      </section>
    )
  }
  return <div className="app-shell"><header className="titlebar"><div className="brand"><img className="brand-logo" src="/android-chrome-192x192.png" alt=""/><span>Joke<span className="brand-fm">FM</span></span></div><div className="online"><i/> COMEDY SIGNAL ONLINE</div><div className="window-buttons"><span>_</span><span>□</span><span>×</span></div></header><nav className={mobileNavOpen ? 'nav mobile-open' : 'nav'} aria-label="Main navigation"><button type="button" className="mobile-nav-toggle" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(open => !open)}><span>{page}</span><b>{mobileNavOpen ? 'CLOSE ×' : 'MENU ☰'}</b></button>{tabs.map(item => <button key={item} className={page === item ? 'nav-item active' : 'nav-item'} onClick={() => { navigate(item); setError(''); setMobileNavOpen(false) }}>{item}</button>)}</nav><main><div className="page-content">{error && page !== 'HOME' && <div className="global-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}{renderPage()}</div>{page !== 'HOME' && page !== 'RADIO' && joke && <MiniPlayer joke={joke} progress={progress} speaking={speaking} paused={paused} favorite={favoriteKeys.has(joke.key)} onToggle={toggleSpeech} onPrevious={previousJoke} onNext={() => void nextJoke()} onFavorite={() => toggleFavorite()}/>}<div className="app-notice" aria-live="polite">{notice}</div><footer><span>JOKEFM OS <b>v1.0</b></span><span>VOICE DRIVER {('speechSynthesis' in window) ? 'READY' : 'UNAVAILABLE'} <i className="live-dot"/></span><span>MADE FOR THE LOVE OF A GOOD PUN ✳</span></footer></main></div>
}

export default App


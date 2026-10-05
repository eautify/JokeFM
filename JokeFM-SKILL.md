# JokeFM — Product & Engineering Skill
Version: 1.0
Status: Build Blueprint
Target: Personal portfolio project / production-ready web app
Primary stack: Vite + JavaScript (TypeScript-compatible architecture)
Primary API: JokeAPI v2 (`https://v2.jokeapi.dev/`)
Speech layer: Browser Web Speech API (`window.speechSynthesis`)
Persistence: `localStorage` initially; optional IndexedDB later
Visual direction: Y2K web / late-1990s–early-2000s consumer software + internet aesthetic

---

## 0. Mission

Build **JokeFM**, a browser-based interactive comedy application that treats JokeAPI as a content source rather than as a simple random-joke generator.

The product should feel like a **personal comedy radio station + joke discovery tool + mini game collection + personal joke library**.

The defining interaction is:

**Fetch joke → structure joke → perform with text-to-speech → let the user interact → save/history/stats → continue**

The application must be useful without an account, API key, backend, or paid AI service.

The product should demonstrate:

- REST API integration
- asynchronous JavaScript
- URL/query parameter construction
- API response normalization
- client-side state management
- queue management
- browser speech synthesis
- event-driven UI
- local persistence
- filtering/search
- game logic
- responsive UI
- accessibility
- polished visual design

Do not reduce the project to a button that calls `/joke/Any` and prints a joke.

---

# 1. Product Identity

## 1.1 Product name

Primary name:

**JokeFM**

Tagline candidates:

- `YOUR PERSONAL COMEDY RADIO`
- `TUNE IN. PRESS PLAY. GET PUNCHED.`
- `COMEDY, ON DEMAND.`
- `YOUR JOKES. YOUR STATION.`

Use **JokeFM** consistently in the interface unless a future rename is explicitly requested.

## 1.2 Product personality

JokeFM should feel:

- playful
- nostalgic
- slightly cheesy in an intentional way
- interactive
- energetic without becoming visually noisy
- technical enough to feel like a developer-made product
- friendly
- readable

It should evoke:

- old MP3 players
- Windows-era media software
- translucent plastic
- CD-ROM interfaces
- early personal websites
- glossy computer accessories
- translucent UI panels
- CRT screens
- pixel icons
- chrome buttons
- system-style dialogs
- late-90s / early-2000s web graphics

Avoid making the application look like a generic “retro arcade” page. The target is specifically **Y2K consumer technology / web software**, not 8-bit gaming.

---

# 2. Core Product Concept

JokeFM has five major layers:

```text
                 ┌─────────────────────┐
                 │       JOKEFM        │
                 └──────────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
          CONTENT         AUDIO         STATE
             │              │              │
        JokeAPI v2      Speech API      localStorage
             │              │              │
             └──────────────┼──────────────┘
                            │
                        EXPERIENCE
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
      RADIO               GAMES             LIBRARY
```

The API provides the joke data.

The application owns the experience.

The browser provides speech synthesis.

The browser stores user preferences and library data.

---

# 3. Non-Goals

Do NOT add the following in the initial version:

- user accounts
- login/authentication
- server-side database
- paid TTS API
- AI joke generation
- AI text rewriting
- unnecessary backend infrastructure
- social network features
- user-to-user messaging
- complicated server-side recommendation systems
- scraping third-party joke websites
- automatic publication of user-generated content
- automatic audio file generation as a requirement

A backend may be introduced later only when there is a demonstrated need.

---

# 4. Primary User Flows

## 4.1 First visit

```text
Open JokeFM
    ↓
Load application shell
    ↓
Load cached settings
    ↓
Load browser speech voices
    ↓
Fetch basic API metadata when needed
    ↓
Show Home
```

The app must be useful immediately.

Do not block initial rendering while waiting for metadata unless the requested screen specifically needs that metadata.

## 4.2 Start a radio show

```text
Home
 ↓
Select station
 ↓
Build JokeAPI request
 ↓
Fetch batch of jokes
 ↓
Normalize responses
 ↓
Create playback queue
 ↓
Play intro
 ↓
Perform first joke
 ↓
Show controls
 ↓
Track completion
 ↓
Advance queue
```

## 4.3 Read one joke

```text
Fetch
 ↓
Normalize
 ↓
Display
 ↓
User presses Speak
 ↓
Create utterance(s)
 ↓
Speech starts
 ↓
Update UI
 ↓
Speech ends
 ↓
Mark played
```

## 4.4 Save a joke

```text
Current joke
 ↓
Favorite button
 ↓
Save normalized joke to localStorage
 ↓
Update UI
 ↓
Show confirmation
```

## 4.5 Play a two-part joke

```text
Setup
 ↓
TTS
 ↓
Intentional pause
 ↓
Delivery / punchline
 ↓
TTS
 ↓
Completion
```

Never flatten a two-part joke into a single uninterrupted utterance when Radio Mode is performing it. The pause is part of the experience.

---

# 5. Information Architecture

Primary navigation:

```text
HOME
RADIO
DISCOVER
GAMES
LIBRARY
API LAB
SETTINGS
```

Suggested desktop shell:

```text
┌──────────────────────────────────────────────────────────────┐
│ JOKEFM    ◉ ONLINE                         _ □ X             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [HOME] [RADIO] [DISCOVER] [GAMES] [LIBRARY] [API LAB]       │
│                                                              │
├───────────────────────────────┬──────────────────────────────┤
│                               │                              │
│          MAIN VIEW            │       NOW PLAYING           │
│                               │                              │
│                               │       🎙 JokeFM              │
│                               │                              │
│                               │       [setup/punchline]      │
│                               │                              │
├───────────────────────────────┴──────────────────────────────┤
│ ▷ PLAY   ◀ PREV   NEXT ▶   ♡ SAVE   🔊 VOLUME   ⚙ SETTINGS   │
└──────────────────────────────────────────────────────────────┘
```

On mobile:

```text
┌───────────────────────────┐
│ JOKEFM               ☰    │
├───────────────────────────┤
│                           │
│       CURRENT SCREEN      │
│                           │
│                           │
│                           │
├───────────────────────────┤
│ 🎙 NOW PLAYING            │
│ [compact joke card]       │
│                           │
│      ◀   ▶/❚❚   ▶        │
└───────────────────────────┘
```

The global player should remain available across major screens when audio is active.

---

# 6. JokeAPI Integration Contract

## 6.1 Base URL

```js
const API_BASE_URL = 'https://v2.jokeapi.dev';
```

## 6.2 Main joke endpoint

```http
GET /joke/[Category/-ies]
```

Examples:

```http
GET /joke/Any
GET /joke/Programming
GET /joke/Pun
GET /joke/Programming,Misc
```

Valid categories currently documented by JokeAPI include:

- `Any`
- `Misc`
- `Programming`
- `Dark`
- `Pun`
- `Spooky`
- `Christmas`

JokeAPI also supports category aliases. Treat aliases as optional convenience inputs rather than as a separate internal category taxonomy.

## 6.3 Supported filtering parameters

The main joke endpoint supports:

```text
format
blacklistFlags
lang
idRange
contains
type
amount
```

Build query strings using `URLSearchParams`.

Example:

```js
const params = new URLSearchParams({
  amount: '10',
  type: 'twopart',
  lang: 'en',
  safe: 'true'
});
```

Do not manually concatenate unescaped user search input.

## 6.4 Blacklist flags

Supported content flags include:

```text
nsfw
religious
political
racist
sexist
explicit
```

The app should expose a friendly content policy layer.

Recommended default:

```text
Family Friendly = ON
```

Internally, default blacklist:

```js
[
  'nsfw',
  'religious',
  'political',
  'racist',
  'sexist',
  'explicit'
]
```

Allow advanced users to configure this.

Do not name the UI option simply “Blacklist.” Prefer:

- Content Filters
- Family Friendly
- Content Preferences

## 6.5 Safe mode

JokeAPI supports safe mode.

Use it as an additional convenience for the default family-friendly station where appropriate.

Do not assume safe mode replaces all application-level content handling.

## 6.6 Language

JokeAPI supports a finite set of languages with available jokes.

Do not infer that every ISO language code supported by metadata necessarily has a useful joke dataset.

For joke retrieval, use only languages reported as available by JokeAPI metadata.

The app should separately distinguish:

```text
Joke Language
Voice Language
```

because a browser may have a suitable voice even when a joke language is not available.

## 6.7 Joke types

Supported joke types:

```text
single
twopart
```

### Single

Response contains:

```js
{
  category,
  type: 'single',
  joke,
  flags,
  id,
  safe,
  lang
}
```

### Two-part

Response contains:

```js
{
  category,
  type: 'twopart',
  setup,
  delivery,
  flags,
  id,
  safe,
  lang
}
```

Never assume `joke` exists on a `twopart` response.

## 6.8 Batch requests

Use:

```text
?amount=10
```

as the preferred mechanism for radio queue preloading.

The documented maximum is 10 jokes per request.

Do not fetch one joke for every next-button click in Radio Mode.

Recommended queue behavior:

```text
Initial batch = 10
Refill when remaining <= 3
```

Implement a cooldown/debounce layer to prevent accidental rapid API requests.

## 6.9 Search

Use:

```text
?contains=...
```

for Discover search.

The value is case-insensitive but must be URL encoded.

Example:

```js
const params = new URLSearchParams({
  contains: query
});
```

Search UI must validate empty strings and avoid requests for whitespace-only values.

## 6.10 ID range

Use:

```text
?idRange=number-number
```

or a single ID.

The ID range varies by language and may change over time.

Do not hard-code a universal maximum joke ID as application truth.

Use `/info` metadata when an ID range is needed.

## 6.11 Metadata endpoints

Use the following endpoints where useful:

```http
GET /info
GET /categories
GET /languages
GET /flags
GET /formats
GET /ping
GET /langcode/[Language]
```

These endpoints should power API Lab rather than being fetched continuously.

Cache metadata locally with timestamps.

## 6.12 Error handling

Handle:

```text
HTTP 200
HTTP 400
HTTP 404
HTTP 429
HTTP 5xx
network failure
malformed/empty response
browser offline
speech unavailable
```

JokeAPI can return an API-level error payload even when the HTTP request itself succeeded.

Always check:

```js
data.error
```

before treating the payload as a joke.

Recommended error states:

```text
API OFFLINE
Too many requests
No matching jokes
Invalid filters
No jokes available for selected language
Unexpected API response
```

Do not expose raw stack traces or giant JSON blobs to normal users.

---

# 7. Rate-Limit Strategy

JokeAPI documents a hard limit of 120 requests per minute per client.

The application must behave as though API calls are a limited resource.

Rules:

1. Prefer batch retrieval.
2. Cache current queues.
3. Do not refetch the same joke unnecessarily.
4. Do not make API requests while the user is typing.
5. Search only after an explicit submit action.
6. Debounce UI interactions that can trigger network requests.
7. Detect HTTP 429.
8. Show a friendly retry state.
9. Prefer local history/favorites when possible.
10. Never implement an aggressive polling loop.

For normal use, an ordinary session should consume very few requests.

---

# 8. Data Model

Define a normalized internal representation.

```js
{
  id: 51,
  category: 'Programming',
  type: 'twopart',

  setup: 'Why do programmers wear glasses?',
  delivery: 'Because they need to C#',

  joke: null,

  flags: {
    nsfw: false,
    religious: false,
    political: false,
    racist: false,
    sexist: false,
    explicit: false
  },

  safe: true,
  lang: 'en',

  fetchedAt: 0,
  playedAt: null,
  playCount: 0,
  favorite: false
}
```

For single jokes:

```js
{
  type: 'single',
  joke: '...',
  setup: null,
  delivery: null
}
```

Use `null`, not ambiguous empty strings, where possible.

## 8.1 Stable joke identity

Primary identity:

```text
lang + ':' + id
```

Example:

```js
function getJokeKey(joke) {
  return `${joke.lang}:${joke.id}`;
}
```

Do not assume an ID is universally unique across every language.

---

# 9. Application State

Use a centralized application state object.

Suggested shape:

```js
const state = {
  route: 'home',

  currentJoke: null,

  queue: [],
  queueIndex: -1,

  history: [],
  favorites: [],

  playback: {
    isPlaying: false,
    isPaused: false,
    currentPart: null,
    progress: 0,
    mode: 'manual',
    timer: null
  },

  speech: {
    supported: true,
    voices: [],
    selectedVoiceURI: null,
    language: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  },

  filters: {
    categories: ['Any'],
    type: 'mixed',
    blacklistFlags: [],
    lang: 'en',
    safeMode: true,
    contains: '',
    idRange: null
  },

  settings: {
    autoPlay: false,
    pauseBeforePunchline: 1.5,
    introEnabled: true,
    autoRefillQueue: true,
    reducedMotion: false
  },

  stats: {
    jokesPlayed: 0,
    jokesCompleted: 0,
    favoritesAdded: 0,
    gamesPlayed: 0,
    correctAnswers: 0,
    currentStreak: 0,
    bestStreak: 0
  }
};
```

Do not allow arbitrary components to mutate state without going through clear state functions.

Prefer functions such as:

```js
setCurrentJoke()
addToHistory()
toggleFavorite()
enqueueJokes()
setPlaybackState()
setVoiceSettings()
updateFilters()
recordGameResult()
```

---

# 10. Mode System

JokeFM must support multiple modes.

The following modes are part of the product blueprint.

---

## MODE 1 — Radio Mode

### Goal

Turn JokeAPI into a continuous personal comedy station.

### User experience

User selects a station:

```text
RANDOM FM
PROGRAMMER HOUR
PUN PARADE
SPOOKY SIGNAL
HOLIDAY RADIO
DARK ROOM
```

Then the app fetches a queue and automatically performs jokes.

### Queue

Use batches of up to 10.

```text
Queue:
[1] current
[2] next
[3] next
...
[10]
```

When queue remaining count reaches a low threshold, optionally preload another batch.

### Radio intro

Generate local narration:

```text
"Welcome to JokeFM."

"You're listening to Programmer Hour."

"Let's get into today's jokes."
```

Do not send these strings to JokeAPI.

### Radio outro

```text
"That's all for this set."

"Thanks for listening to JokeFM."
```

### Two-part performance

Recommended timeline:

```text
setup
↓
optional pause
↓
delivery
↓
small completion delay
↓
next joke
```

Default pause:

```text
1.5 seconds
```

Allow settings:

```text
0.5s
1.0s
1.5s
2.0s
2.5s
3.0s
```

### Radio controls

Must include:

```text
Play / Pause
Previous
Next
Replay
Favorite
Queue
Volume
Voice
Station
```

Keyboard:

```text
Space = play/pause
Arrow Right = next
Arrow Left = previous
R = replay
F = favorite
M = mute
```

Do not trigger shortcuts while focus is inside text inputs unless appropriate.

---

## MODE 2 — Discover

### Goal

Make JokeAPI feel like a searchable comedy database.

### UI

```text
SEARCH JOKES
[ programmer................ ] [SEARCH]

CATEGORY
[ Any ▼ ]

TYPE
[ Any ▼ ]

LANGUAGE
[ English ▼ ]

CONTENT
[ Family Friendly ▼ ]

RESULTS
──────────────────────────────
#51 Programming
Why do programmers wear glasses?
Because they need to C#.

[▶ READ] [♡ SAVE]
```

### Filters

Support:

```text
search text
category
type
language
blacklist flags
safe mode
amount
```

Add ID range only in an advanced panel.

### Search behavior

Do not query on every keystroke.

Use:

```text
Enter
Search button
```

as the primary trigger.

### Result cards

Show:

- category
- joke type
- language
- joke content
- favorite state
- read button
- game button where applicable

---

## MODE 3 — Joke Player / Single Joke Mode

### Goal

Provide a focused “give me a joke” experience.

Screen:

```text
┌──────────────────────────────┐
│       RANDOM JOKE             │
│                              │
│   Why do programmers...      │
│                              │
│       🔊 SPEAK               │
│                              │
│  [NEW JOKE]  [♡ SAVE]        │
└──────────────────────────────┘
```

This is the simplest fallback mode.

It should remain available even when the richer modes are used.

---

## MODE 4 — Finish the Joke

### Goal

Turn two-part jokes into a guessing game.

### Flow

1. Fetch a `twopart` joke.
2. Display setup.
3. Hide delivery.
4. Present the user with answer controls.
5. User enters or selects an answer.
6. Reveal actual delivery.
7. Perform punchline using TTS.
8. Record score.

### Difficulty

Possible difficulty heuristics:

```text
Easy:
Show first few words of delivery.

Normal:
Hide delivery entirely.

Hard:
Show setup only and require free-text guess.
```

Do not claim that user-generated guesses are semantically correct unless implementing a separate matching system.

The first version should use user-choice or simple reveal scoring.

---

## MODE 5 — Punchline Guess

### Goal

Present setup with several possible punchlines.

Example:

```text
What do programmers wear glasses?

A. Because the screen is bright.
B. Because they need to C#.
C. Because computers are dangerous.
D. Because Java is hot.
```

The true delivery comes from the API.

Distractors should preferably be taken from other joke deliveries and transformed carefully.

Do not manipulate copyrighted text excessively.

### Scoring

```text
Correct = +1
Incorrect = 0
```

Optional:

```text
3 consecutive = +1 bonus
```

Display:

```text
Score
Streak
Accuracy
```

---

## MODE 6 — Category Challenge

### Goal

Give the user a limited set of jokes and ask them to identify the category.

Example:

```text
GUESS THE CATEGORY

Joke:
"Why does JavaScript..."

[ Programming ]
[ Pun ]
[ Misc ]
[ Dark ]
```

### Mechanics

- fetch a batch
- pick one joke
- hide category
- give 3–4 choices
- speak the joke
- user answers
- reveal category
- score

Do not make difficulty depend solely on category frequency.

---

## MODE 7 — Speed Joke

### Goal

Create a lightweight reaction game.

A joke appears.

User has a limited time to:

- read/listen
- identify punchline
- answer
- move on

Timer examples:

```text
15 sec
10 sec
5 sec
```

The app should use this mode carefully for accessibility.

Allow the timer to be disabled.

---

## MODE 8 — Comedy Challenge / Delivery Challenge

### Goal

Encourage users to practice telling a joke.

First version:

```text
JOKE DELIVERY CHALLENGE

Your joke:
[setup]

[START]

Deliver it yourself.

[REVEAL PUNCHLINE]
```

Do not require microphone access in the first implementation.

Optional future version:

- MediaRecorder
- SpeechRecognition
- timing analysis
- pause analysis
- volume analysis

These must remain optional because speech-recognition support varies by browser.

The browser's speech synthesis API is the required audio feature; microphone evaluation is an advanced extension.

---

## MODE 9 — Playlist / Personal Radio

### Goal

Allow users to create a personal queue.

Example:

```text
MY STATION

♡ Favorites
Programming
Pun Mix
Late Night
Spooky
```

A playlist consists of stored JokeAPI joke IDs/data.

Since the JokeAPI dataset can change, preserve the joke content returned at save time.

### Playlist controls

```text
Play
Shuffle
Remove
Clear
Rename
```

Do not assume the API can directly return “my playlist.”

The playlist is an application feature.

---

## MODE 10 — Library

### Sections

```text
FAVORITES
HISTORY
MOST PLAYED
RECENTLY PLAYED
SAVED GAMES
```

### Favorite card

```text
♡ FAVORITE

Programming
Two Part

"Why do programmers..."

[▶ PLAY] [REMOVE]
```

### History

Store:

```text
lastPlayed
playCount
completed
```

Do not grow localStorage without limit.

Use sensible caps:

```text
History: 250
Favorites: 500
```

Make limits configurable if needed.

---

## MODE 11 — Statistics

### Goal

Show how the user interacts with the application.

Possible stats:

```text
JOKES PLAYED
1,284

FAVORITES
83

CURRENT STREAK
9

BEST STREAK
31

MOST PLAYED CATEGORY
Programming

MOST PLAYED TYPE
Two-Part

MOST USED VOICE
Microsoft David
```

Charts can initially be simple CSS bars.

Do not add a chart library unless needed.

### Daily activity

Store a compact activity record:

```js
{
  date: '2026-10-05',
  jokesPlayed: 8,
  gamesPlayed: 2
}
```

This enables a small “activity calendar” later.

---

## MODE 12 — API Lab

### Goal

Expose JokeAPI functionality as a user-facing technical playground.

Sections:

```text
API STATUS
CATEGORIES
LANGUAGES
FLAGS
FORMATS
ENDPOINTS
PING
REQUEST BUILDER
```

### Request Builder

Example:

```text
CATEGORY
[ Programming ]

LANGUAGE
[ English ]

TYPE
[ Two Part ]

AMOUNT
[ 5 ]

BLACKLIST
[x] NSFW
[x] Racist
[x] Sexist
[x] Explicit

[ SEND REQUEST ]

Generated request:
https://v2.jokeapi.dev/joke/Programming?...
```

Display a sanitized request preview.

Optional:

```text
VIEW JSON
```

### Why this screen exists

This turns the personal project into a visible API integration demonstration.

---

## MODE 13 — API Status / System Monitor

Use metadata endpoints to create a Y2K “system monitor” screen.

Display:

```text
JOKEFM SYSTEM MONITOR

JokeAPI
● ONLINE

API version
2.x.x

Known joke count
----

Last ping
--- ms

Metadata
● categories loaded
● languages loaded
● flags loaded
```

Do not hard-code current joke totals as permanent truth.

Use `/info` when the screen is opened or metadata is stale.

---

## MODE 14 — Language Radio

### Goal

Allow users to choose available JokeAPI languages.

UI:

```text
JOKE LANGUAGE
[ English ▼ ]

TTS VOICE
[ Browser voice ▼ ]
```

If the chosen joke language does not have a matching browser voice:

1. use an explicitly selected compatible voice if possible
2. otherwise use a default voice
3. clearly show the fallback

Do not silently change the joke's language.

---

# 11. Radio Station Definitions

Stations should be application configurations.

Suggested structure:

```js
const stations = {
  random: {
    name: 'Random FM',
    categories: ['Any'],
    defaultType: 'mixed'
  },

  programming: {
    name: 'Programmer Hour',
    categories: ['Programming'],
    defaultType: 'mixed'
  },

  pun: {
    name: 'Pun Parade',
    categories: ['Pun'],
    defaultType: 'mixed'
  },

  spooky: {
    name: 'Spooky Signal',
    categories: ['Spooky'],
    defaultType: 'mixed'
  },

  christmas: {
    name: 'Holiday Radio',
    categories: ['Christmas'],
    defaultType: 'mixed'
  },

  dark: {
    name: 'Dark Room',
    categories: ['Dark'],
    defaultType: 'mixed'
  }
};
```

Do not create fake API categories.

A station is a product-level configuration built using real API categories.

---

# 12. Speech Synthesis Architecture

Use the browser Web Speech API.

Primary interface:

```js
const synth = window.speechSynthesis;
```

Create utterances with:

```js
new SpeechSynthesisUtterance(text);
```

Supported properties that should be exposed:

```text
voice
lang
rate
pitch
volume
```

## 12.1 Voice loading

Browser voice lists may become available asynchronously.

Initialize:

```js
speechSynthesis.getVoices();
```

Also listen for:

```js
speechSynthesis.onvoiceschanged
```

Normalize voices into:

```js
{
  voiceURI,
  name,
  lang,
  localService
}
```

Do not store the entire Voice object in localStorage.

Store only:

```text
voiceURI
```

Then resolve it again on startup.

## 12.2 Voice selection

Prefer explicit `voiceURI`.

Fallback order:

```text
saved voice
↓
same language
↓
same language family
↓
browser default
```

## 12.3 Playback controller

Create one central service:

```text
SpeechService
```

Responsibilities:

```text
speak()
pause()
resume()
stop()
replay()
setVoice()
setRate()
setPitch()
setVolume()
getVoices()
```

Do not scatter direct `speechSynthesis.speak()` calls throughout components.

## 12.4 Speech state

Track:

```js
{
  status: 'idle',
  utterance: null,
  currentJokeId: null,
  currentPart: null
}
```

Statuses:

```text
idle
loading
speaking
paused
waiting
finished
error
```

## 12.5 Events

Handle:

```text
start
end
error
pause
resume
boundary
```

The `boundary` event is optional and should be treated as progressive enhancement because browser support is not universal.

Do not make word-by-word highlighting a critical feature.

---

# 13. Comedic Timing Engine

Create a dedicated module:

```text
comedyTiming.js
```

Rules:

### Single joke

```text
Speak full joke
↓
Wait short interval
↓
Ready for next
```

### Two-part joke

```text
Speak setup
↓
pauseBeforePunchline
↓
Speak delivery
```

Default:

```js
pauseBeforePunchline = 1500;
```

### Dramatic station

Optional:

```text
setup
↓
2500 ms
↓
delivery
```

### Rapid-fire station

Optional:

```text
setup + delivery
↓
400 ms
↓
next
```

Do not hard-code timing inside UI components.

---

# 14. Y2K Design System

## 14.1 Core rule

The visual system should communicate:

**“2000-era personal media software running on a modern browser.”**

Do not sacrifice usability for nostalgia.

## 14.2 Suggested palette

Use a flexible palette, not a single rigid color.

Primary:

```text
Electric Blue       #4EA7FF
Digital Cyan        #63E7FF
Chrome Light        #E8EEF4
Chrome Dark         #7D8792
Soft Silver         #BFC8D2
Plastic White       #F4F7FA
Deep Navy           #08111F
Near Black          #05070B
Acid Lime Accent    #B7FF4A
Hot Magenta         #FF54C8
```

Optional secondary tones:

```text
Violet
Turquoise
Neon Yellow
```

Use accents carefully.

The interface should still pass readable contrast requirements.

## 14.3 Materials

Use combinations of:

- gradient chrome
- subtle noise
- glass
- translucent plastic
- beveled borders
- inner highlights
- soft shadows
- hard inset shadows
- scanline textures
- tiny pixel decorations
- glossy title bars

Avoid:

- excessive blur
- low-contrast text
- giant neon glows
- fake 3D perspective everywhere
- unreadable tiny bitmap text
- animation on every element

## 14.4 Panels

Panels should look like old software windows.

Example CSS concept:

```css
.y2k-window {
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    inset 1px 1px 0 rgba(255, 255, 255, 0.9),
    inset -1px -1px 0 rgba(0, 0, 0, 0.25),
    0 10px 28px rgba(0, 0, 0, 0.18);
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,0.88),
      rgba(220,230,240,0.72)
    );
}
```

Use this as a direction, not as a mandatory exact implementation.

## 14.5 Window title bars

Use:

```text
┌────────────────────────────────────┐
│ ◉ JokeFM — Radio Station       _ □ X
└────────────────────────────────────┘
```

The window title bar is decorative but useful for hierarchy.

## 14.6 Buttons

Y2K buttons should look like hardware/software controls.

States:

```text
default
hover
active
focus
disabled
loading
```

Recommended behavior:

- hover: slight brightness
- active: inset shadow / 1–2 px downward movement
- keyboard focus: strong visible outline
- disabled: reduced contrast but still readable

Avoid excessive “button bounce.”

## 14.7 Typography

Use a modern readable UI font as the default.

Recommended pairing:

```text
Primary UI:
system-ui / Inter-like sans-serif

Display:
optional geometric or techno font

Pixel accent:
small bitmap font only for labels/decorative counters
```

Do not use a pixel font for paragraphs.

## 14.8 Icons

Preferred:

- simple Unicode symbols where appropriate
- SVG icons
- tiny pixel icons
- familiar media controls

Examples:

```text
▶
⏸
⏭
⏮
♡
♥
🔊
⚙
⌕
```

If replacing emoji with icon graphics, preserve accessible labels.

## 14.9 CRT effects

Optional:

- scanlines
- subtle screen noise
- faint chromatic aberration
- tiny flicker

All CRT effects must be subtle.

Provide:

```text
Reduced Motion / Effects
```

and disable nonessential animation under reduced-motion preferences.

---

# 15. Signature UI Components

Create reusable components/modules for:

```text
AppShell
TopBar
NavigationTabs
Y2KWindow
WindowTitleBar
Button
IconButton
Toggle
Slider
Select
JokeCard
TwoPartJokeCard
NowPlaying
TransportControls
VoiceSelector
StationSelector
QueuePanel
SearchPanel
FilterPanel
GameCard
ScorePanel
FavoriteButton
HistoryList
StatsPanel
ApiStatusCard
JsonViewer
Toast
Modal
LoadingSpinner
EmptyState
ErrorState
```

Do not duplicate button styles across screens.

---

# 16. Global Player

When a joke is playing, show a persistent mini-player.

Desktop:

```text
┌──────────────────────────────────────────────────────────────┐
│ 🎙 Programmer Hour   "Why do programmers..."                 │
│                                                              │
│      ◀      ▶/❚❚      ▶       ♡       🔊                    │
└──────────────────────────────────────────────────────────────┘
```

Mobile:

```text
┌──────────────────────────────┐
│ 🎙 Programmer Hour           │
│ "Why do programmers..."      │
│        ◀  ❚❚  ▶             │
└──────────────────────────────┘
```

Do not stop playback just because the user navigates from Radio to Library.

---

# 17. Accessibility

Accessibility is mandatory.

## 17.1 Keyboard

Everything actionable must be keyboard accessible.

Minimum shortcuts:

```text
Space
Arrow Left
Arrow Right
R
F
M
```

Do not break normal text input behavior.

## 17.2 Focus

Never remove browser focus without a clear reason.

Use visible focus states.

## 17.3 Screen readers

Every icon-only button requires:

```html
aria-label="Play"
```

Do not rely on icon appearance alone.

## 17.4 Live regions

Use `aria-live` for:

```text
new joke loaded
speech started
speech completed
game result
API error
favorite saved
```

Do not make the entire application a live region.

## 17.5 Reduced motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Disable:

- flashing
- excessive marquee behavior
- continuous floating effects
- rapid transitions

## 17.6 Color

Do not use color as the only indicator of:

- correctness
- error
- selection
- playback state

---

# 18. Local Storage Architecture

Use namespaced keys.

Recommended:

```text
jokefm:settings
jokefm:favorites
jokefm:history
jokefm:stats
jokefm:playlists
jokefm:metadata
jokefm:version
```

Example:

```js
localStorage.setItem(
  'jokefm:settings',
  JSON.stringify(state.settings)
);
```

Always use safe parse helpers.

```js
function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
```

## Migration

Store a data version:

```js
{
  version: 1,
  ...
}
```

Future versions should include migrations.

---

# 19. Persistence Limits

Avoid unbounded localStorage growth.

Recommended defaults:

```text
history: 250 entries
favorites: 500 entries
playlist entries: 500 per playlist
activity days: 365
```

When limits are exceeded:

```text
remove oldest non-favorite history
```

Never silently delete favorites because a history limit was reached.

---

# 20. API Service Layer

Create:

```text
src/services/jokeApi.js
```

Responsibilities:

```text
buildJokeUrl()
fetchJoke()
fetchJokes()
fetchInfo()
fetchCategories()
fetchLanguages()
fetchFlags()
fetchFormats()
pingApi()
resolveLanguageCode()
```

Do not put API calls directly inside UI rendering modules.

## 20.1 Request builder

Example:

```js
export function buildJokeUrl({
  categories = ['Any'],
  type = null,
  amount = 1,
  lang = null,
  blacklistFlags = [],
  safeMode = false,
  contains = null,
  idRange = null
}) {
  const categoryPath = categories.join(',');
  const url = new URL(`/joke/${categoryPath}`, API_BASE_URL);

  const params = url.searchParams;

  if (type && type !== 'mixed') {
    params.set('type', type);
  }

  if (amount > 1) {
    params.set('amount', String(amount));
  }

  if (lang) {
    params.set('lang', lang);
  }

  if (blacklistFlags.length) {
    params.set('blacklistFlags', blacklistFlags.join(','));
  }

  if (safeMode) {
    params.set('safe-mode', '');
  }

  if (contains?.trim()) {
    params.set('contains', contains.trim());
  }

  if (idRange) {
    params.set('idRange', idRange);
  }

  return url.toString();
}
```

Adapt parameter handling to the API's exact documented syntax.

---

# 21. Response Normalization

Create:

```text
src/services/jokeNormalizer.js
```

Example:

```js
export function normalizeJoke(raw) {
  if (!raw || raw.error) {
    throw new Error('Invalid joke response');
  }

  return {
    id: raw.id,
    category: raw.category,
    type: raw.type,
    joke: raw.type === 'single' ? raw.joke : null,
    setup: raw.type === 'twopart' ? raw.setup : null,
    delivery: raw.type === 'twopart' ? raw.delivery : null,
    flags: {
      nsfw: Boolean(raw.flags?.nsfw),
      religious: Boolean(raw.flags?.religious),
      political: Boolean(raw.flags?.political),
      racist: Boolean(raw.flags?.racist),
      sexist: Boolean(raw.flags?.sexist),
      explicit: Boolean(raw.flags?.explicit)
    },
    safe: Boolean(raw.safe),
    lang: raw.lang
  };
}
```

The UI should never need to understand the raw API format.

---

# 22. Queue Service

Create:

```text
src/services/queueManager.js
```

Responsibilities:

```text
add()
remove()
clear()
next()
previous()
current()
remaining()
shuffle()
refill()
```

Queue rules:

- avoid duplicate joke keys
- preserve current joke when refilling
- handle previous correctly
- gracefully handle an empty queue
- never issue more API requests than necessary

---

# 23. Duplicate Handling

Because batches can overlap with user history, use:

```js
const seen = new Set();
```

and:

```js
getJokeKey(joke)
```

to avoid duplicate queue entries.

Duplicate handling should be local.

Do not repeatedly fetch new requests just because one duplicate appeared unless necessary.

---

# 24. History Rules

Record history when a joke has meaningfully played.

Recommended behavior:

```text
start speaking
→ mark current as recently played
```

and:

```text
complete delivery
→ increment completed count
```

This distinguishes:

```text
played
completed
```

A user who presses Next halfway through should not count the joke as fully completed.

---

# 25. Favorites

Favorite toggle must be idempotent.

```text
not saved → save
saved → remove
```

Do not create multiple copies of the same joke.

Use joke key:

```text
lang:id
```

---

# 26. Game Architecture

Create a generic game interface:

```js
{
  id: 'punchline-guess',
  title: 'Punchline Guess',

  start(),
  loadQuestion(),
  submitAnswer(),
  reveal(),
  finish()
}
```

All games should expose:

```text
score
streak
questionsPlayed
correct
incorrect
```

Keep game state isolated from radio state.

Do not allow a game to unexpectedly overwrite Radio Mode queue state.

---

# 27. Game Result Model

```js
{
  gameId: 'punchline-guess',
  startedAt: 0,
  finishedAt: 0,

  questions: 10,
  correct: 7,
  incorrect: 3,

  score: 7,
  bestStreak: 4
}
```

Store only lightweight historical records.

---

# 28. Stats Calculation

Prefer deriving secondary statistics from stored events/data rather than duplicating many counters.

For example:

```text
mostPlayedCategory
```

can be calculated from history.

Counters such as total favorites can be calculated from the library.

Use persisted aggregate counters only where there is a clear performance or simplicity benefit.

---

# 29. API Metadata Cache

Create:

```text
src/services/apiMetadata.js
```

Cache:

```text
/info
/categories
/languages
/flags
/formats
```

Use timestamps:

```js
{
  fetchedAt: 1728100000000,
  data: {}
}
```

Suggested metadata TTL:

```text
24 hours
```

If metadata is missing or expired, fetch it as needed.

Do not fetch all metadata on every page load.

---

# 30. Loading States

Do not display a blank screen during network activity.

Use Y2K loading visuals:

```text
CONNECTING TO JOKEFM...
[████████░░░░] 68%
```

or:

```text
FETCHING COMEDY PACKET...
● ● ● ○
```

These should be decorative UI states, not fake measured progress.

Never represent fake progress as actual network percentage.

For real progress, use an indeterminate indicator.

---

# 31. API Error UX

### Network offline

```text
CONNECTION LOST

JokeAPI cannot be reached.

Your saved jokes are still available.

[OPEN LIBRARY]
[RETRY]
```

### 429

```text
REQUEST LIMIT REACHED

JokeFM has been asking for too many jokes.

Please retry shortly.

[RETRY]
```

### No result

```text
NO JOKES FOUND

Try removing a filter or changing category.

[RESET FILTERS]
```

### Speech unavailable

```text
TEXT-TO-SPEECH UNAVAILABLE

Your browser does not currently provide speech synthesis.

You can still read and play jokes manually.
```

Do not make the entire application unusable because TTS is unavailable.

---

# 32. Offline Behavior

Full offline JokeAPI retrieval is not required.

However, local data should remain accessible.

Offline-capable:

```text
Favorites
History
Stats
Settings
Saved playlists
Previously cached jokes
```

Online-dependent:

```text
new JokeAPI requests
fresh metadata
API ping
Discover requests
```

Optional future enhancement:

- service worker
- PWA shell caching
- offline saved-joke playback

---

# 33. Responsive Design

Breakpoints should not be based solely on device names.

Design around layout needs.

Desktop:

```text
2-column dashboard
```

Tablet:

```text
stacked/compact panels
```

Mobile:

```text
single-column
bottom player
collapsible filter drawer
```

Touch targets should be large enough to use comfortably.

---

# 34. Routing

Use a lightweight client-side router or a simple state-based view router.

Suggested routes:

```text
/
 /radio
 /discover
 /games
 /games/punchline
 /games/category
 /games/speed
 /library
 /stats
 /api
 /settings
```

A full router library is optional for a small Vite app.

Do not add a routing dependency unless it improves maintainability.

---

# 35. Project Structure

Recommended:

```text
jokefm/
├── public/
│   ├── icons/
│   ├── sounds/
│   └── textures/
│
├── src/
│   ├── main.js
│   │
│   ├── app/
│   │   ├── router.js
│   │   ├── state.js
│   │   ├── events.js
│   │   └── bootstrap.js
│   │
│   ├── services/
│   │   ├── jokeApi.js
│   │   ├── jokeNormalizer.js
│   │   ├── speechService.js
│   │   ├── comedyTiming.js
│   │   ├── queueManager.js
│   │   ├── storage.js
│   │   ├── statsService.js
│   │   └── apiMetadata.js
│   │
│   ├── modes/
│   │   ├── radio/
│   │   ├── discover/
│   │   ├── player/
│   │   ├── games/
│   │   └── library/
│   │
│   ├── components/
│   │   ├── Y2KWindow.js
│   │   ├── JokeCard.js
│   │   ├── NowPlaying.js
│   │   ├── TransportControls.js
│   │   ├── FavoriteButton.js
│   │   ├── VoiceSelector.js
│   │   └── ...
│   │
│   ├── styles/
│   │   ├── reset.css
│   │   ├── tokens.css
│   │   ├── y2k.css
│   │   ├── components.css
│   │   ├── layouts.css
│   │   └── utilities.css
│   │
│   └── utils/
│       ├── format.js
│       ├── validation.js
│       ├── debounce.js
│       └── ids.js
│
├── index.html
├── package.json
├── README.md
└── SKILL.md
```

---

# 36. CSS Architecture

Use design tokens.

Example:

```css
:root {
  --bg: #08111f;
  --surface: #dfe6ed;
  --surface-alt: #c5ced8;

  --text: #0a1220;
  --text-inverse: #f4f7fa;

  --accent: #4ea7ff;
  --cyan: #63e7ff;
  --pink: #ff54c8;
  --lime: #b7ff4a;

  --border-light: rgba(255,255,255,.9);
  --border-dark: rgba(0,0,0,.25);

  --radius-window: 10px;
  --radius-control: 6px;

  --shadow-window:
    0 12px 28px rgba(0,0,0,.22);

  --transition-fast: 120ms ease;
}
```

Keep all visual constants centralized.

---

# 37. Y2K Surface Guidelines

Use layers:

```text
Page background
    ↓
Decorative background texture
    ↓
Window
    ↓
Title bar
    ↓
Window content
    ↓
Nested cards
    ↓
Controls
```

Avoid putting every UI object inside multiple gradients.

Visual hierarchy must remain understandable.

---

# 38. Background Ideas

Possible Y2K background treatments:

### Option A

Dark blue digital desktop with subtle grid.

### Option B

Silver/blue translucent operating-system background.

### Option C

Midnight desktop with floating chrome utility windows.

Preferred default:

**dark digital desktop + bright chrome windows**

This gives the content and text enough contrast while preserving the Y2K visual identity.

---

# 39. Microcopy

Use concise software-style labels.

Good:

```text
NOW PLAYING
FETCHING...
QUEUE READY
API ONLINE
VOICE READY
JOKE SAVED
```

Avoid:

```text
We are delighted to inform you that your hilarious joke...
```

The application should sound like an old media utility.

---

# 40. Sound Design

Sound effects are optional.

Possible sounds:

```text
button click
window open
radio tuning
joke loaded
correct answer
incorrect answer
favorite saved
error buzz
```

Do not autoplay sounds on initial page load.

Speech volume must be separately controllable.

Do not use copyrighted audio assets unless properly licensed.

---

# 41. Audio Mixer Concept

Optional future feature:

```text
SPEECH          ██████████
UI SOUNDS       ████░░░░░░
AMBIENCE        ██░░░░░░░░
```

Do not implement ambient/background music before the basic TTS engine is stable.

---

# 42. TTS Voice Profiles

Allow profiles:

```text
NORMAL
DEADPAN
FAST
DRAMATIC
RADIO HOST
```

These are parameter presets, not different voice models.

Example:

```js
const voiceProfiles = {
  normal: {
    rate: 1.0,
    pitch: 1.0,
    pause: 1500
  },

  deadpan: {
    rate: 0.88,
    pitch: 0.9,
    pause: 2200
  },

  fast: {
    rate: 1.25,
    pitch: 1.0,
    pause: 500
  },

  dramatic: {
    rate: 0.85,
    pitch: 0.82,
    pause: 2500
  }
};
```

Treat these as suggested defaults, not universal values.

---

# 43. Text Preparation for TTS

Create:

```text
src/services/speechText.js
```

Normalize text for speech without modifying the visible joke.

Examples:

```text
Visible:
"Because they need to C#."

Speech:
"Because they need to C sharp."
```

This is especially useful for programming jokes.

Maintain separate fields:

```js
displayText
speechText
```

Do not permanently rewrite JokeAPI content.

Potential replacements:

```text
C#       → C sharp
C++      → C plus plus
JS       → JavaScript
API      → A P I
404      → four oh four
SQL      → S Q L
```

Use conservative substitutions.

---

# 44. Speech Safety

Do not assume the API's `safe` value means the text is universally suitable for every audience.

The app should honor its selected content filters.

Do not use TTS to amplify content that has already been filtered out.

---

# 45. Animation Guidelines

Y2K animations should be:

- short
- mechanical
- glossy
- tactile

Examples:

```text
button press: 80–120 ms
window open: 160–220 ms
panel reveal: 180–280 ms
```

Avoid:

- continuous shaking
- flashing
- seizure-triggering patterns
- giant looping marquees
- excessive bouncing

---

# 46. Home Screen Blueprint

```text
┌─────────────────────────────────────────────────────────────────┐
│ JOKEFM                                ● API ONLINE     _ □ X    │
├─────────────────────────────────────────────────────────────────┤
│ HOME   RADIO   DISCOVER   GAMES   LIBRARY   API LAB   SETTINGS │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐   ┌──────────────────────────┐ │
│  │   🎙 JOKEFM                 │   │ NOW PLAYING              │ │
│  │                             │   │                          │ │
│  │   YOUR PERSONAL             │   │ Programmer Hour           │ │
│  │   COMEDY RADIO              │   │                          │ │
│  │                             │   │ "Why do programmers..."  │ │
│  │   [▶ START SHOW]            │   │                          │ │
│  └─────────────────────────────┘   │ ◀  ▶/❚❚  ▶              │ │
│                                    └──────────────────────────┘ │
│                                                                 │
│  STATIONS                                                       │
│                                                                 │
│  [PROGRAMMER] [PUN PARADE] [RANDOM] [SPOOKY] [HOLIDAY]         │
│                                                                 │
│  QUICK ACCESS                                                    │
│  [RANDOM JOKE] [DISCOVER] [PUNCHLINE GAME] [MY FAVORITES]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 47. Radio Screen Blueprint

```text
┌───────────────────────────────────────────────────────────────┐
│ RADIO — PROGRAMMER HOUR                                       │
├──────────────────────────────┬────────────────────────────────┤
│                              │ QUEUE                          │
│       🎙 NOW PLAYING         │                                │
│                              │ 01 ✓ completed                 │
│      Programming #51        │ 02 ▶ current                   │
│                              │ 03 next                        │
│  "Why do programmers..."     │ 04 next                        │
│                              │ ...                            │
│  "Because they need to C#"  │                                │
│                              │ [SHUFFLE] [CLEAR]              │
│       🔊 SPEAKING            │                                │
├──────────────────────────────┴────────────────────────────────┤
│ ◀ PREV     ▶/❚❚ PLAY     NEXT ▶     ↻ REPLAY     ♡ SAVE      │
└───────────────────────────────────────────────────────────────┘
```

---

# 48. Discover Screen Blueprint

```text
┌───────────────────────────────────────────────────────────────┐
│ DISCOVER                                                      │
├───────────────────────────────────────────────────────────────┤
│ SEARCH                                                         │
│ [ programmer____________________________ ] [SEARCH]            │
│                                                               │
│ FILTERS                                                       │
│ Category [Programming ▼] Type [Any ▼] Lang [English ▼]       │
│                                                               │
│ Content: [✓ Family Friendly]                                  │
│                                                               │
│ RESULTS                                                       │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Programming · Two-Part · #51                             │   │
│ │ Why do programmers wear glasses?                         │   │
│ │ Because they need to C#.                                 │   │
│ │ [▶ READ] [♡ SAVE] [PLAY AS GAME]                         │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

# 49. Library Screen Blueprint

Tabs:

```text
FAVORITES | HISTORY | PLAYLISTS | STATS
```

Cards should prioritize readability.

Do not make every library item visually heavy.

---

# 50. API Lab Screen Blueprint

```text
┌───────────────────────────────────────────────────────────────┐
│ API LAB                                                       │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│ API STATUS                                                     │
│ JokeAPI ● ONLINE                                                │
│ Version: ...                                                    │
│                                                                │
│ ENDPOINTS                                                       │
│ [INFO] [CATEGORIES] [LANGUAGES] [FLAGS] [FORMATS] [PING]      │
│                                                                │
│ REQUEST BUILDER                                                 │
│ Category: [Programming]                                         │
│ Type: [Two-Part]                                                │
│ Language: [English]                                             │
│ Amount: [5]                                                     │
│ [✓] Family Friendly                                             │
│                                                                │
│ [SEND REQUEST]                                                  │
│                                                                │
│ RESPONSE                                                        │
│ { JSON viewer }                                                 │
└───────────────────────────────────────────────────────────────┘
```

---

# 51. Settings Screen Blueprint

Sections:

## Speech

```text
Voice
Rate
Pitch
Volume
```

## Performance

```text
Punchline pause
Auto-play
Radio intro
Auto-refill queue
```

## Content

```text
Safe mode
Blacklist flags
Default category
Default language
```

## Appearance

```text
Theme
CRT effects
Animations
Reduced motion
```

## Data

```text
Clear history
Clear favorites
Reset statistics
Reset all settings
Export data
Import data
```

---

# 52. Data Export

Add optional JSON export.

Example:

```json
{
  "version": 1,
  "settings": {},
  "favorites": [],
  "history": [],
  "playlists": [],
  "stats": {}
}
```

Filename:

```text
jokefm-backup-YYYY-MM-DD.json
```

Import must validate structure before replacing data.

Never trust imported JSON blindly.

---

# 53. Share Feature

Optional.

Provide:

```text
Copy joke
Copy share text
```

Do not assume external deep links will always work.

Future design:

```text
/joke/en/51
```

If implementing shareable routes, the application should be able to load the joke from persisted data or an API query when the link is opened.

---

# 54. Security & Robustness

The app is client-side but still must follow basic security practices.

Never inject joke text through unsafe HTML.

Prefer:

```js
element.textContent = jokeText;
```

instead of:

```js
element.innerHTML = jokeText;
```

If markup is ever required, sanitize it.

Treat API responses as untrusted external data.

Do not evaluate API response strings as code.

---

# 55. Performance

Target:

```text
fast initial render
minimal API requests
minimal DOM churn
no unnecessary dependencies
```

Use:

- event delegation where appropriate
- lazy loading for noncritical screens
- queue prefetch
- metadata caching
- small components
- CSS instead of image-heavy effects where possible

Do not optimize prematurely.

---

# 56. Testing Strategy

## Unit tests

At minimum:

```text
buildJokeUrl()
normalizeJoke()
getJokeKey()
storage load/save
queue next/previous
favorite toggle
score calculation
```

## Integration tests

Test:

```text
fetch joke
fetch batch
two-part playback
voice selection
history recording
favorite saving
game flow
```

## Manual browser matrix

At least test:

```text
Chrome desktop
Edge desktop
Firefox desktop
Chrome mobile / Android where available
Safari where available
```

Speech behavior may differ by operating system and installed voices.

Do not assume identical voice lists across browsers.

---

# 57. Failure-First Development

Before polishing visuals, make these states work:

```text
API success
API error
429
offline
single joke
two-part joke
empty search
speech unavailable
no matching voice
empty favorites
empty history
empty queue
```

Every screen must have an empty, loading, success, and error state where applicable.

---

# 58. Development Phases

## PHASE 1 — Foundation

Build:

```text
Vite
app shell
basic navigation
JokeAPI service
joke normalization
simple JokeCard
basic TTS
```

Success:

```text
Fetch joke
Display joke
Speak joke
Next joke
```

Do not build games yet.

---

## PHASE 2 — Y2K Shell

Build:

```text
desktop shell
window cards
navigation tabs
title bars
buttons
sliders
responsive layout
```

Success:

The app already visually resembles JokeFM before all features are completed.

---

## PHASE 3 — Radio Engine

Build:

```text
batch fetching
queue manager
previous/next
auto-play
two-part timing
global player
station configuration
```

Success:

User can start a station and listen continuously.

---

## PHASE 4 — Speech Controls

Build:

```text
voice discovery
voice selection
rate
pitch
volume
pause controls
speech states
replay
```

Success:

TTS behaves predictably across supported browsers.

---

## PHASE 5 — Discover

Build:

```text
search
category
type
language
content filters
results
read/save controls
```

Success:

User can find jokes rather than only generate them.

---

## PHASE 6 — Library

Build:

```text
favorites
history
playlists
localStorage
limits
```

Success:

Reloading the browser does not lose important user data.

---

## PHASE 7 — Games

Implement in order:

```text
Finish the Joke
Punchline Guess
Category Challenge
Speed Joke
```

Add Delivery Challenge only after the above are stable.

---

## PHASE 8 — Statistics

Build:

```text
play count
favorite count
category statistics
streak
activity
```

Success:

User behavior is reflected correctly after reload.

---

## PHASE 9 — API Lab

Build:

```text
API info
categories
languages
flags
formats
ping
request builder
JSON viewer
```

Success:

A developer can visibly inspect how JokeFM uses JokeAPI.

---

## PHASE 10 — Polish

Add:

```text
animations
sound effects
CRT toggles
micro-interactions
data export
share tools
PWA/offline enhancements
```

Only add these after the core is stable.

---

# 59. Definition of Done

A production-quality first release should satisfy:

### API

- JokeAPI requests are centralized
- query parameters are encoded
- batch requests are used for Radio Mode
- API errors are handled
- 429 is handled
- duplicate queue entries are avoided
- metadata is cached

### TTS

- voice list loads correctly
- selected voice persists
- speaking can be paused/resumed/stopped
- rate/pitch/volume work
- two-part jokes have a configurable pause
- missing TTS support does not break reading

### Library

- favorites persist
- history persists
- duplicate favorites are impossible
- history is bounded
- stats are consistent

### Games

- score state is isolated
- correct/incorrect answers work
- results persist where intended
- games do not corrupt Radio Mode

### UI

- Y2K visual language is consistent
- desktop and mobile layouts work
- keyboard navigation works
- focus states are visible
- reduced motion is supported
- color is not the sole source of meaning

### Architecture

- services do not contain UI rendering logic
- components do not directly call the API
- state updates have clear ownership
- storage is centralized
- speech is centralized
- no unnecessary framework/dependency is introduced

---

# 60. Recommended Implementation Order Inside the Codebase

Start with these files:

```text
src/services/jokeApi.js
src/services/jokeNormalizer.js
src/services/speechService.js
src/services/comedyTiming.js
src/services/storage.js
src/app/state.js
src/main.js
```

Then:

```text
src/components/JokeCard.js
src/components/NowPlaying.js
src/components/TransportControls.js
src/components/Y2KWindow.js
```

Then:

```text
src/modes/radio/
src/modes/discover/
src/modes/games/
src/modes/library/
```

Do not begin by building every screen.

Build one complete vertical slice:

```text
API → state → joke card → TTS → controls → persistence
```

Then expand.

---

# 61. First Vertical Slice

The first usable prototype should contain only:

```text
HOME
  ↓
GET RANDOM JOKE
  ↓
JOKE CARD
  ↓
SPEAK
  ↓
NEXT
  ↓
SAVE
```

The initial design can already use the final Y2K style.

Once that is stable:

```text
single joke
→ two-part joke
→ queue
→ Radio Mode
```

---

# 62. Recommended Initial Dependencies

Keep dependencies minimal.

Likely:

```json
{
  "devDependencies": {
    "vite": "latest"
  }
}
```

Do not automatically add:

```text
React
Vue
Tailwind
Redux
database libraries
audio libraries
chart libraries
```

unless the implementation genuinely benefits from them.

Vanilla JavaScript is sufficient for the first release.

---

# 63. Browser API Constraints

The speech system is browser/OS dependent.

Important rules:

- voice availability differs by device
- voices may load asynchronously
- selected voice objects should not be persisted directly
- speech behavior may vary between browsers
- some advanced events may have limited browser support
- never assume the same voice names exist everywhere

Design for graceful fallback.

The application must continue to function as a text-based joke reader if speech synthesis is unavailable.

---

# 64. Product-Level State Machine

Use explicit states for Radio Mode:

```text
IDLE
  ↓
FETCHING_QUEUE
  ↓
READY
  ↓
INTRO
  ↓
SPEAKING_SETUP
  ↓
PUNCHLINE_PAUSE
  ↓
SPEAKING_DELIVERY
  ↓
JOKE_COMPLETE
  ↓
NEXT_JOKE
```

Alternative paths:

```text
SPEAKING_* → PAUSED
PAUSED → SPEAKING_*
ANY → STOPPED
FETCHING_QUEUE → ERROR
SPEAKING_* → SPEECH_ERROR
```

Keep these state transitions deterministic.

---

# 65. Recommended Internal Events

Use a small event bus or centralized event handler.

Examples:

```text
APP_READY
ROUTE_CHANGED

JOKE_REQUESTED
JOKES_RECEIVED
JOKE_FAILED

QUEUE_UPDATED
QUEUE_EMPTY
QUEUE_REFILLED

SPEECH_STARTED
SPEECH_PAUSED
SPEECH_RESUMED
SPEECH_ENDED
SPEECH_FAILED

JOKE_PLAYED
JOKE_COMPLETED

FAVORITE_ADDED
FAVORITE_REMOVED

GAME_STARTED
GAME_ANSWERED
GAME_COMPLETED

SETTINGS_CHANGED
```

Avoid dozens of bespoke event names without a naming system.

---

# 66. Recommended UI States for Now Playing

Now Playing should communicate:

```text
station
category
joke number / ID
joke type
current speech status
current part
favorite status
```

Example:

```text
PROGRAMMER HOUR
PROGRAMMING · TWO-PART

NOW PLAYING

Why do programmers wear glasses?

● SPEAKING SETUP

[Because they need to C#]

◀    ❚❚    ▶
```

Do not visually overwhelm users with API metadata in Radio Mode.

The API information belongs primarily in API Lab.

---

# 67. Y2K Easter Eggs

Optional details that improve personality:

```text
"MODEM CONNECTED"
"COMEDY PACKET RECEIVED"
"BUFFERING PUNCHLINE..."
"CD-ROM CONTENT LOADED"
"VOICE DRIVER READY"
"JOKEFM OS"
```

These should be occasional UI flavor, not required to understand the interface.

Do not make fake technical errors look like actual errors.

---

# 68. Retro Terminology Rules

Use nostalgic language sparingly.

Good:

```text
CHANNEL
STATION
QUEUE
SIGNAL
PLAYER
SYSTEM
PACKET
LIBRARY
```

Avoid overusing:

```text
CYBER
HACKER
1337
ULTRA NEON
```

The target is Y2K software, not generic cyberpunk.

---

# 69. Recommended Visual Hierarchy

1. Current joke
2. Playback state
3. Primary action
4. Category/station context
5. Secondary controls
6. Metadata
7. Decorative Y2K elements

Never allow decorative chrome to overpower the joke.

---

# 70. Accessibility vs. Nostalgia Rule

Whenever these conflict:

```text
Readability > Authenticity
Accessibility > Visual effect
Usability > Ornament
```

Y2K aesthetics should be layered onto a functional modern interface.

---

# 71. README Expectations

The final repository README should explain:

```text
What JokeFM is
Why it exists
Features
Tech stack
JokeAPI integration
TTS implementation
Modes
Screenshots
How to run
Architecture
API limitations
Browser compatibility
```

Include an API attribution/reference section.

---

# 72. Deployment

The application should be deployable as a static site.

Suitable hosting classes:

```text
GitHub Pages
Netlify
Vercel
Cloudflare Pages
```

The application must not require a private server for the baseline release.

Do not add a backend simply because the project is intended for deployment.

---

# 73. Portfolio Presentation

When presenting the project, emphasize:

```text
REST API integration
Queue-based media experience
Web Speech API
Client-side persistence
Multiple application modes
Responsive Y2K UI
Accessible interaction
Error/rate-limit handling
```

The project's interesting engineering story is:

**“I built a complete product around a public API instead of building another API demo.”**

---

# 74. Coding Rules for Future Implementation

When extending this project:

1. Preserve the existing architecture.
2. Reuse services rather than duplicating logic.
3. Keep API access centralized.
4. Keep TTS access centralized.
5. Normalize external API data before rendering.
6. Do not use raw `innerHTML` for external joke content.
7. Keep settings persistent but versioned.
8. Keep game state separate from radio state.
9. Prefer graceful fallbacks.
10. Do not introduce a dependency for a small problem.
11. Maintain mobile responsiveness.
12. Maintain keyboard accessibility.
13. Respect reduced-motion settings.
14. Do not hard-code API dataset counts as permanent truths.
15. Avoid unnecessary network requests.
16. Use batch API requests for queue-oriented features.
17. Preserve Y2K styling without sacrificing readability.
18. Keep all screens consistent with the shared design system.
19. Add loading, empty, success, and error states.
20. Favor small, composable modules.

---

# 75. API Reference Notes

The implementation should treat the official JokeAPI documentation as the source of truth for API behavior.

Key documented behaviors used by JokeFM:

- The main endpoint is `GET /joke/[Category/-ies]`.
- JokeAPI does not require an API token for normal use.
- The documented public client limit is 120 requests per minute.
- The joke endpoint supports category selection, content blacklist flags, language, ID range, text search, joke type, response format, and amount.
- Multiple jokes can be requested using `amount`, with a documented maximum of 10.
- Two-part jokes use `setup` and `delivery`; single jokes use `joke`.
- `/info`, `/categories`, `/languages`, `/flags`, `/formats`, `/ping`, and `/langcode/[Language]` are available for metadata/system features.
- The available ID range should be derived from metadata when precision matters.
- The API may return errors that need to be checked in the response payload.

Source references:

- https://v2.jokeapi.dev/jokeapi/
- https://v2.jokeapi.dev/info
- https://v2.jokeapi.dev/categories
- https://v2.jokeapi.dev/languages
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance

Always re-check the live documentation when implementing against the API because dataset size, supported languages, metadata, and other operational details may change.

---

# 76. First Build Target

The first completed feature set should be:

```text
JokeFM shell
+
Y2K theme
+
Random Joke
+
Two-Part Joke
+
Speak
+
Pause / Resume
+
Next / Replay
+
Voice selector
+
Favorites
+
localStorage
```

Then build Radio Mode immediately after.

Do not attempt all fourteen modes in the first coding phase.

The correct progression is:

```text
FOUNDATION
    ↓
SINGLE JOKE PLAYER
    ↓
TTS
    ↓
PERSISTENCE
    ↓
RADIO
    ↓
DISCOVER
    ↓
LIBRARY
    ↓
GAMES
    ↓
STATS
    ↓
API LAB
    ↓
POLISH
```

---

# 77. Final Product Vision

When finished, JokeFM should feel like a fictional early-2000s media application that somehow exists inside a modern browser:

```text
                 J O K E F M
          ┌───────────────────────┐
          │   YOUR COMEDY SIGNAL  │
          │                       │
          │    🎙 NOW PLAYING     │
          │                       │
          │ "Why do programmers   │
          │  wear glasses?"       │
          │                       │
          │   ...                 │
          │                       │
          │ "Because they need    │
          │  to C#."              │
          │                       │
          │  ◀  ❚❚  ▶   ♡         │
          └───────────────────────┘

 HOME      RADIO      DISCOVER      GAMES
 LIBRARY   STATS      API LAB       SETTINGS
```

The application is not fundamentally a joke generator.

It is:

**a personal comedy media platform powered by JokeAPI, with browser speech synthesis as its narrator and a Y2K software interface as its identity.**

That distinction should guide every implementation decision.

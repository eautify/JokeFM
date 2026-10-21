# JokeFM

JokeFM is a browser-based comedy radio and joke discovery app powered by [JokeAPI v2](https://v2.jokeapi.dev/jokeapi/). It pairs a queue-based player with browser speech synthesis, local favorites, games, and an API playground in a Y2K-inspired interface.

## Deployment

JokeFM is deployed on Vercel: [**joke-fm.vercel.app**](https://joke-fm.vercel.app/).

## Features

- **Home and single-joke player:** fetch, read, speak, replay, and favorite jokes.
- **Radio:** choose from seven station presets, load a 10-joke queue, auto-advance, shuffle upcoming jokes, and control playback.
- **Discover:** search by phrase, category, joke type, and the languages currently offered by JokeAPI.
- **Games:** Punchline Guess, Finish the Joke, Category Challenge, Speed Joke, and Delivery Challenge.
- **Library:** favorites, play history, and a saved, renameable My Station playlist.
- **Statistics:** locally calculated playback, category, and game activity.
- **API Lab:** send category/type/amount requests and inspect cached JokeAPI metadata endpoints.
- **Settings:** content filters, safe mode, speech voice/rate/pitch/volume, punchline timing, and data import/export.
- Keyboard controls: Space (play/pause), Left/Right (previous/next), R (replay), F (favorite), and M (mute).
- **Installable web app:** includes a web app manifest and app icons for supported browsers.

The navigation uses hash routes, so individual screens can be linked directly (for example, `#radio`, `#discover`, or `#settings`).

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Other available commands are:

```sh
npm run build    # Type-check and create a production build in dist/
npm run preview  # Preview the production build locally
npm run lint     # Run Oxlint
```

The app is a static Vite site, so the `dist/` output can be deployed to any static host. When hosting it under a subpath, configure the Vite `base` option and ensure static assets are served from that same path.

## Stack and architecture

- React, TypeScript, and Vite
- `src/services/jokeApi.ts`: JokeAPI request construction, response validation, normalization, and metadata requests
- `src/services/storage.ts`: safe local storage, bounded export/import validation, and download
- `src/App.tsx`: route selection, shared player/queue state, screen flows, settings, and games
- `src/App.css` and `src/index.css`: responsive Y2K visual system and accessible focus/reduced-motion styles

The app has no account, API key, backend, database, or paid service. Favorites and playlists retain up to 500 jokes each; play history retains up to 250 entries; and recorded game rounds retain up to 200 entries. Those items, settings, and the API metadata cache stay in `localStorage` for the current browser. Exporting data produces a JSON backup, which can later be imported by JokeFM.

JokeAPI requests require an internet connection. Speech quality and available voices depend on the browser and operating system; jokes remain readable when speech synthesis is unavailable.

## JokeAPI attribution and limits

Joke content and API metadata are provided by [JokeAPI](https://v2.jokeapi.dev/jokeapi/). JokeFM batches radio requests, caps a single request at 10 jokes, caches metadata for 24 hours, and presents a retry message for API errors and rate limits. Its dataset, language availability, rate limits, and metadata can change, so the API response remains the source of truth.

## Browser notes

Use a modern browser with `fetch`, `localStorage`, and Web Speech API support for the full experience. Without speech synthesis, joke reading, search, library, games, and API tools continue to work.


# JokeFM

JokeFM is a browser based comedy radio and joke discovery app powered by [JokeAPI v2](https://v2.jokeapi.dev/jokeapi/). It pairs a queue based player with browser speech synthesis, local favorites, games, and an API playground in a Y2K inspired interface.

## Features

- **Home and single joke player:** fetch, read, speak, replay, and favorite jokes.
- **Radio:** choose from JokeAPI categories, load a batch queue, auto advance, shuffle, and control playback.
- **Discover:** search by phrase, category, joke type, and available language.
- **Games:** Punchline Guess, Finish the Joke, Category Challenge, Speed Joke, and Delivery Challenge.
- **Library:** favorites, bounded play history, and a saved My Station playlist.
- **Statistics:** locally calculated playback, category, and game activity.
- **API Lab:** build requests and inspect cached JokeAPI metadata.
- **Settings:** content filters, safe mode, speech voice/rate/pitch/volume, punchline timing, and data import/export.
- Keyboard controls: Space (play/pause), Left/Right (previous/next), R (replay), F (favorite), and M (mute).

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build` and serve it with any static hosting provider.

## Stack and architecture

- React, TypeScript, and Vite
- `src/services/jokeApi.ts`: JokeAPI request construction, response validation, normalization, and metadata requests
- `src/services/storage.ts`: safe local storage, bounded export/import validation, and download
- `src/App.tsx`: route selection, shared player/queue state, screen flows, settings, and games
- `src/App.css` and `src/index.css`: responsive Y2K visual system and accessible focus/reduced-motion styles

The app has no account, API key, backend, database, or paid service. Favorites, history, settings, playlists, and metadata cache stay in local storage on the current browser. JokeAPI requests require an internet connection. Speech quality and available voices depend on the browser and operating system; jokes remain readable when speech synthesis is unavailable.

## JokeAPI attribution and limits

Joke content and API metadata are provided by [JokeAPI](https://v2.jokeapi.dev/jokeapi/). JokeFM batches radio requests, caps requests at 10 jokes, caches metadata for 24 hours, and presents a retry message for API errors and rate limits. The API documents a limit of 120 requests per minute. Its dataset, language availability, and metadata can change, so the API response remains the source of truth.

## Browser notes

Use a modern browser with `fetch`, `localStorage`, and Web Speech API support for the full experience. Without speech synthesis, joke reading, search, library, games, and API tools continue to work.

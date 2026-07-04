# 🎬 Jockisch Family Theater OS

A custom-built digital signage system for the Jockisch Family Theater.

Designed to display movie nights, game nights, and theater information on a dedicated portrait display.

Current Version: **0.6**

---

# Project Structure

```
Jockisch-Theater/
│
├── index.html
│
├── css/
│   ├── style.css
│   ├── themes.css
│   └── animations.css
│
├── js/
│   ├── config.js
│   │
│   ├── movie-library.js
│   ├── game-library.js
│   ├── platforms.js
│   │
│   ├── movie-template.js
│   ├── game-template.js
│   ├── idle-template.js
│   │
│   ├── media.js
│   └── app.js
│
├── assets/
│   ├── logos/
│   ├── platforms/
│   ├── posters/
│   └── games/
│       ├── ps5/
│       ├── xbox/
│       └── switch/
│
└── README.md
```

---

# Theater Modes

The theater now supports three display modes.

## 🎬 Movie

Displays:

- Movie Poster
- Rating
- Runtime
- Release Year
- Edition

---

## 🎮 Game

Displays:

- Full-screen artwork
- Game title
- Platform logo
- Genre
- Players
- Release year

Platform themes are automatically applied.

- PlayStation = Blue
- Xbox = Green
- Nintendo = Red

---

## 🏛 Idle

Displays a welcome screen when no event is selected.

---

# Selecting Tonight's Media

Open:

```
js/config.js
```

Choose the mode:

```js
mode: "movie"
```

or

```js
mode: "game"
```

or

```js
mode: "idle"
```

Then choose the media ID.

Example:

```js
mediaId: "iron-man"
```

or

```js
mediaId: "snowrunner"
```

Save.

Refresh the browser.

Done.

---

# Adding a New Movie

## 1

Save the poster:

```
assets/posters/CollectionName/
```

Example:

```
assets/posters/Marvel/
```

---

## 2

Open:

```
js/movie-library.js
```

Copy:

```js
{
  id: "",
  collection: "",
  franchise: "",
  title: "",
  edition: "",
  year: "",
  rating: "",
  runtime: "",
  poster: ""
},
```

Fill in the information.

Done.

---

# Adding a New Game

## 1

Save the artwork:

PlayStation

```
assets/games/ps5/
```

Xbox

```
assets/games/xbox/
```

Switch

```
assets/games/switch/
```

---

## 2

Open:

```
js/game-library.js
```

Copy:

```js
{
  id: "",
  platform: "",

  title: "",
  genre: "",
  players: "",
  release: "",

  background: ""
},
```

Example:

```js
{
  id: "snowrunner",
  platform: "ps5",

  title: "SnowRunner",
  genre: "Off-Road, Simulation, Open World",
  players: "1-4 Players Online Co-op",
  release: "2020",

  background: "assets/games/ps5/snowrunner.jpg"
},
```

Done.

---

# Platform Definitions

Platform information is stored separately.

```
js/platforms.js
```

Each platform controls:

- Display Name
- Theme
- Logo
- Logo Scale

Games only reference:

```js
platform: "ps5"
```

or

```js
platform: "xbox"
```

---

# Naming Standards

## IDs

Always:

- lowercase
- hyphen-separated

Example

```
iron-man

snowrunner

the-last-of-us-part-2-remastered
```

Never use:

- spaces
- underscores
- capital letters

---

## Artwork

Artwork filename should always match the ID.

Example

```
snowrunner.jpg
```

belongs to

```
snowrunner
```

---

# CSS Responsibilities

## style.css

Layout

Sizing

Movie styling

Game styling

Idle styling

---

## themes.css

Application colors

Movie theme

Platform themes

Future seasonal themes

---

## animations.css

Logo animation

Glow effects

Keyframes

---

# JavaScript Responsibilities

## config.js

Application settings

Media selection

Scene timings

---

## movie-library.js

Movie database.

---

## game-library.js

Game database.

---

## platforms.js

Platform information.

Logos

Themes

Scaling

---

## movie-template.js

Movie scene.

---

## game-template.js

Game scene.

---

## idle-template.js

Idle scene.

---

## media.js

Loads the correct Scene 2 template.

---

## app.js

Controls the theater loop.

---

# Current Features

✔ Animated logo

✔ Movie Mode

✔ Game Mode

✔ Idle Mode

✔ Theme system

✔ Platform branding

✔ Movie library

✔ Game library

✔ Shared platform database

✔ Responsive game titles

✔ Continuous theater loop

---

# Future Ideas

□ Local media selector

□ Collection browser

□ Coming Soon screen

□ Movie countdown

□ Random movie mode

□ Seasonal themes

□ Music mode

□ Dynamic backgrounds

□ Theater statistics

---

# Version History

## Version 0.6

✔ Multi-mode architecture

✔ Movie template

✔ Game template

✔ Idle template

✔ Theme engine

✔ Platform database

✔ Platform logos

✔ Responsive title sizing

✔ Modular Scene 2

---

Built with ❤️ for the Jockisch Family Theater.
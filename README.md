# 🎬 Jockisch Family Theater OS

A custom-built digital theater display designed for the Jockisch Family Theater.

Current Version: **0.5**

---

# Folder Structure

```
Jockisch-Theater/
│
├── index.html
│
├── css/
│   ├── style.css
│   └── animations.css
│
├── js/
│   ├── app.js
│   ├── config.js
│   ├── library.js
│   └── movie.js
│
├── assets/
│   ├── logos/
│   ├── posters/
│   └── backgrounds/
│
└── README.md
```

---

# How the Theater Works

The theater runs two scenes continuously.

### Scene 1
Jockisch Family Theater animated logo.

↓

### Scene 2
Now Playing screen with movie poster and information.

↓

Returns to Scene 1.

The loop repeats until closed.

---

# Playing a Movie

Open:

```
js/config.js
```

Locate:

```js
activeMovieId: "",
```

Replace the blank with the movie ID.

Example:

```js
activeMovieId: "iron-man",
```

Save.

Refresh the browser.

Done.

---

# Adding a New Movie

## Step 1

Download the poster.

Save it into the correct folder.

Example:

```
assets/posters/Marvel/
```

---

## Step 2

Open

```
js/library.js
```

Copy the template below.

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

Paste it at the bottom of the movie list.

---

## Step 3

Fill in the movie information.

Example:

```js
{
  id: "thor-ragnarok",
  collection: "Marvel",
  franchise: "Marvel Cinematic Universe",
  title: "Thor: Ragnarok",
  edition: "4K Ultra HD",
  year: "2017",
  rating: "PG-13",
  runtime: "2h 10m",
  poster: "assets/posters/Marvel/thor-ragnarok.jpg"
},
```

Save.

Movie complete.

---

# Naming Rules

## Movie IDs

Always lowercase.

Always use hyphens.

Example

```
iron-man

thor-ragnarok

back-to-the-future-part-2
```

Never use spaces.

Never use underscores.

---

## Poster Names

Poster filename should ALWAYS match the Movie ID.

Example

Movie ID

```
thor-ragnarok
```

Poster

```
thor-ragnarok.jpg
```

---

## Folder Names

One folder per collection.

Example

```
Marvel

HarryPotter

LotR

BackToTheFuture

SuperMario
```

---

# Editing Timings

Open

```
js/config.js
```

```
logoBuild
```

Controls the logo animation length.

```
logoHold
```

How long the completed logo remains on screen.

```
posterHold
```

How long the movie poster remains visible.

Fade timings can also be adjusted in this file.

---

# File Responsibilities

## index.html

Page structure only.

No movie data belongs here.

---

## style.css

Layout

Sizing

Colors

Poster styling

---

## animations.css

Logo animations

Poster glow animations

Keyframes

---

## config.js

Settings

Movie selection

Scene timings

---

## library.js

Movie database.

Every movie belongs here.

---

## movie.js

Loads movie information from library.js.

---

## app.js

Controls scene switching and theater loop.

---

# Current Standards

Every movie should contain:

```js
id
collection
franchise
title
edition
year
rating
runtime
poster
```

---

# Future Ideas

- Library browser
- Random movie mode
- Coming Soon screen
- Countdown timer
- Movie trivia
- Background music
- Theater statistics
- Seasonal themes

---

# Version History

## Version 0.5

✔ Movie Library

✔ Config system

✔ Animated logo

✔ Poster scene

✔ Scene manager

✔ Continuous loop

✔ Dynamic movie loading

---

Built for the Jockisch Family Theater.
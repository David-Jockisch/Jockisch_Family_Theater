const doomsdayEssentials = {
  id: "doomsday-essentials",

  title: "Doomsday Essentials",

  description:
    "The movie-only Marvel watch order leading into Avengers: Doomsday.",

  poster: "/assets/playlists/doomsday-prep-essentials.jpg",

  event: {
    title: "Avengers: Doomsday",
    date: "2026-12-17"
  },

  items: [
    // =====================================
    // Legacy: WWII & The 1940s
    // =====================================
    { id: "01-captain-america-first-avenger", section: "Legacy: WWII & The 1940s", type: "movie", ref: "captain-america-the-first-avenger", priority: "Essential", note: "STOP before credits." },

    // =====================================
    // Legacy: 1960s
    // =====================================
    { id: "02-x-men-first-class", section: "Legacy: 1960s", type: "movie", ref: "x-men-first-class", priority: "Essential" },

    // =====================================
    // Legacy: 1990s
    // =====================================
    { id: "03-captain-marvel", section: "Legacy: 1990s", type: "movie", ref: "captain-marvel", priority: "Recommended", note: "STOP before the end-credits scene. Its post-credit scene belongs after Infinity War." },

    // =====================================
    // Legacy: 2000s
    // =====================================
    { id: "04-x-men", section: "Legacy: 2000s", type: "movie", ref: "x-men", priority: "Essential" },
    { id: "05-x2", section: "Legacy: 2000s", type: "movie", ref: "x2-x-men-united", priority: "Essential" },
    { id: "06-x-men-last-stand", section: "Legacy: 2000s", type: "movie", ref: "x-men-the-last-stand", priority: "Essential" },
    { id: "07-spider-man", section: "Legacy: 2000s", type: "movie", ref: "spider-man", priority: "Recommended", note: "Watch before No Way Home." },
    { id: "08-spider-man-2", section: "Legacy: 2000s", type: "movie", ref: "spider-man-2", priority: "Recommended" },
    { id: "09-spider-man-3", section: "Legacy: 2000s", type: "movie", ref: "spider-man-3", priority: "Recommended" },
    { id: "10-amazing-spider-man", section: "Legacy: 2000s", type: "movie", ref: "the-amazing-spider-man", priority: "Recommended", note: "Watch before No Way Home." },
    { id: "11-amazing-spider-man-2", section: "Legacy: 2000s", type: "movie", ref: "the-amazing-spider-man-2", priority: "Recommended" },

    // =====================================
    // Phase 1 — The Avengers Initiative (2008–2012)
    // =====================================
    { id: "12-iron-man", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "iron-man", priority: "Recommended", note: "Watch all credits." },
    { id: "13-incredible-hulk", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "the-incredible-hulk", priority: "Recommended", note: "Watch all credits." },
    { id: "14-iron-man-2", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "iron-man-2", priority: "Recommended", note: "STOP before credits." },
    { id: "16-thor", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "thor", priority: "Essential", note: "STOP before credits." },
    { id: "19-avengers", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "the-avengers", priority: "Essential", note: "Watch all credits." },

    // =====================================
    // Phase 2 — HYDRA & The Infinity Stones (2012–2015)
    // =====================================
    { id: "20-winter-soldier", section: "Phase 2 — HYDRA & The Infinity Stones (2012–2015)", type: "movie", ref: "captain-america-the-winter-soldier", priority: "Essential", note: "Watch credits." },
    { id: "21-guardians", section: "Phase 2 — HYDRA & The Infinity Stones (2012–2015)", type: "movie", ref: "guardians-of-the-galaxy", priority: "Recommended", note: "Watch all five credit scenes." },

    // =====================================
    // Phase 3A — Street Level Heroes (2015–2016)
    // =====================================
    { id: "23-age-of-ultron", section: "Phase 3A — Street Level Heroes (2015–2016)", type: "movie", ref: "avengers-age-of-ultron", priority: "Essential", note: "Watch the mid-credit scene featuring Thanos." },
    { id: "24-ant-man", section: "Phase 3A — Street Level Heroes (2015–2016)", type: "movie", ref: "ant-man", priority: "Recommended", note: "Watch credits." },

    // =====================================
    // Phase 3B — Civil War & Fallout (2016–2018)
    // =====================================
    { id: "26-civil-war", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "captain-america-civil-war", priority: "Essential", note: "Watch credits." },
    { id: "27-black-widow", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "black-widow", priority: "Recommended", note: "STOP before the end-credits scene. Its post-credit scene belongs immediately before Hawkeye." },
    { id: "28-black-panther", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "black-panther", priority: "Essential", note: "Watch credits." },
    { id: "29-homecoming", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "spider-man-homecoming", priority: "Recommended", note: "Watch credits." },
    { id: "30-doctor-strange", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "doctor-strange", priority: "Essential", note: "Watch credits." },
    { id: "31-days-of-future-past", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "x-men-days-of-future-past", priority: "Essential" },
    { id: "33-deadpool", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "deadpool", priority: "Recommended", note: "Watch before Deadpool & Wolverine." },
    { id: "34-deadpool-2", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "deadpool-2", priority: "Recommended", note: "Watch before Deadpool & Wolverine." },

    // =====================================
    // Phase 3C — Ragnarok & The Infinity War (2018)
    // =====================================
    { id: "35-ragnarok", section: "Phase 3C — Ragnarok & The Infinity War (2018)", type: "movie", ref: "thor-ragnarok", priority: "Essential", note: "Watch credits." },
    { id: "36-ant-man-wasp", section: "Phase 3C — Ragnarok & The Infinity War (2018)", type: "movie", ref: "ant-man-and-the-wasp", priority: "Essential", note: "STOP before credits. The credits scene belongs immediately after Infinity War." },
    { id: "37-infinity-war", section: "Phase 3C — Ragnarok & The Infinity War (2018)", type: "movie", ref: "avengers-infinity-war", priority: "Essential", note: "Watch the main credits, then pause before the post-credit scene." },

    // =====================================
    // Legacy: Future (2029)
    // =====================================
    { id: "40-logan", section: "Legacy: Future (2029)", type: "movie", ref: "logan", priority: "Essential", note: "Watch before Deadpool & Wolverine." },

    // =====================================
    // Phase 4 — The Blip & New Beginnings (2023)
    // =====================================
    { id: "41-endgame", section: "Phase 4 — The Blip & New Beginnings (2023)", type: "movie", ref: "avengers-endgame", priority: "Essential", note: "Block out three hours." },
    { id: "47-far-from-home", section: "Phase 4 — The Blip & New Beginnings (2023)", type: "movie", ref: "spider-man-far-from-home", priority: "Recommended", note: "Watch credits." },

    // =====================================
    // Phase 4 — Multiverse Opens (2024–2025)
    // =====================================
    { id: "50-shang-chi", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "shang-chi-and-the-legend-of-the-ten-rings", priority: "Essential", note: "Watch credits." },
    { id: "51-no-way-home", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "spider-man-no-way-home", priority: "Essential", note: "Watch the Tobey Maguire and Andrew Garfield Spider-Man films first for the full payoff." },
    { id: "52-multiverse-of-madness", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "doctor-strange-in-the-multiverse-of-madness", priority: "Essential" },
    { id: "54-love-and-thunder", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "thor-love-and-thunder", priority: "Essential" },
    { id: "55-wakanda-forever", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "black-panther-wakanda-forever", priority: "Essential" },
    { id: "57-quantumania", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "ant-man-and-the-wasp-quantumania", priority: "Essential" },
    { id: "58-the-marvels", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "the-marvels", priority: "Essential" },

    // =====================================
    // Phase 5 — The Multiverse War (2025–2026)
    // =====================================
    { id: "61-deadpool-wolverine", section: "Phase 5 — The Multiverse War (2025–2026)", type: "movie", ref: "deadpool-and-wolverine", priority: "Essential", note: "Watch Logan first for the full impact." },
    { id: "63-brave-new-world", section: "Phase 5 — The Multiverse War (2025–2026)", type: "movie", ref: "captain-america-brave-new-world", priority: "Essential" },
    { id: "64-thunderbolts", section: "Phase 5 — The Multiverse War (2025–2026)", type: "movie", ref: "thunderbolts", priority: "Essential" },

    // =====================================
    // Phase 6 — Doomsday (2026)
    // =====================================
    { id: "66-spider-man-brand-new-day", section: "Phase 6 — Doomsday (2026)", type: "movie", ref: "spider-man-brand-new-day", priority: "Essential" },
    { id: "68-the-fantastic-4-first-steps", section: "Phase 6 — Doomsday (2026)", type: "movie", ref: "the-fantastic-4-first-steps", priority: "Essential" },
    { id: "69-avengers-doomsday", section: "Phase 6 — Doomsday (2026)", type: "movie", ref: "avengers-doomsday", priority: "Essential" }
  ]
};

export default doomsdayEssentials;

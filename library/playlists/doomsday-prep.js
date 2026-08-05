const doomsdayPrep = {
  id: "avengers-doomsday-prep",
  title: "Avengers: Doomsday Prep",
  description:
    "A complete 69-entry Marvel watch order based on the supplied Marvel Watchlist page, including films, television seasons, and specially placed credit scenes.",
  poster: "/assets/playlists/doomsday-prep.jpg",

  items: [
    // Legacy: WWII & The 1940s
    { id: "01-captain-america-first-avenger", section: "Legacy: WWII & The 1940s", type: "movie", ref: "captain-america-the-first-avenger", priority: "Essential", note: "STOP before credits." },

    // Legacy: 1960s
    { id: "02-x-men-first-class", section: "Legacy: 1960s", type: "movie", ref: "x-men-first-class", priority: "Essential" },

    // Legacy: 1990s
    { id: "03-captain-marvel", section: "Legacy: 1990s", type: "movie", ref: "captain-marvel", priority: "Recommended", note: "STOP before the end-credits scene. Its post-credit scene belongs after Infinity War." },

    // Legacy: 2000s
    { id: "04-x-men", section: "Legacy: 2000s", type: "movie", ref: "x-men", priority: "Essential" },
    { id: "05-x2", section: "Legacy: 2000s", type: "movie", ref: "x2-x-men-united", priority: "Essential" },
    { id: "06-x-men-last-stand", section: "Legacy: 2000s", type: "movie", ref: "x-men-the-last-stand", priority: "Essential" },
    { id: "07-spider-man", section: "Legacy: 2000s", type: "movie", ref: "spider-man", priority: "Recommended", note: "Watch before No Way Home." },
    { id: "08-spider-man-2", section: "Legacy: 2000s", type: "movie", ref: "spider-man-2", priority: "Recommended" },
    { id: "09-spider-man-3", section: "Legacy: 2000s", type: "movie", ref: "spider-man-3", priority: "Recommended" },
    { id: "10-amazing-spider-man", section: "Legacy: 2000s", type: "movie", ref: "the-amazing-spider-man", priority: "Recommended", note: "Watch before No Way Home." },
    { id: "11-amazing-spider-man-2", section: "Legacy: 2000s", type: "movie", ref: "the-amazing-spider-man-2", priority: "Recommended" },

    // Phase 1
    { id: "12-iron-man", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "iron-man", priority: "Recommended", note: "Watch all credits." },
    { id: "13-incredible-hulk", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "the-incredible-hulk", priority: "Recommended", note: "Watch all credits." },
    { id: "14-iron-man-2", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "iron-man-2", priority: "Recommended", note: "STOP before credits." },
    { id: "15-iron-man-2-post-credit", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "special", ref: "iron-man-2", title: "Iron Man 2 (Post-Credit Scene)", priority: "Recommended" },
    { id: "16-thor", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "thor", priority: "Essential", note: "STOP before credits." },
    { id: "17-captain-america-credits", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "special", ref: "captain-america-the-first-avenger", title: "Captain America: The First Avenger (Credits)", priority: "Recommended" },
    { id: "18-thor-post-credit", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "special", ref: "thor", title: "Thor (Post-Credit Scene)", priority: "Recommended" },
    { id: "19-avengers", section: "Phase 1 — The Avengers Initiative (2008–2012)", type: "movie", ref: "the-avengers", priority: "Essential", note: "Watch all credits." },

    // Phase 2
    { id: "20-winter-soldier", section: "Phase 2 — HYDRA & The Infinity Stones (2012–2015)", type: "movie", ref: "captain-america-the-winter-soldier", priority: "Essential", note: "Watch credits." },
    { id: "21-guardians", section: "Phase 2 — HYDRA & The Infinity Stones (2012–2015)", type: "movie", ref: "guardians-of-the-galaxy", priority: "Recommended", note: "Watch all five credit scenes." },

    // Phase 3A
    { id: "22-daredevil-s1", section: "Phase 3A — Street Level Heroes (2015–2016)", type: "season", ref: "daredevil-series", season: 1, episodeCount: 13, priority: "Recommended" },
    { id: "23-age-of-ultron", section: "Phase 3A — Street Level Heroes (2015–2016)", type: "movie", ref: "avengers-age-of-ultron", priority: "Essential", note: "Watch the mid-credit scene featuring Thanos." },
    { id: "24-ant-man", section: "Phase 3A — Street Level Heroes (2015–2016)", type: "movie", ref: "ant-man", priority: "Recommended", note: "Watch credits." },
    { id: "25-daredevil-s2", section: "Phase 3A — Street Level Heroes (2015–2016)", type: "season", ref: "daredevil-series", season: 2, episodeCount: 13, priority: "Recommended" },

    // Phase 3B
    { id: "26-civil-war", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "captain-america-civil-war", priority: "Essential", note: "Watch credits." },
    { id: "27-black-widow", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "black-widow", priority: "Recommended", note: "STOP before the end-credits scene. Its post-credit scene belongs immediately before Hawkeye." },
    { id: "28-black-panther", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "black-panther", priority: "Essential", note: "Watch credits." },
    { id: "29-homecoming", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "spider-man-homecoming", priority: "Recommended", note: "Watch credits." },
    { id: "30-doctor-strange", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "doctor-strange", priority: "Essential", note: "Watch credits." },
    { id: "31-days-of-future-past", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "x-men-days-of-future-past", priority: "Essential" },
    { id: "32-daredevil-s3", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "season", ref: "daredevil-series", season: 3, episodeCount: 13, priority: "Recommended" },
    { id: "33-deadpool", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "deadpool", priority: "Recommended", note: "Watch before Deadpool & Wolverine." },
    { id: "34-deadpool-2", section: "Phase 3B — Civil War & Fallout (2016–2018)", type: "movie", ref: "deadpool-2", priority: "Recommended", note: "Watch before Deadpool & Wolverine." },

    // Phase 3C
    { id: "35-ragnarok", section: "Phase 3C — Ragnarok & The Infinity War (2018)", type: "movie", ref: "thor-ragnarok", priority: "Essential", note: "Watch credits." },
    { id: "36-ant-man-wasp", section: "Phase 3C — Ragnarok & The Infinity War (2018)", type: "movie", ref: "ant-man-and-the-wasp", priority: "Essential", note: "STOP before credits. The credits scene belongs immediately after Infinity War." },
    { id: "37-infinity-war", section: "Phase 3C — Ragnarok & The Infinity War (2018)", type: "movie", ref: "avengers-infinity-war", priority: "Essential", note: "Watch the main credits, then pause before the post-credit scene." },
    { id: "38-ant-man-wasp-credits", section: "Phase 3C — Ragnarok & The Infinity War (2018)", type: "special", ref: "ant-man-and-the-wasp", title: "Ant-Man & The Wasp (All Credits)", priority: "Essential", note: "Watch now, immediately after Infinity War. It depicts the Snap happening in real time." },
    { id: "39-captain-marvel-post-credit", section: "Phase 3C — Ragnarok & The Infinity War (2018)", type: "special", ref: "captain-marvel", title: "Captain Marvel (Post-Credits Scene)", priority: "Recommended", note: "Watch now. It directly connects to the opening of Endgame." },

    // Legacy future
    { id: "40-logan", section: "Legacy: Future (2029)", type: "movie", ref: "logan", priority: "Essential", note: "Watch before Deadpool & Wolverine." },

    // Phase 4 — Blip
    { id: "41-endgame", section: "Phase 4 — The Blip & New Beginnings (2023)", type: "movie", ref: "avengers-endgame", priority: "Essential", note: "Block out three hours." },
    { id: "42-wandavision-s1", section: "Phase 4 — The Blip & New Beginnings (2023)", type: "season", ref: "wandavision", season: 1, episodeCount: 9, priority: "Essential", note: "STOP before Episode 9's mid-credit scene. It is listed separately next." },
    { id: "43-wandavision-mid-credit", section: "Phase 4 — The Blip & New Beginnings (2023)", type: "special", ref: "wandavision", title: "WandaVision (Episode 9 Mid-Credit Scene)", priority: "Essential", note: "Watch immediately after WandaVision Episode 9." },
    { id: "44-falcon-winter-soldier", section: "Phase 4 — The Blip & New Beginnings (2023)", type: "season", ref: "the-falcon-and-the-winter-soldier", season: 1, episodeCount: 6, priority: "Recommended" },
    { id: "45-loki-s1", section: "Phase 4 — The Blip & New Beginnings (2023)", type: "season", ref: "loki", season: 1, episodeCount: 6, priority: "Essential" },
    { id: "46-what-if-s1", section: "Phase 4 — The Blip & New Beginnings (2023)", type: "season", ref: "what-if", season: 1, episodeCount: 9, priority: "Essential" },
    { id: "47-far-from-home", section: "Phase 4 — The Blip & New Beginnings (2023)", type: "movie", ref: "spider-man-far-from-home", priority: "Recommended", note: "Watch credits." },

    // Phase 4 — Multiverse
    { id: "48-black-widow-post-credit", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "special", ref: "black-widow", title: "Black Widow (Post-Credit Scene)", priority: "Recommended", note: "Watch now. It directly sets up Hawkeye." },
    { id: "49-hawkeye-s1", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "season", ref: "hawkeye", season: 1, episodeCount: 6, priority: "Recommended", note: "Watch before Wakanda Forever." },
    { id: "50-shang-chi", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "shang-chi-and-the-legend-of-the-ten-rings", priority: "Essential", note: "Watch credits." },
    { id: "51-no-way-home", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "spider-man-no-way-home", priority: "Essential", note: "Watch the Tobey Maguire and Andrew Garfield Spider-Man films first for the full payoff." },
    { id: "52-multiverse-of-madness", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "doctor-strange-in-the-multiverse-of-madness", priority: "Essential" },
    { id: "53-ms-marvel-s1", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "season", ref: "ms-marvel", season: 1, episodeCount: 6, priority: "Essential" },
    { id: "54-love-and-thunder", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "thor-love-and-thunder", priority: "Essential" },
    { id: "55-wakanda-forever", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "black-panther-wakanda-forever", priority: "Essential" },
    { id: "56-ironheart-s1", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "season", ref: "ironheart", season: 1, episodeCount: 6, priority: "Essential" },
    { id: "57-quantumania", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "ant-man-and-the-wasp-quantumania", priority: "Essential" },
    { id: "58-the-marvels", section: "Phase 4 — Multiverse Opens (2024–2025)", type: "movie", ref: "the-marvels", priority: "Essential" },

    // Phase 5
    { id: "59-loki-s2", section: "Phase 5 — The Multiverse War (2025–2026)", type: "season", ref: "loki", season: 2, episodeCount: 6, priority: "Essential" },
    { id: "60-what-if-s3", section: "Phase 5 — The Multiverse War (2025–2026)", type: "season", ref: "what-if", season: 3, episodeCount: 9, priority: "Essential" },
    { id: "61-deadpool-wolverine", section: "Phase 5 — The Multiverse War (2025–2026)", type: "movie", ref: "deadpool-and-wolverine", priority: "Essential", note: "Watch Logan first for the full impact." },
    { id: "62-daredevil-born-again-s1", section: "Phase 5 — The Multiverse War (2025–2026)", type: "season", ref: "daredevil-born-again", season: 1, episodeCount: 9, priority: "Essential" },
    { id: "63-brave-new-world", section: "Phase 5 — The Multiverse War (2025–2026)", type: "movie", ref: "captain-america-brave-new-world", priority: "Essential" },
    { id: "64-thunderbolts", section: "Phase 5 — The Multiverse War (2025–2026)", type: "movie", ref: "thunderbolts", priority: "Essential" },

    // Phase 6
    { id: "65-daredevil-born-again-s2", section: "Phase 6 — Doomsday (2026)", type: "season", ref: "daredevil-born-again", season: 2, episodeCount: 8, priority: "Recommended", note: "Listed as premiering March 24, 2026 and concurrent with The Punisher: One Last Kill." },
    { id: "66-spider-man-brand-new-day", section: "Phase 6 — Doomsday (2026)", type: "movie", ref: "spider-man-brand-new-day", priority: "Essential" },
    { id: "67-visionquest-s1", section: "Phase 6 — Doomsday (2026)", type: "season", ref: "visionquest", season: 1, episodeCount: 8, priority: "Recommended", note: "Listed for mid-to-late 2026. Watch WandaVision and Agatha All Along first." },
    { id: "68-fantastic-four-first-steps", section: "Phase 6 — Doomsday (2026)", type: "movie", ref: "the-fantastic-four-first-steps", priority: "Essential" },
    { id: "69-avengers-doomsday", section: "Phase 6 — Doomsday (2026)", type: "movie", ref: "avengers-doomsday", priority: "Essential" }
  ]
};

export default doomsdayPrep;

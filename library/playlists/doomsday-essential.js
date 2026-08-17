const doomsdayEssentials = {
  id: "doomsday-essentials",

  title: "Marvel Confirmed Playlist",

  description:
    "Marvel's confirmed watchlist leading into Avengers: Doomsday.",

  poster: "/assets/playlists/doomsday-prep-essentials.jpg",

  event: {
    title: "Avengers: Doomsday",
    date: "2026-12-17"
  },

  items: [
    // =====================================
    // Legacy: X-Men
    // =====================================
    { id: "01-x-men", section: "Legacy: X-Men", type: "movie", ref: "x-men", priority: "Confirmed" },
    { id: "02-x2", section: "Legacy: X-Men", type: "movie", ref: "x2-x-men-united", priority: "Confirmed" },

    // =====================================
    // Infinity Saga
    // =====================================
    { id: "03-captain-america-first-avenger", section: "Infinity Saga", type: "movie", ref: "captain-america-the-first-avenger", priority: "Confirmed" },
    { id: "04-avengers", section: "Infinity Saga", type: "movie", ref: "the-avengers", priority: "Confirmed" },
    { id: "05-infinity-war", section: "Infinity Saga", type: "movie", ref: "avengers-infinity-war", priority: "Confirmed" },
    { id: "06-endgame", section: "Infinity Saga", type: "movie", ref: "avengers-endgame", priority: "Confirmed" },

    // =====================================
    // Multiverse Saga — Loki
    // =====================================
    { id: "07-loki-s1", section: "Multiverse Saga", type: "season", ref: "loki", season: 1, episodeCount: 6, priority: "Confirmed" },
    { id: "08-loki-s2", section: "Multiverse Saga", type: "season", ref: "loki", season: 2, episodeCount: 6, priority: "Confirmed" },

    // =====================================
    // Multiverse Saga — Movies
    // =====================================
    { id: "09-shang-chi", section: "Multiverse Saga", type: "movie", ref: "shang-chi-and-the-legend-of-the-ten-rings", priority: "Confirmed", note: "Watch credits." },
    { id: "10-no-way-home", section: "Multiverse Saga", type: "movie", ref: "spider-man-no-way-home", priority: "Confirmed" },
    { id: "11-wakanda-forever", section: "Multiverse Saga", type: "movie", ref: "black-panther-wakanda-forever", priority: "Confirmed" },
    { id: "12-brave-new-world", section: "Multiverse Saga", type: "movie", ref: "captain-america-brave-new-world", priority: "Confirmed" },
    { id: "13-deadpool-wolverine", section: "Multiverse Saga", type: "movie", ref: "deadpool-and-wolverine", priority: "Confirmed" },
    { id: "14-multiverse-of-madness", section: "Multiverse Saga", type: "movie", ref: "doctor-strange-in-the-multiverse-of-madness", priority: "Confirmed" },
    { id: "15-thunderbolts", section: "Multiverse Saga", type: "movie", ref: "thunderbolts", priority: "Confirmed" },

    // =====================================
    // Phase 6 — Doomsday
    // =====================================
    { id: "16-the-fantastic-4-first-steps", section: "Phase 6 — Doomsday", type: "movie", ref: "the-fantastic-4-first-steps", priority: "Confirmed" }
  ]
};

export default doomsdayEssentials;

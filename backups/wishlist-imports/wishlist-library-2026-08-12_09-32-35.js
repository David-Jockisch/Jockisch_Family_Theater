// ==================================================
// Jockisch Family Theater Wishlist
//
// Movie posters use the shared /assets/posters/movies/ library.
// Game covers use the shared /assets/posters/games/<platform>/ library.
// Artwork is reusable if a wishlist item is later added to the owned collection.
// ==================================================

const wishlistLibrary = [



    {
    id: "avengers-endgame",
    mediaType: "movie",
    title: "Avengers: Endgame",
    year: "2019",
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/marvel/avengers-endgame.jpg"
  },

  {
    id: "black-widow",
    mediaType: "movie",
    title: "Black Widow",
    year: "2021",
    desiredFormat: "Blu Ray",
    poster: "/assets/posters/movies/marvel/black-widow.jpg"
  },

  {
    id: "shang-chi-and-the-legend-of-the-ten-rings",
    mediaType: "movie",
    title: "Shang-Chi and the Legend of the Ten Rings",
    year: "2021",
    desiredFormat: "Blu Ray",
    poster: "/assets/posters/movies/marvel/shang-chi-and-the-legend-of-the-ten-rings.jpg"
  },

  {
    id: "doctor-strange-in-the-multiverse-of-madness",
    mediaType: "movie",
    title: "Doctor Strange in the Multiverse of Madness",
    year: "2022",
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/marvel/doctor-strange-in-the-multiverse-of-madness.jpg"
  },

  {
    id: "thor-love-and-thunder",
    mediaType: "movie",
    title: "Thor: Love and Thunder",
    year: "2022",
    desiredFormat: "Blu Ray",
    poster: "/assets/posters/movies/marvel/thor-love-and-thunder.jpg"
  },

  {
    id: "black-panther-wakanda-forever",
    mediaType: "movie",
    title: "Black Panther: Wakanda Forever",
    year: "2022",
    desiredFormat: "Blu Ray",
    poster: "/assets/posters/movies/marvel/black-panther-wakanda-forever.jpg"
  },

  {
    id: "ant-man-and-the-wasp-quantumania",
    mediaType: "movie",
    title: "Ant-Man and the Wasp: Quantumania",
    year: "2023",
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/marvel/ant-man-and-the-wasp-quantumania.jpg"
  },

  {
    id: "the-marvels",
    mediaType: "movie",
    title: "The Marvels",
    year: "2023",
    desiredFormat: "Blu Ray",
    poster: "/assets/posters/movies/marvel/the-marvels.jpg"
  },





  {
    id: "deadpool-and-wolverine",
    mediaType: "movie",
    title: "Deadpool & Wolverine",
    year: "2024",
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/marvel/deadpool-and-wolverine.jpg"
  },

  {
    id: "captain-america-brave-new-world",
    mediaType: "movie",
    title: "Captain America: Brave New World",
    year: "2025",
    desiredFormat: "Blu Ray",
    poster: "/assets/posters/movies/marvel/captain-america-brave-new-world.jpg"
  },

  {
    id: "thunderbolts",
    mediaType: "movie",
    title: "Thunderbolts*",
    year: "2025",
    desiredFormat: "Blu Ray",
    poster: "/assets/posters/movies/marvel/thunderbolts.jpg"
  },

  {
    id: "the-fantastic-4-first-steps",
    mediaType: "movie",
    title: "The Fantastic 4: First Steps",
    year: "2025",
    desiredFormat: "Blu Ray",
    poster: "/assets/posters/movies/marvel/the-fantastic-4-first-steps.jpg"
  },

  {
    id: "007-first-light",
    mediaType: "game",
    title: "007 First Light",
    year: "2026",
    platform: "ps5",
    poster: "/assets/posters/games/ps5/007-first-light.jpg"
  },

  {
    id: "gears-of-war-e-day",
    mediaType: "game",
    title: "Gears of War: E-Day",
    year: "2026",
    platform: "seriesx",
    poster: "/assets/posters/games/seriesx/gears-of-war-e-day.jpg"
  },

  {
    id: "the-matrix",
    mediaType: "movie",
    title: "The Matrix",
    year: "1999",
    desiredFormat: "4k Blu Ray",
    poster: "/assets/posters/movies/the-matrix/the-matrix.jpg"
  },

  {
    id: "assassins-creed-black-flag-resynced",
    mediaType: "game",
    title: "Assassin's Creed Black Flag Resynced",
    year: "2026",
    platform: "ps5",
    poster: "/assets/posters/games/ps5/assassins-creed-black-flag-resynced.jpg"
  },

  {
    id: "avatar-the-way-of-water",
    mediaType: "movie",
    title: "Avatar: The Way of Water",
    year: "2022",
    tmdbId: 76600,
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/avatar/avatar-the-way-of-water.jpg"
  },

  {
    id: "avatar-fire-and-ash",
    mediaType: "movie",
    title: "Avatar: Fire and Ash",
    year: "2025",
    tmdbId: 83533,
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/avatar/avatar-fire-and-ash.jpg"
  },

  {
    id: "the-patriot",
    mediaType: "movie",
    title: "The Patriot",
    year: "2000",
    tmdbId: 2024,
    desiredFormat: "Blu Ray",
    poster: "/assets/posters/movies/the-patriot.jpg"
  },

  {
    id: "jurassic-world",
    mediaType: "movie",
    title: "Jurassic World",
    year: "2015",
    tmdbId: 135397,
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/jurassic-park/jurassic-world.jpg"
  },

  {
    id: "jurassic-world-rebirth",
    mediaType: "movie",
    title: "Jurassic World Rebirth",
    year: "2025",
    tmdbId: 1234821,
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/jurassic-park/jurassic-world-rebirth.jpg"
  },

  {
    id: "jurassic-world-fallen-kingdom",
    mediaType: "movie",
    title: "Jurassic World: Fallen Kingdom",
    year: "2018",
    tmdbId: 351286,
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/jurassic-park/jurassic-world-fallen-kingdom.jpg"
  },

  {
    id: "jurassic-park",
    mediaType: "movie",
    title: "Jurassic Park",
    year: "1993",
    tmdbId: 329,
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/jurassic-park/jurassic-park.jpg"
  },

  {
    id: "jurassic-park-iii",
    mediaType: "movie",
    title: "Jurassic Park III",
    year: "2001",
    tmdbId: 331,
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/jurassic-park/jurassic-park-iii.jpg"
  },

  {
    id: "the-lost-world-jurassic-park",
    mediaType: "movie",
    title: "The Lost World: Jurassic Park",
    year: "1997",
    tmdbId: 330,
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/jurassic-park/the-lost-world-jurassic-park.jpg"
  },

  {
    id: "sonic-the-hedgehog",
    mediaType: "movie",
    title: "Sonic the Hedgehog",
    year: "2020",
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/sonic-the-hedgehog/sonic-the-hedgehog.jpg"
  },

  {
    id: "sonic-the-hedgehog-2",
    mediaType: "movie",
    title: "Sonic the Hedgehog 2",
    year: "2022",
    desiredFormat: "4K Blu Ray",
    poster: "/assets/posters/movies/sonic-the-hedgehog/sonic-the-hedgehog-2.jpg"
  }

];

export default wishlistLibrary;

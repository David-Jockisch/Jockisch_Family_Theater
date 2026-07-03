const movieLibrary = [
  {
    id: "iron-man",
    collection: "Marvel",
    title: "Iron Man",
    year: "2008",
    rating: "PG-13",
    runtime: "2h 6m",
    poster: "assets/posters/marvel/iron-man.jpg"
  },

  {
    id: "lotr-two-towers",
    collection: "Lord of the Rings",
    franchise: "The Lord of the Rings",
    title: "The Two Towers",
    edition: "Extended Edition",
    year: "2002",
    rating: "PG-13",
    runtime: "3h 55m",
    poster: "assets/posters/LotR/lotr-two-towers.jpg"
  },

  {
  id: "lotr-fellowship",
  collection: "Lord of the Rings",
  franchise: "The Lord of the Rings",
  title: "The Fellowship of the Ring",
  edition: "Extended Edition",
  year: "2001",
  rating: "PG-13",
  runtime: "3h 48m",
  poster: "assets/posters/LotR/lotr-fellowship.jpg"
},

{
  id: "lotr-return-king",
  collection: "Lord of the Rings",
  franchise: "The Lord of the Rings",
  title: "The Return of the King",
  edition: "Extended Edition",
  year: "2003",
  rating: "PG-13",
  runtime: "4h 23m",
  poster: "assets/posters/LotR/lotr-return-king.jpg"
},
{
  id: "harry-potter-sorcerers-stone",
  collection: "Harry Potter",
  franchise: "Harry Potter",
  title: "Harry Potter and the Sorcerer's Stone",
  edition: "4K Ultra HD",
  year: "2001",
  rating: "PG",
  runtime: "2h 32m",
  poster: "assets/posters/HarryPotter/harry-potter-sorcerers-stone.jpg"
},

{
  id: "harry-potter-chamber-secrets",
  collection: "Harry Potter",
  franchise: "Harry Potter",
  title: "Harry Potter and the Chamber of Secrets",
  edition: "4K Ultra HD",
  year: "2002",
  rating: "PG",
  runtime: "2h 41m",
  poster: "assets/posters/HarryPotter/harry-potter-chamber-secrets.jpg"
},

{
  id: "harry-potter-prisoner-azkaban",
  collection: "Harry Potter",
  franchise: "Harry Potter",
  title: "Harry Potter and the Prisoner of Azkaban",
  edition: "4K Ultra HD",
  year: "2004",
  rating: "PG",
  runtime: "2h 22m",
  poster: "assets/posters/HarryPotter/harry-potter-prisoner-azkaban.jpg"
},

{
  id: "harry-potter-goblet-fire",
  collection: "Harry Potter",
  franchise: "Harry Potter",
  title: "Harry Potter and the Goblet of Fire",
  edition: "4K Ultra HD",
  year: "2005",
  rating: "PG-13",
  runtime: "2h 37m",
  poster: "assets/posters/HarryPotter/harry-potter-goblet-fire.jpg"
},

{
  id: "harry-potter-order-phoenix",
  collection: "Harry Potter",
  franchise: "Harry Potter",
  title: "Harry Potter and the Order of the Phoenix",
  edition: "4K Ultra HD",
  year: "2007",
  rating: "PG-13",
  runtime: "2h 18m",
  poster: "assets/posters/HarryPotter/harry-potter-order-phoenix.jpg"
},

{
  id: "harry-potter-half-blood-prince",
  collection: "Harry Potter",
  franchise: "Harry Potter",
  title: "Harry Potter and the Half-Blood Prince",
  edition: "4K Ultra HD",
  year: "2009",
  rating: "PG",
  runtime: "2h 33m",
  poster: "assets/posters/HarryPotter/harry-potter-half-blood-prince.jpg"
},

{
  id: "harry-potter-deathly-hallows-part-1",
  collection: "Harry Potter",
  franchise: "Harry Potter",
  title: "Harry Potter and the Deathly Hallows: Part 1",
  edition: "4K Ultra HD",
  year: "2010",
  rating: "PG-13",
  runtime: "2h 26m",
  poster: "assets/posters/HarryPotter/harry-potter-deathly-hallows-part-1.jpg"
},

{
  id: "harry-potter-deathly-hallows-part-2",
  collection: "Harry Potter",
  franchise: "Harry Potter",
  title: "Harry Potter and the Deathly Hallows: Part 2",
  edition: "4K Ultra HD",
  year: "2011",
  rating: "PG-13",
  runtime: "2h 10m",
  poster: "assets/posters/HarryPotter/harry-potter-deathly-hallows-part-2.jpg"
},
{
  id: "the-mummy",
  collection: "The Mummy",
  franchise: "The Mummy",
  title: "The Mummy",
  edition: "4K Ultra HD",
  year: "1999",
  rating: "PG-13",
  runtime: "2h 4m",
  poster: "assets/posters/TheMummy/the-mummy.jpg"
},

{
  id: "the-mummy-returns",
  collection: "The Mummy",
  franchise: "The Mummy",
  title: "The Mummy Returns",
  edition: "4K Ultra HD",
  year: "2001",
  rating: "PG-13",
  runtime: "2h 10m",
  poster: "assets/posters/TheMummy/the-mummy-returns.jpg"
},

{
  id: "the-mummy-tomb-dragon-emperor",
  collection: "The Mummy",
  franchise: "The Mummy",
  title: "The Mummy: Tomb of the Dragon Emperor",
  edition: "4K Ultra HD",
  year: "2008",
  rating: "PG-13",
  runtime: "1h 52m",
  poster: "assets/posters/TheMummy/the-mummy-tomb-dragon-emperor.jpg"
},

{
  id: "back-to-the-future",
  collection: "Back to the Future",
  franchise: "Back to the Future",
  title: "Back to the Future",
  edition: "4K Ultra HD",
  year: "1985",
  rating: "PG",
  runtime: "1h 56m",
  poster: "assets/posters/BackToTheFuture/back-to-the-future.jpg"
},

{
  id: "back-to-the-future-part-2",
  collection: "Back to the Future",
  franchise: "Back to the Future",
  title: "Back to the Future Part II",
  edition: "4K Ultra HD",
  year: "1989",
  rating: "PG",
  runtime: "1h 48m",
  poster: "assets/posters/BackToTheFuture/back-to-the-future-part-2.jpg"
},

{
  id: "back-to-the-future-part-3",
  collection: "Back to the Future",
  franchise: "Back to the Future",
  title: "Back to the Future Part III",
  edition: "4K Ultra HD",
  year: "1990",
  rating: "PG",
  runtime: "1h 58m",
  poster: "assets/posters/BackToTheFuture/back-to-the-future-part-3.jpg"
},

{
  id: "thor-ragnarok",
  collection: "Marvel",
  franchise: "Marvel Cinematic Universe",
  title: "Thor: Ragnarok",
  edition: "4K Ultra HD",
  year: "2017",
  rating: "PG-13",
  runtime: "2h 10m",
  poster: "assets/posters/marvel/thor-ragnarok.jpg"
},

{
  id: "the-super-mario-bros-movie",
  collection: "Super Mario",
  franchise: "The Super Mario Bros. Movie",
  title: "The Super Mario Bros. Movie",
  edition: "4K Ultra HD",
  year: "2023",
  rating: "PG",
  runtime: "1h 32m",
  poster: "assets/posters/SuperMario/the-super-mario-bros-movie.jpg"
},

{
  id: "the-super-mario-galaxy-movie",
  collection: "Super Mario",
  franchise: "The Super Mario Bros. Movie",
  title: "The Super Mario Galaxy Movie",
  edition: "4K Ultra HD",
  year: "2026",
  rating: "PG",
  runtime: "1h 38m",
  poster: "assets/posters/SuperMario/the-super-mario-galaxy-movie.jpg"
},
];
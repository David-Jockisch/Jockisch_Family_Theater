const library = require("./server/playback/library");

console.log(library.getSummary());

console.log("");

const demos = library.getLibrary().demos;

console.log(
    "First Demo:"
);

console.log(
    demos[0]
);

console.log("");

console.log(
    `Loaded ${demos.length} demos.`
);
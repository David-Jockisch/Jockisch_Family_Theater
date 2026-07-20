const library = require("./server/playback/library");
const playbackState = require("./server/playback/playbackState");
const shuffle = require("./server/playback/shuffle");

// Uncomment to start fresh
// playbackState.reset();

const demos = library.getLibrary().demos;

for (let i = 1; i <= 15; i++) {

    const picks = shuffle.pick(
        "demos",
        demos,
        2
    
    );

    console.log(
        `Presentation ${i}:`,
        picks.map(p => p.id).join(", ")
    );

}
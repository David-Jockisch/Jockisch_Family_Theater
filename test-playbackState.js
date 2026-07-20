const playbackState = require("./server/playback/playbackState");

console.log("Demo Bag:");
console.log(
    playbackState.getShuffleBag("demos")
);

console.log("");

playbackState.setShuffleBag(
    "demos",
    ["001", "007", "014"]
);

console.log("Updated Demo Bag:");
console.log(
    playbackState.getShuffleBag("demos")
);

console.log("");

console.log(
    "Presentation Count:",
    playbackState.incrementPresentationCount()
);
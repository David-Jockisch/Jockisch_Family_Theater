const playlist = require("./server/playback/playlist");
const player = require("./server/playback/player");

player.play(
    playlist.build()
);

console.log("Presentation launched.");
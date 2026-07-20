const playbackState = require("./playbackState");

function pick(type, media, count) {

    if (!Array.isArray(media) || media.length === 0) {
        return [];
    }

    let bag = playbackState.getShuffleBag(type);

    const selected = [];

    while (selected.length < count) {

        // If the bag is empty, refill it.
        if (bag.length === 0) {

            bag = shuffle(
                media.map(item => item.id)
            );

        }

        selected.push(
            bag.shift()
        );

    }

    playbackState.setShuffleBag(type, bag);

    return selected
        .map(id => media.find(item => item.id === id))
        .filter(Boolean);

}

//
// Fisher-Yates Shuffle
//

function shuffle(array) {

    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {

        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [copy[i], copy[j]] = [copy[j], copy[i]];

    }

    return copy;

}

module.exports = {
    pick
};
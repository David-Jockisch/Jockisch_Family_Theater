const fs = require("fs");
const path = require("path");

const config = require("./config");

const DEFAULT_STATE = {
    version: 1,

    presentationCount: 0,

    shuffle: {
        demos: [],
        trailers: []
    },

    lastPresentation: null
};

//
// Public
//

function get() {
    ensureExists();

    return JSON.parse(
        fs.readFileSync(
            config.data.historyFile,
            "utf8"
        )
    );
}

function save(state) {
    ensureFolder();

    fs.writeFileSync(
        config.data.historyFile,
        JSON.stringify(state, null, 4),
        "utf8"
    );
}

function reset() {
    save(structuredClone(DEFAULT_STATE));
}

//
// Shuffle Bags
//

function getShuffleBag(type) {
    const state = get();

    return [...(state.shuffle[type] || [])];
}

function setShuffleBag(type, bag) {
    const state = get();

    state.shuffle[type] = [...bag];

    save(state);
}

//
// Presentation Count
//

function getPresentationCount() {
    return get().presentationCount;
}

function incrementPresentationCount() {
    const state = get();

    state.presentationCount++;

    save(state);

    return state.presentationCount;
}

//
// Last Presentation
//

function getLastPresentation() {
    return get().lastPresentation;
}

function setLastPresentation(presentation) {
    const state = get();

    state.lastPresentation = presentation;

    save(state);
}

//
// Private
//

function ensureExists() {
    ensureFolder();

    if (fs.existsSync(config.data.historyFile)) {
        return;
    }

    reset();
}

function ensureFolder() {
    fs.mkdirSync(
        path.dirname(config.data.historyFile),
        {
            recursive: true
        }
    );
}

module.exports = {
    get,
    save,
    reset,

    getShuffleBag,
    setShuffleBag,

    getPresentationCount,
    incrementPresentationCount,

    getLastPresentation,
    setLastPresentation
};
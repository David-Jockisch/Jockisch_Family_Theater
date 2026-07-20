const config = require("./config");
const library = require("./library");
const shuffle = require("./shuffle");

function build(options = {}) {

    const settings = {
        intro: options.intro ?? config.defaults.introEnabled,
        demos: options.demos ?? config.defaults.demoCount,
        trailers: options.trailers ?? config.defaults.trailerCount,
        featurePresentation:
            options.featurePresentation ??
            config.defaults.featurePresentationEnabled
    };

    const media = library.getLibrary();

    const playlist = [];

    //
    // Intro
    //

    if (settings.intro && media.intros.length > 0) {

        playlist.push({
            type: "intro",
            ...media.intros[0]
        });

    }

    //
    // Demos
    //

    playlist.push(
        ...shuffle
            .pick("demos", media.demos, settings.demos)
            .map(item => ({
                type: "demo",
                ...item
            }))
    );

    //
    // Trailers
    //

    playlist.push(
        ...shuffle
            .pick("trailers", media.trailers, settings.trailers)
            .map(item => ({
                type: "trailer",
                ...item
            }))
    );

    //
    // Feature Presentation
    //

    if (settings.featurePresentation &&
        media.utilities.length > 0) {

        playlist.push({
            type: "utility",
        ...media.utilities.find(item => item.id === "feature_presentation")
        });

    }

    return playlist;

}

module.exports = {
    build
};
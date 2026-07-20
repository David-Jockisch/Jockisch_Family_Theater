const path = require("path");
const os = require("os");

//
// Project Paths
//

const PROJECT_ROOT = path.join(__dirname, "..", "..");

const MEDIA_ROOT = path.join(
    process.env.USERPROFILE,
    "Videos",
    "Theater Media"
);

//
// Export Configuration
//

module.exports = {

    //
    // Project
    //

    project: {
        root: PROJECT_ROOT
    },

    //
    // Media Library
    //

    media: {

        root: MEDIA_ROOT,

        intros: path.join(
            MEDIA_ROOT,
            "01 Intros"
        ),

        trailers: path.join(
            MEDIA_ROOT,
            "02 Trailers"
        ),

        demos: path.join(
            MEDIA_ROOT,
            "03 Demos"
        ),

        utilities: path.join(
            MEDIA_ROOT,
            "04 Utilities"
        )

    },

    //
    // mpv
    //

    mpv: {

        path: path.join(
            PROJECT_ROOT,
            "tools",
            "mpv",
            "mpv.exe"
        )

    },

    //
    // Playback Defaults
    //

    defaults: {

        introEnabled: true,

        demoCount: 2,

        trailerCount: 2,

        featurePresentationEnabled: true,

        rememberHistory: true,

        useShuffleBag: true

    },

    //
    // Temporary Files
    //

    temp: {

        playlistFolder: path.join(
            os.tmpdir(),
            "Jockisch Family Theater"
        )

    },

    //
    // Data Storage
    //

    data: {

        historyFile: path.join(
            PROJECT_ROOT,
            "server",
            "data",
            "playback-history.json"
        )

    },

    //
    // Supported Media Types
    //

    supportedExtensions: [

        ".mp4",
        ".mkv",
        ".mov",
        ".avi",
        ".m4v",
        ".ts",
        ".m2ts",
        ".webm"

    ]

};
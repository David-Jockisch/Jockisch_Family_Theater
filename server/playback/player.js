const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const config = require("./config");

let mpvProcess = null;

//
// Public
//

function play(playlist) {

    if (!Array.isArray(playlist) ||
        playlist.length === 0) {

        throw new Error(
            "The presentation playlist is empty."
        );

    }

    //
    // Stop any existing playback
    //

    if (isRunning()) {
        stop();
    }

    //
    // Ensure temp folder exists
    //

    fs.mkdirSync(
        config.temp.playlistFolder,
        {
            recursive: true
        }
    );

    //
    // Build playlist file
    //

    const playlistFile = path.join(
        config.temp.playlistFolder,
        "presentation.m3u"
    );

    fs.writeFileSync(
        playlistFile,
        playlist
            .map(item => item.path)
            .join("\n"),
        "utf8"
    );

    //
    // Launch mpv
    //

    mpvProcess = spawn(
        config.mpv.path,
        [
            "--fs",
            "--fullscreen=yes",
            "--force-window=yes",
            "--really-quiet",

            "--ao=wasapi",
            "--audio-spdif=ac3,eac3,dts,dts-hd,truehd",

            playlistFile
        ],
        {
            detached: true,
            stdio: "ignore"
        }
    );

    mpvProcess.on(
        "exit",
        () => {
            mpvProcess = null;
        }
    );

    mpvProcess.on(
        "error",
        () => {
            mpvProcess = null;
        }
    );

    mpvProcess.unref();

    return {
        pid: mpvProcess.pid,
        playlistFile
    };

}

function stop() {

    if (!isRunning()) {
        return {
            success: true,
            stopped: false,
            message: "No playback is running."
        };
    }

    const pid = mpvProcess.pid;

    spawn(
        "taskkill",
        [
            "/PID",
            String(pid),
            "/T",
            "/F"
        ],
        {
            windowsHide: true,
            stdio: "ignore"
        }
    ).unref();

    mpvProcess = null;

    return {
        success: true,
        stopped: true,
        pid
    };

}

function isRunning() {

    return Boolean(
        mpvProcess &&
        mpvProcess.exitCode === null &&
        !mpvProcess.killed
    );

}

function getProcessId() {

    if (!isRunning()) {
        return null;
    }

    return mpvProcess.pid;

}

module.exports = {
    play,
    stop,
    isRunning,
    getProcessId
};
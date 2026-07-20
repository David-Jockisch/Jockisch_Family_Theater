const fs = require("fs");

const config = require("./config");
const library = require("./library");
const playlist = require("./playlist");
const player = require("./player");
const playbackState = require("./playbackState");

class PlaybackManager {

    constructor(options = {}) {

        //
        // Apply configuration overrides
        //

        if (options.mpvPath) {
            config.mpv.path = options.mpvPath;
        }

        if (options.mediaPaths) {

            config.media = {
                ...config.media,
                ...options.mediaPaths
            };

        }

        if (options.historyFile) {
            config.data.historyFile =
                options.historyFile;
        }

    }

    //
    // Playback Status
    //

    getStatus() {

        return {
            success: true,

            running: player.isRunning(),

            pid: player.getProcessId(),

            presentationCount:
                playbackState
                    .getPresentationCount(),

            lastPresentation:
                playbackState
                    .getLastPresentation()
        };

    }

    //
    // Library Summary
    //

    getLibrarySummary() {

        return {
            success: true,

            paths: {
                intros:
                    config.media.intros,

                demos:
                    config.media.demos,

                trailers:
                    config.media.trailers,

                utilities:
                    config.media.utilities
            },

            counts:
                library.getSummary()
        };

    }

    //
    // Start Presentation
    //

    async playPresentation(options = {}) {

        this.validateMpv();

        const presentationPlaylist =
            playlist.build({

                intro:
                    options.includeIntro !== false,

                demos:
                    options.includeDemos === false
                        ? 0
                        : options.demoCount,

                trailers:
                    options.includeTrailers === false
                        ? 0
                        : options.trailerCount,

                featurePresentation:
                    options
                        .includeFeaturePresentation !==
                    false

            });

        this.applyFileOverrides(
            presentationPlaylist,
            options
        );

        this.validatePlaylist(
            presentationPlaylist
        );

        const playback =
            player.play(
                presentationPlaylist
            );

        const presentationNumber =
            playbackState
                .incrementPresentationCount();

        const presentation = {

            number:
                presentationNumber,

            startedAt:
                new Date().toISOString(),

            pid:
                playback.pid,

            playlistFile:
                playback.playlistFile,

            items:
                presentationPlaylist.map(
                    item => ({

                        type:
                            item.type,

                        id:
                            item.id,

                        filename:
                            item.filename,

                        path:
                            item.path

                    })
                )

        };

        playbackState.setLastPresentation(
            presentation
        );

        return presentation;

    }

    //
    // Stop Presentation
    //

    async stopPlayback() {

        return player.stop();

    }

    //
    // File Overrides
    //

    applyFileOverrides(
        presentationPlaylist,
        options
    ) {

        if (options.introFile) {

            this.replacePlaylistItem(
                presentationPlaylist,
                "intro",
                options.introFile,
                library.getLibrary().intros
            );

        }

        if (
            options.featurePresentationFile
        ) {

            this.replacePlaylistItem(
                presentationPlaylist,
                "utility",
                options
                    .featurePresentationFile,
                library
                    .getLibrary()
                    .utilities
            );

        }

    }

    replacePlaylistItem(
        presentationPlaylist,
        type,
        requestedFile,
        availableFiles
    ) {

        const selectedFile =
            availableFiles.find(
                item =>
                    item.path ===
                        requestedFile ||

                    item.filename ===
                        requestedFile ||

                    item.id ===
                        requestedFile
            );

        if (!selectedFile) {

            const error = new Error(
                `Requested ${type} file was not found: ${requestedFile}`
            );

            error.missingFiles = [
                requestedFile
            ];

            throw error;

        }

        const existingIndex =
            presentationPlaylist.findIndex(
                item =>
                    item.type === type
            );

        const replacement = {
            type,
            ...selectedFile
        };

        if (existingIndex >= 0) {

            presentationPlaylist[
                existingIndex
            ] = replacement;

            return;

        }

        if (type === "intro") {

            presentationPlaylist.unshift(
                replacement
            );

            return;

        }

        presentationPlaylist.push(
            replacement
        );

    }

    //
    // Validation
    //

    validateMpv() {

        if (
            fs.existsSync(
                config.mpv.path
            )
        ) {
            return;
        }

        const error = new Error(
            "mpv.exe could not be found."
        );

        error.expectedPath =
            config.mpv.path;

        throw error;

    }

    validatePlaylist(
        presentationPlaylist
    ) {

        if (
            !Array.isArray(
                presentationPlaylist
            ) ||
            presentationPlaylist.length === 0
        ) {

            throw new Error(
                "The presentation playlist is empty."
            );

        }

        const missingFiles =
            presentationPlaylist
                .filter(
                    item =>
                        !item.path ||
                        !fs.existsSync(
                            item.path
                        )
                )
                .map(
                    item =>
                        item.path ||
                        item.filename ||
                        item.id ||
                        item.type
                );

        if (missingFiles.length === 0) {
            return;
        }

        const error = new Error(
            "One or more presentation files could not be found."
        );

        error.missingFiles =
            missingFiles;

        throw error;

    }

}

module.exports = {
    PlaybackManager
};
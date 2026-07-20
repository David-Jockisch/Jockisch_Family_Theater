const fs = require("fs");
const path = require("path");

const config = require("./config");

//
// Public API
//

function scan(folderPath) {

    if (!fs.existsSync(folderPath)) {
        return [];
    }

    const media = [];

    walk(folderPath, media);

    media.sort((a, b) =>
        a.filename.localeCompare(
            b.filename,
            undefined,
            {
                numeric: true,
                sensitivity: "base"
            }
        )
    );

    return media;

}

function getLibrary() {

    return {

        intros: scan(config.media.intros),

        demos: scan(config.media.demos),

        trailers: scan(config.media.trailers),

        utilities: scan(config.media.utilities)

    };

}

function getSummary() {

    const library = getLibrary();

    return {

        intros: library.intros.length,

        demos: library.demos.length,

        trailers: library.trailers.length,

        utilities: library.utilities.length

    };

}

//
// Private
//

function walk(folderPath, media) {

    const entries = fs.readdirSync(
        folderPath,
        {
            withFileTypes: true
        }
    );

    for (const entry of entries) {

        const fullPath = path.join(
            folderPath,
            entry.name
        );

        if (entry.isDirectory()) {

            walk(fullPath, media);
            continue;

        }

        if (!entry.isFile()) {
            continue;
        }

        const extension = path.extname(
            entry.name
        ).toLowerCase();

        if (
            !config.supportedExtensions.includes(
                extension
            )
        ) {
            continue;
        }

        media.push({

            id: path.parse(entry.name).name,

            filename: entry.name,

            extension,

            path: fullPath,

            folder: path.basename(
                path.dirname(fullPath)
            )

        });

    }

}

module.exports = {

    scan,

    getLibrary,

    getSummary

};
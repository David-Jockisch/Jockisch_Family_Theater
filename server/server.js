const express = require("express");
const path = require("path");

const {
  getState,
  updateState
} = require("./state");

const {
  PlaybackManager
} = require("./playback");

const app = express();
const PORT = 3000;

//
// Project Paths
//

const PROJECT_ROOT = path.join(
  __dirname,
  ".."
);

const MEDIA_ROOT = path.join(
  process.env.USERPROFILE,
  "Videos",
  "Theater Media"
);

const INTRO_PATH = path.join(
  MEDIA_ROOT,
  "01 Intros"
);

const TRAILER_PATH = path.join(
  MEDIA_ROOT,
  "02 Trailers"
);

const DEMO_PATH = path.join(
  MEDIA_ROOT,
  "03 Demos"
);

const UTILITY_PATH = path.join(
  MEDIA_ROOT,
  "04 Utilities"
);

const MPV_PATH = path.join(
  PROJECT_ROOT,
  "tools",
  "mpv",
  "mpv.exe"
);

const PLAYBACK_HISTORY_FILE = path.join(
  __dirname,
  "data",
  "playback-history.json"
);

//
// Playback Manager
//

const playbackManager = new PlaybackManager({
  mpvPath: MPV_PATH,

  mediaPaths: {
    root: MEDIA_ROOT,
    intros: INTRO_PATH,
    trailers: TRAILER_PATH,
    demos: DEMO_PATH,
    utilities: UTILITY_PATH
  },

  historyFile: PLAYBACK_HISTORY_FILE
});

//
// Express Middleware
//

app.use(express.json());

//
// Health Check
//

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "Jockisch Family Theater",
    timestamp: new Date().toISOString()
  });
});

//
// Theater State
//

app.get("/api/state", (req, res) => {
  res.json(getState());
});

app.post("/api/state", (req, res) => {
  const updatedState = updateState(
    req.body
  );

  res.json(
    updatedState || getState()
  );
});

//
// Presentation Preparation
//

app.post("/api/prepare", (req, res) => {
  const {
    mode,
    mediaId
  } = req.body;

  if (!mode) {
    return res.status(400).json({
      success: false,
      error:
        "Presentation mode is required."
    });
  }

  if (!mediaId) {
    return res.status(400).json({
      success: false,
      error:
        "Media ID is required."
    });
  }

  if (
    !["movie", "game"].includes(mode)
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Presentation mode must be movie or game."
    });
  }

  const updatedState = updateState({
    mode,
    mediaId
  });

  return res.json({
    success: true,
    state:
      updatedState || getState()
  });
});

//
// Playback Library
//

app.get(
  "/api/playback/library",
  (req, res) => {
    try {
      return res.json(
        playbackManager.getLibrarySummary()
      );
    } catch (error) {
      console.error(
        "Playback library error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

//
// Playback Status
//

app.get(
  "/api/playback/status",
  (req, res) => {
    return res.json(
      playbackManager.getStatus()
    );
  }
);

//
// Start Complete Presentation
//

app.post(
  "/api/playback/start",
  async (req, res) => {
    try {
      const options = {
        includeIntro:
          req.body.includeIntro !== false,

        includeDemos:
          req.body.includeDemos !== false,

        includeTrailers:
          req.body.includeTrailers !== false,

        includeFeaturePresentation:
          req.body
            .includeFeaturePresentation !==
          false,

        demoCount:
          req.body.demoCount ?? 2,

        trailerCount:
          req.body.trailerCount ?? 2,

        introFile:
          req.body.introFile || null,

        featurePresentationFile:
          req.body
            .featurePresentationFile ||
          null
      };

      const presentation =
        await playbackManager
          .playPresentation(options);

      return res.json({
        success: true,
        message:
          "Presentation started.",
        presentation
      });
    } catch (error) {
      console.error(
        "Unable to start presentation:",
        error
      );

      const response = {
        success: false,
        error: error.message
      };

      if (error.expectedPath) {
        response.expectedPath =
          error.expectedPath;
      }

      if (error.missingFiles) {
        response.missingFiles =
          error.missingFiles;
      }

      return res.status(500).json(
        response
      );
    }
  }
);

//
// Stop Playback
//

app.post(
  "/api/playback/stop",
  async (req, res) => {
    try {
      const result =
        await playbackManager
          .stopPlayback();

      return res.json(result);
    } catch (error) {
      console.error(
        "Unable to stop playback:",
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

//
// Temporary Development Test
//
// This keeps your existing test-playback.bat working.
//

app.get(
  "/api/mpv/test",
  async (req, res) => {
    try {
      const presentation =
        await playbackManager
          .playPresentation({
            includeIntro: true,
            includeDemos: true,
            includeTrailers: false,
            includeFeaturePresentation:
              false,
            demoCount: 2,
            trailerCount: 0
          });

      return res.json({
        success: true,
        message:
          "Intro and two-demo test launched.",
        presentation
      });
    } catch (error) {
      console.error(
        "mpv test failed:",
        error
      );

      const response = {
        success: false,
        error: error.message
      };

      if (error.expectedPath) {
        response.expectedPath =
          error.expectedPath;
      }

      if (error.missingFiles) {
        response.missingFiles =
          error.missingFiles;
      }

      return res.status(500).json(
        response
      );
    }
  }
);

//
// Website
//

app.use(
  express.static(PROJECT_ROOT)
);

//
// Server Startup
//

app.listen(PORT, () => {
  console.log("");
  console.log(
    "🎬 Jockisch Family Theater"
  );

  console.log(
    `🌐 Server: http://localhost:${PORT}`
  );

  console.log(
    `🎥 mpv: ${MPV_PATH}`
  );

  console.log(
    `📁 Media: ${MEDIA_ROOT}`
  );

  console.log("");
  console.log(
    "Playback endpoints:"
  );

  console.log(
    "  POST /api/playback/start"
  );

  console.log(
    "  POST /api/playback/stop"
  );

  console.log(
    "  GET  /api/playback/status"
  );

  console.log(
    "  GET  /api/playback/library"
  );

  console.log(
    "  GET  /api/mpv/test"
  );

  console.log("");
});
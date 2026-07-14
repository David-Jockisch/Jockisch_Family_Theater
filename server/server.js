const express = require("express");
const path = require("path");

const { getState, updateState } = require("./state");
const { testKodiConnection, playFile } = require("./kodi");

const demoLibrary = require("../library/demos/demo-library");

const app = express();
const PORT = 3000;

app.use(express.json());

//
// Theater State
//

app.get("/api/state", (req, res) => {
  res.json(getState());
});

app.post("/api/state", (req, res) => {
  updateState(req.body);
  res.json(getState());
});

//
// Kodi
//

app.get("/api/kodi/test", async (req, res) => {
  try {
    const result = await testKodiConnection();
    res.json(result);
  } catch (error) {
    console.error("Kodi test failed:", error);

    res.status(500).json({
      error: "Kodi connection failed"
    });
  }
});

app.post("/api/kodi/play-demo", async (req, res) => {
  try {
    const demo = demoLibrary.find(
      item => item.id === req.body.demoId
    );

    if (!demo) {
      return res.status(404).json({
        error: "Demo not found"
      });
    }

    if (!demo.file) {
      return res.status(400).json({
        error: "Demo has no file assigned"
      });
    }

    const result = await playFile(demo.file);

    res.json({
      success: true,
      demoId: demo.id,
      title: demo.title,
      kodi: result
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

//
// Website
//

app.use(express.static(path.join(__dirname, "..")));

app.listen(PORT, () => {
  console.log(`🎬 Jockisch Family Theater running at http://localhost:${PORT}`);
});
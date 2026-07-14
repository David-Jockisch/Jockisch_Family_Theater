const { getState, updateState } = require("./state");
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());


app.get("/api/state", (req, res) => {
  res.json(getState());
});

app.post("/api/state", (req, res) => {
  updateState(req.body);
  res.json(getState());
});

app.use(express.static(path.join(__dirname, "..")));

app.listen(PORT, () => {
  console.log(`🎬 Jockisch Family Theater running at http://localhost:${PORT}`);
});
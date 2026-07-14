require("dotenv").config();

const KODI_HOST = process.env.KODI_HOST;
const KODI_PORT = process.env.KODI_PORT;
const KODI_USERNAME = process.env.KODI_USERNAME;
const KODI_PASSWORD = process.env.KODI_PASSWORD;

const KODI_URL = `http://${KODI_HOST}:${KODI_PORT}/jsonrpc`;

const credentials = Buffer.from(
  `${KODI_USERNAME}:${KODI_PASSWORD}`
).toString("base64");

async function kodiRequest(method, params = {}) {
  const response = await fetch(KODI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1
    })
  });

  return response.json();
}

async function testKodiConnection() {
  const result = await kodiRequest("JSONRPC.Ping");

  console.log("Kodi response:", result);

  return result;
}
async function playFile(filePath) {
  return kodiRequest("Player.Open", {
    item: {
      file: filePath
    }
  });
}
module.exports = {
  kodiRequest,
  testKodiConnection,
  playFile
};
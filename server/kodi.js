require("dotenv").config();

const KODI_HOST = process.env.KODI_HOST;
const KODI_PORT = process.env.KODI_PORT;
const KODI_USERNAME = process.env.KODI_USERNAME;
const KODI_PASSWORD = process.env.KODI_PASSWORD;

const KODI_URL =
  `http://${KODI_HOST}:${KODI_PORT}/jsonrpc`;

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
      id: Date.now()
    })
  });

  if (!response.ok) {
    throw new Error(
      `Kodi HTTP request failed with status ${response.status}`
    );
  }

  const result = await response.json();

  if (result.error) {
    const message =
      result.error.message || "Unknown JSON-RPC error";

    const details = result.error.data
      ? ` ${JSON.stringify(result.error.data)}`
      : "";

    throw new Error(
      `Kodi ${method} failed: ${message}.${details}`
    );
  }

  return result;
}


async function testKodiConnection() {
  const result = await kodiRequest("JSONRPC.Ping");

  console.log("Kodi response:", result);

  return result;
}


async function playFile(filePath) {
  console.log(`Playing Kodi video: ${filePath}`);

  const result = await kodiRequest("Player.Open", {
    item: {
      file: filePath
    }
  });

  console.log("Kodi playback command accepted.");

  return {
    success: true,
    file: filePath,
    kodi: result
  };
}


module.exports = {
  kodiRequest,
  testKodiConnection,
  playFile
};
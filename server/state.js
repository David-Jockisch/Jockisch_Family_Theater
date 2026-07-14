let theaterState = {
  mode: "idle",
  mediaId: null
};

function getState() {
  return theaterState;
}

function updateState(changes) {
  theaterState = {
    ...theaterState,
    ...changes
  };

  return theaterState;
}

module.exports = {
  getState,
  updateState
};
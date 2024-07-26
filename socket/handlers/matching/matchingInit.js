const { handleMatchingEvents } = require("./matchingHandler");

function initMatching(socket, io) {
  handleMatchingEvents(socket, io);
}

module.exports = initMatching;

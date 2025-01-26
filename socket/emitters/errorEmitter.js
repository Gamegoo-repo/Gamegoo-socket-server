const formatResponse = require("../common/responseFormatter");
const log = require("../../common/customLogger");

function emitError(socket, message) {
  socket.emit("error", formatResponse("error", message));
  log.emit("error", socket, message);
}

function emitJWTError(socket, code, message) {
  socket.emit("jwt-error", formatResponse("jwt-error", { code, message }));
  log.emit("jwt-error", socket, `code:${code}, message:${message}`);
}

function emitConnectionJwtError(socket) {
  socket.emit("connection-jwt-error");
  log.emit("connection-jwt-error", socket);
}

function emitJwtExpiredError(socket, eventName, eventData) {
  socket.emit("jwt-expired-error", formatResponse("jwt-expired-error", { eventName: eventName, eventData: eventData }));
  log.emit("jwt-expired-error", socket, `event name: ${eventName}`);
}
module.exports = {
  emitError,
  emitJWTError,
  emitConnectionJwtError,
  emitJwtExpiredError,
};

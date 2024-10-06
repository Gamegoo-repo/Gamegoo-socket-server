const formatResponse = require("../common/responseFormatter");

function emitError(socket, message) {
  socket.emit("error", formatResponse("error", message));
}

function emitJWTError(socket, code, eventName, eventData) {
  socket.emit("jwt-error", formatResponse("jwt-error", { code, token: socket.token, event_name: eventName, event_data: eventData }));
}

function emitConnectionJWTError(socket) {
  socket.emit("connection-jwt-error");
}

module.exports = {
  emitError,
  emitJWTError,
  emitConnectionJWTError,
};

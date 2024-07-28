const formatResponse = require("../common/responseFormatter");

function emitError(socket, message) {
  socket.emit("error", formatResponse("error", message));
}

function emitJWTError(socket, code, message) {
  socket.emit("jwt-error", formatResponse("jwt-error", { code, message }));
}

module.exports = {
  emitError,
  emitJWTError,
};

const formatResponse = require("../common/responseFormatter");
const logger = require("../../common/winston");

function emitError(socket, message) {
  socket.emit("error", formatResponse("error", message));
  logger.info("Emitted 'error' event", `to socketId:${socket.id}, message:${message} `);
}

function emitJWTError(socket, code, message) {
  socket.emit("jwt-error", formatResponse("jwt-error", { code, message }));
  logger.info("Emitted 'jwt-error' event", `to socketId:${socket.id}, code:${code}, message:${message} `);
}

function emitConnectionJwtError(socket) {
  socket.emit("connection-jwt-error");
  logger.info("Emitted 'connection-jwt-error' event", `to socketId:${socket.id}`);
}

function emitJwtExpiredError(socket, eventName, eventData) {
  socket.emit("jwt-expired-error", formatResponse("jwt-expired-error", { eventName: eventName, eventData: eventData }));
  logger.info("Emitted 'jwt-expired-error' event", `to socketId:${socket.id}`);
}
module.exports = {
  emitError,
  emitJWTError,
  emitConnectionJwtError,
  emitJwtExpiredError,
};

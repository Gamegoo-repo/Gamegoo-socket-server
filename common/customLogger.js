const { logger } = require("./winston");

class CustomLogger {
  constructor(loggerInstance) {
    this.logger = loggerInstance;
  }

  info(message, socket) {
    const socketId = socket?.id ?? 'undefined';
    const memberId = socket?.memberId ?? 'undefined';
    this.logger.info(message, { socketId, memberId });
  }

  warn(message, socket) {
    const socketId = socket?.id ?? 'undefined';
    const memberId = socket?.memberId ?? 'undefined';
    this.logger.warn(message, { socketId, memberId });
  }

  debug(message, socket) {
    const socketId = socket?.id ?? 'undefined';
    const memberId = socket?.memberId ?? 'undefined';
    this.logger.debug(message, { socketId, memberId });
  }

  error(message, socket) {
    const socketId = socket?.id ?? 'undefined';
    const memberId = socket?.memberId ?? 'undefined';
    this.logger.error(message, { socketId, memberId });
  }

  http(method, uri, socket, message) {
    const socketId = socket?.id ?? 'undefined';
    const memberId = socket?.memberId ?? 'undefined';
    const logMsg = typeof message === "undefined" ? `[${method}] ${uri}` : `[${method}] ${uri}  |  ${message}`;
    this.logger.http(logMsg, { socketId, memberId });
  }

  httpError(method, uri, socket, code, message) {
    const socketId = socket?.id ?? 'undefined';
    const memberId = socket?.memberId ?? 'undefined';
    const logMsg = typeof message === "undefined"
      ? `[${method}] ${uri}  |  Request failed  |  ${code}`
      : `[${method}] ${uri}  |  Request failed  |  ${code}  |  ${message}`;
    this.logger.error(logMsg, { socketId, memberId });
  }

  emit(eventName, socket, message) {
    const socketId = socket?.id ?? 'undefined';
    const memberId = socket?.memberId ?? 'undefined';
    const logMsg = typeof message === "undefined"
      ? `[EMIT] ${eventName}`
      : `[EMIT] ${eventName}  |  ${message}`;
    this.logger.info(logMsg, { socketId, memberId });
  }

  listen(eventName, socket, message) {
    const socketId = socket?.id ?? 'undefined';
    const memberId = socket?.memberId ?? 'undefined';
    const logMsg = typeof message === "undefined"
      ? `[LISTEN] ${eventName}`
      : `[LISTEN] ${eventName}  |  ${message}`;
    this.logger.info(logMsg, { socketId, memberId });
  }

  broadcast(eventName, roomName, message) {
    if (typeof message === "undefined") {
      const logMsg = `[BROADCAST] ${eventName}  |  Room: ${roomName}`;
      this.logger.info(logMsg);
    } else {
      const logMsg = `[BROADCAST] ${eventName}  |  Room: ${roomName}  |  ${message}`;
      this.logger.info(logMsg);
    }
  }
}

// 인스턴스 생성
const customLogger = new CustomLogger(logger);

module.exports = customLogger;

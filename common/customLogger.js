const { logger } = require("./winston");

class CustomLogger {
  constructor(loggerInstance) {
    this.logger = loggerInstance;
  }

  info(message, socket) {
    this.logger.info(message, { socketId: socket.id, memberId: socket.memberId });
  }

  warn(message, socket) {
    this.logger.warn(message, { socketId: socket.id, memberId: socket.memberId });
  }

  debug(message, socket) {
    this.logger.debug(message, { socketId: socket.id, memberId: socket.memberId });
  }

  error(message, socket) {
    this.logger.error(message, { socketId: socket.id, memberId: socket.memberId });
  }

  http(method, uri, socket, message) {
    if (typeof message === "undefined") {
      const logMsg = `[${method}] ${uri}`;
      this.logger.http(logMsg, { socketId: socket.id, memberId: socket.memberId });
    } else {
      const logMsg = `[${method}] ${uri}  |  ${message}`;
      this.logger.http(logMsg, { socketId: socket.id, memberId: socket.memberId });
    }
  }

  httpError(method, uri, socket, code, message) {
    if (typeof message === "undefined") {
      const logMsg = `[${method}] ${uri}  |  Request failed  |  ${code}`;
      this.logger.error(logMsg, { socketId: socket.id, memberId: socket.memberId });
    } else {
      const logMsg = `[${method}] ${uri}  |  Request failed  |  ${code}  |  ${message}`;
      this.logger.error(logMsg, { socketId: socket.id, memberId: socket.memberId });
    }
  }

  emit(eventName, socket, message) {
    if (typeof message === "undefined") {
      const logMsg = `[EMIT] ${eventName}`;
      this.logger.info(logMsg, { socketId: socket.id, memberId: socket.memberId });
    } else {
      const logMsg = `[EMIT] ${eventName}  |  ${message}`;
      this.logger.info(logMsg, { socketId: socket.id, memberId: socket.memberId });
    }
  }

  listen(eventName, socket, message) {
    if (typeof message === "undefined") {
      const logMsg = `[LISTEN] ${eventName}`;
      this.logger.info(logMsg, { socketId: socket.id, memberId: socket.memberId });
    } else {
      const logMsg = `[LISTEN] ${eventName}  |  ${message}`;
      this.logger.info(logMsg, { socketId: socket.id, memberId: socket.memberId });
    }
  }
}

// 인스턴스 생성
const customLogger = new CustomLogger(logger);

module.exports = customLogger;

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
}

// 인스턴스 생성
const customLogger = new CustomLogger(logger);

module.exports = customLogger;

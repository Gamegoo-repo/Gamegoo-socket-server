const formatResponse = require("../common/responseFormatter");
const logger = require("../../common/winston");

function emitMemberInfo(socket) {
  const memberId = socket.memberId;
  socket.emit("member-info", formatResponse("member-info", { memberId }));
  logger.info("Emitted 'member-info' event", `to socketId:${socket.id}, memberId:${memberId}`);
}

module.exports = {
  emitMemberInfo,
};

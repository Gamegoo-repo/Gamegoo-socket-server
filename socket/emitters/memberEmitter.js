const formatResponse = require("../common/responseFormatter");
const log = require("../../common/customLogger");

function emitMemberInfo(socket) {
  const memberId = socket.memberId;
  socket.emit("member-info", formatResponse("member-info", { memberId }));
  log.emit("member-info", socket);
}

module.exports = {
  emitMemberInfo,
};

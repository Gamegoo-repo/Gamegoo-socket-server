const formatResponse = require("../common/responseFormatter");

function emitMemberInfo(socket) {
  const memberId = socket.memberId;
  socket.emit("member-info", formatResponse("member-info", { memberId }));
}

module.exports = {
  emitMemberInfo,
};

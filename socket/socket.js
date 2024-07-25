const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

function initializeSocket(server) {
  const io = socketIo(server);

  io.on("connection", (socket) => {
    console.log("SOCKET CONNECTED: ", socket.id);

    socket.on("disconnect", () => {
      console.log("SOCKET DISCONNECTED: ", socket.id);
    });
  });

  return io;
}

module.exports = initializeSocket;

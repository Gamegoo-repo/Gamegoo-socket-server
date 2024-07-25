const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000", // localhost:3000 cors 허용
      methods: ["*"], // 모든 메소드 허용
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("SOCKET CONNECTED: ", socket.id);

    socket.on("disconnect", () => {
      console.log("SOCKET DISCONNECTED: ", socket.id);
    });
  });

  return io;
}

module.exports = initializeSocket;

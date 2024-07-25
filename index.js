// index.js
const { app, server } = require("./app/app");
const initializeSocket = require("./socket/socket");

const io = initializeSocket(server);

const routes = require("./app/routers/index")(io); // 라우터에 io 객체 전달

app.use("/", routes);

server.listen(3000, () => {
  console.log("listening on *:3000");
});

module.exports = { app, server, io };

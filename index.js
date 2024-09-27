// index.js
const { app, server } = require("./app/app");
const initializeSocket = require("./socket/socket");
const setUpMatchEventsListeners = require("./socket/events/matchingEventsListener");
const cors = require("cors");

const io = initializeSocket(server);

const routes = require("./app/routers/index")(io); // 라우터에 io 객체 전달

// 이벤트 리스너를 io 객체와 연결
setUpMatchEventsListeners(io);

app.use(
  cors({
    origin: ["http://localhost:3000", "https://socket.gamegoo.co.kr", "https://www.gamegoo.co.kr"], // localhost:3000 cors 허용
    methods: ["*"], // 모든 메소드 허용
    credentials: true, // 쿠키 허용
  })
);

app.use("/", routes);

server.listen(3000, () => {
  console.log("listening on *:3000");
});

module.exports = { app, server, io };

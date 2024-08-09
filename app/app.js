const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const config = require("../common/config");

const SOCKETIO_URL = config.socketioUrl;
const API_SERVER_URL = config.apiServerUrl;
const NODE_SERVER_URL = config.nodeServerUrl;

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: ["http://localhost:3000", "https://socket.gamegoo.co.kr"], // localhost:3000 cors 허용
    methods: ["*"], // 모든 메소드 허용
    credentials: true, // 쿠키 허용
  })
);
app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

app.get("/match", (req, res) => {
  res.send(`
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>겜구 매칭 테스트</title>
  <link rel="stylesheet" href="styles.css" /> 
</head>

<body>
  <div class="container">
    <h2>Gamegoo Matching</h3>
    <div class="top-bar">
      <div>
        <input id="userEmail" type="string" placeholder="Enter your Email" />
        <input id="userPw" type="string" placeholder="Enter your Pw" />
        <button id="loginButton">Login</button>
        <button id="logoutButton">Logout</button>
      </div>
      <p id="loginStatus">You are not Login User</p>
    </div>
      <div class="input-group">
        <select id="matching-type">
          <option value="BASIC">BASIC</option>
          <option value="PRECISE">PRECISE</option>
        </select>
        <input type="number" id="game-mode" min="1" max="4" placeholder="게임 모드 (1: 빠른 대전, 2: 솔로 랭크, 3: 자유 랭크, 4: 칼바람 나락)">
      </div>
  
      <div class="input-group">
        <input type="text" id="tier" placeholder="티어 (IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)">
        <input type="number" id="rank" min="1" max="5" placeholder="랭크 (int 1~5)">
      </div>
  
      <div class="input-group">
        <label for="mike">Mike:</label>
        <input type="checkbox" id="mike">
        <input type="number" id="manner" min="1" max="999" placeholder="매너 점수 (int 1~5)">
      </div>
  
      <div class="input-group">
        <input type="number" id="mainP" min="0" max="5" placeholder="메인 포지션 (0:랜덤, 1:탑, 2:정글, 3:미드, 4:원딜, 5:서폿)">
        <input type="number" id="subP" min="0" max="5" placeholder="서브 포지션 (0:랜덤, 1:탑, 2:정글, 3:미드, 4:원딜, 5:서폿)">
        <input type="number" id="wantP" min="0" max="5" placeholder="원하는 상대 포지션 (0:랜덤, 1:탑, 2:정글, 3:미드, 4:원딜, 5:서폿)">
      </div>
  
      <button id="match-btn">Match</button>
    
    
  </div>
  <script>
    const API_SERVER_URL = '${API_SERVER_URL}';
    const NODE_SERVER_URL = '${NODE_SERVER_URL}';
  </script>
  <script src="${SOCKETIO_URL}"></script>
  <script src="scripts/socket.js"></script>
  <script src="scripts/api.js"></script>
  <script src="scripts/eventListeners.js"></script>
  <script>
    const matchBtn = document.getElementById('match-btn');

    matchBtn.addEventListener('click', () => {
      const matchingType = document.getElementById('matching-type').value;
      const gameMode = document.getElementById('game-mode').value;
      const mike = document.getElementById('mike').checked;
      const tier = document.getElementById('tier').value;
      const rank = document.getElementById('rank').value;
      const manner = document.getElementById('manner').value;
      const mainP = document.getElementById('mainP').value;
      const subP = document.getElementById('subP').value;
      const wantP = document.getElementById('wantP').value;

      console.log('========== Matching Information ==========');
      console.log('Matching Type: ' + matchingType);
      console.log('Game Mode: ' + gameMode);
      console.log('Mike: ' + mike);
      console.log('Tier: ' + tier);
      console.log('Rank: ' + rank);
      console.log('Manner: ' + manner);
      console.log('Main P: ' + mainP);
      console.log('Sub P: ' + subP);
      console.log('Want P: ' + wantP);
      console.log('==========================================');
    });
  </script>
</body>

</html>
    `
  )
})

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Socket 서버 테스트</title>
        <link rel="stylesheet" href="styles.css" />
      </head>
      <body>
        <div class="container">
          <div class="top-bar">
            <div>
              <input id="userEmail" type="string" placeholder="Enter your Email" />
              <input id="userPw" type="string" placeholder="Enter your Pw" />
              <button id="loginButton">Login</button>
              <button id="logoutButton">Logout</button>
            </div>
            <p id="loginStatus">You are not Login User</p>
          </div>
          <div class="content">
            <div class="column">
              <h2>친구 목록</h2>
              <ul id="friendsList"></ul>
              <button id="fetchFriendsButton">친구 목록 입장</button>
            </div>
            <div class="column">
              <h2>채팅방 목록</h2>
              <ul id="chatroomList"></ul>
              <button id="fetchChatroomsButton">채팅방 목록 페이지 입장</button>
            </div>
            <div class="column chatroom">
              <h2>채팅방</h2>
              <ul id="messages" class="messages"></ul>
              <form id="form" class="chat-form" action="">
                <input id="input" autocomplete="off" />
                <button>Send</button>
              </form>
            </div>
          </div>
        </div>
        <script>
          const API_SERVER_URL = '${API_SERVER_URL}';
          const NODE_SERVER_URL = '${NODE_SERVER_URL}';
        </script>
        <script src="${SOCKETIO_URL}"></script>
        <script src="scripts/socket.js"></script>
        <script src="scripts/api.js"></script>
        <script src="scripts/eventListeners.js"></script>
      </body>
    </html>
  `);
});

module.exports = { app, server };

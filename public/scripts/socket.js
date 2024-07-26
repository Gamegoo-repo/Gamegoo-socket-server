let socket;
let memberId = null; // 이 사용자의 memberId 저장
const loginStatus = document.getElementById("loginStatus");

function connectSocket(jwtToken = null) {
  const options = jwtToken ? { auth: { token: jwtToken } } : {};

  socket = io(options); // (#1-1), (#2-1) socket connection 생성

  socket.on("connect", () => {
    console.log("Connected to server. Socket ID:", socket.id);
    alert("Connected to server. Socket ID: " + socket.id);
  });

  setupSocketListeners();
}

function setupSocketListeners() {
  // member-info event listener
  socket.on("member-info", (response) => {
    loginStatus.textContent = "You are Login User, member Id: " + response.data.memberId;

    // (#1-11),(#2-4) memberId 전역변수 초기화
    memberId = response.data.memberId;
  });
}

window.addEventListener("load", () => {
  const jwtToken = localStorage.getItem("jwtToken");
  connectSocket(jwtToken);
});

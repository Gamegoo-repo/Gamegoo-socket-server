import { socket, state } from "../socket.js";

matchButton.addEventListener("click", () => {
  const matchingType = document.getElementById("matching-type").value;
  const gameMode = document.getElementById("game-mode").value;
  const mike = document.getElementById("mike").value;
  const mainP = document.getElementById("mainP").value;
  const subP = document.getElementById("subP").value;
  const wantP = document.getElementById("wantP").value;
  const gameStyle1 = Number(document.getElementById("gameStyle1").value);
  const gameStyle2 = Number(document.getElementById("gameStyle2").value);
  const gameStyle3 = Number(document.getElementById("gameStyle3").value);
  const memberId = state.memberId;

  // 요청 객체 생성
  const request = {
    memberId,
    matchingType,
    gameMode,
    mike,
    mainP,
    subP,
    wantP,
    gameStyle1,
    gameStyle2,
    gameStyle3,
  };

  console.log("Sending matching-request:", request);

  // (#20-1) "matching-request" emit
  socket.emit("matching-request", request);
});

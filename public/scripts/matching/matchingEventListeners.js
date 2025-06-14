import { socket, state } from "../socket.js";

matchButton.addEventListener("click", () => {
  console.log("matching-request");

  const matchingType = document.getElementById("matching-type").value;
  const gameMode = document.getElementById("game-mode").value;
  const mike = document.getElementById("mike").value;
  const mainP = document.getElementById("mainP").value;
  const subP = document.getElementById("subP").value;
  const wantP = document.getElementById("wantP").value;
  const gameStyleIdList = [
    Number(document.getElementById("gameStyle1").value),
    Number(document.getElementById("gameStyle2").value),
    Number(document.getElementById("gameStyle3").value)
  ].filter(Boolean); // falsy 값 제거 (null, undefined, NaN, 0, "" 등)
  const memberId = state.memberId;
  const threshold = 30;

  // 요청 객체 생성
  const request = {
    memberId,
    threshold,
    matchingType,
    gameMode,
    mike,
    mainP,
    subP,
    wantP,
    gameStyleIdList,
  };

  // (#20-1) "matching-request" emit
  socket.emit("matching-request", request);
});

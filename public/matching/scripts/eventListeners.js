const matchBtn = document.getElementById("match-btn");
const timerElement = document.getElementById("timer-value");

let elapsedSeconds = 0; // 타이머 경과된 시간 (초)
let timerInterval;

// 매칭 버튼 클릭 시
matchBtn.addEventListener("click", () => {
  const matchingType = document.getElementById("matching-type").value;
  const gameMode = document.getElementById("game-mode").value;
  const mike = document.getElementById("mike").checked;
  const mainP = document.getElementById("mainP").value;
  const subP = document.getElementById("subP").value;
  const wantP = document.getElementById("wantP").value;
  const gameStyle1 = document.getElementById("gameStyle1").value;
  const gameStyle2 = document.getElementById("gameStyle2").value;
  const gameStyle3 = document.getElementById("gameStyle3").value;

  console.log("========== Matching Information ==========");
  console.log("Matching Type: " + matchingType);
  console.log("Game Mode: " + gameMode);
  console.log("Mike: " + mike);
  console.log("Main P: " + mainP);
  console.log("Sub P: " + subP);
  console.log("Want P: " + wantP);
  console.log("==========================================");

  // input에 하나라도 안들어왔을 경우
  // if (!matchingType || !gameMode || !mainP || !subP || !wantP) {
  //   alert("input value should be filled.");
  //   return;
  // }

  // (#20-1) "matching_request" emit
  // socket.emit("matching_request", {
  //   matchingType: matchingType,
  //   gameMode: gameMode,
  //   mike: mike,
  //   mainP: mainP,
  //   subP: subP,
  //   wantP: wantP,
  //   gameStyle1: gameStyle1,
  //   gameStyle2: gameStyle2,
  //   gameStyle3: gameStyle3,
  // });

  document.getElementById("initial-screen").style.display = "none";
  document.getElementById("matching-screen").style.display = "block";

  // 매칭중 화면 스탑워치 시작
  elapsedSeconds = 0; // 스탑워치 초기화
  timerInterval = setInterval(updateTimer, 1000); // 1초마다 updateTimer 함수 실행
});

// 타이머 업데이트 메소드
function updateTimer() {
  let minutes = Math.floor(elapsedSeconds / 60);
  let seconds = elapsedSeconds % 60;

  // 숫자가 한 자리일 경우, 앞에 0을 추가
  let formattedTime = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  timerElement.textContent = formattedTime;

  elapsedSeconds++; // 1초씩 증가
}

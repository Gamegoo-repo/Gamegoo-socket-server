const userEmailInput = document.getElementById("userEmail");
const userPwInput = document.getElementById("userPw");

// 로그인 버튼 클릭 시
loginButton.addEventListener("click", () => {
  const userEmail = userEmailInput.value;
  if (!userEmail) {
    alert("Please enter your Email.");
    return;
  }

  const userPw = userPwInput.value;
  if (!userPw) {
    alert("Please enter your Pw.");
    return;
  }

  // (#1-2) 8080서버로 로그인 요청 보내 jwt 토큰 발급받기
  loginApi(userEmail, userPw).then((result) => {
    // (#1-3) 8080서버로부터 jwt 토큰 정상 응답 받음
    if (result) {
      // (#1-4) jwt 토큰 localStorage에 저장
      const jwtToken = result.accessToken;
      localStorage.setItem("jwtToken", jwtToken);

      alert("Login successful! Token received.");
      console.log("Using existing socket. Socket ID:", socket.id);

      // (#1-5) 8080서버로 나의 회원 정보 요청
      getMemberInfoApi().then((result) => {
        // (#1-6) 8080서버로부터 나의 회원 정보 정상 응답 받음
        if (result) {
          // (#1-7) localStorage에 나의 회원 정보 저장
          localStorage.setItem("profileImg", data.result.profileImg);
          localStorage.setItem("name", data.result.name);

          // (#1-8) 3000서버로 login api 요청 (소켓 초기화를 위함)
          loginNodeApi();
        }
      });
    }
  });
});

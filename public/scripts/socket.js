let socket;

function connectSocket(jwtToken = null) {
  const options = jwtToken ? { auth: { token: jwtToken } } : {};

  socket = io(options); // (#1-1), (#2-1) socket connection 생성

  socket.on("connect", () => {
    console.log("Connected to server. Socket ID:", socket.id);
    alert("Connected to server. Socket ID: " + socket.id);
  });
}

window.addEventListener("load", () => {
  const jwtToken = localStorage.getItem("jwtToken");
  connectSocket(jwtToken);
});

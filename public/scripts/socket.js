let socket;

function connectSocket(jwtToken = null) {
  const options = jwtToken ? { auth: { token: jwtToken } } : {};

  socket = io(options);

  socket.on("connect", () => {
    console.log("Connected to server. Socket ID:", socket.id);
    alert("Connected to server. Socket ID: " + socket.id);
  });
}

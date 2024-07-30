async function loginApi(userEmail, userPw) {
  const formData = new FormData();
  formData.append("email", userEmail);
  formData.append("password", userPw);

  try {
    const response = await fetch(`${API_SERVER_URL}/v1/member/login`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("Login failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getMemberInfoApi() {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/member/profile`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("getMemberInfoApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function loginNodeApi() {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${NODE_SERVER_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
        "Socket-Id": socket.id,
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      console.log(data.result);
    } else {
      throw new Error("loginNodeApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getFriendListApi() {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/member/friends`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("getMemberInfoApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getChatroomListApi() {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/member/chatroom`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("getMemberInfoApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

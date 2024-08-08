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
    const response = await fetch(`${API_SERVER_URL}/v1/friends`, {
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

async function enterChatroomApi(chatroomUuid) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/chat/${chatroomUuid}/enter`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("enterChatroomApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function readChatApi(chatroomUuid, timestamp) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/chat/${chatroomUuid}/read?timestamp=${timestamp}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("readChatApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getMessageApi(chatroomUuid, cursor) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/chat/${chatroomUuid}/messages?cursor=${cursor}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("readChatApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function startChatApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/chat/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targetMemberId: memberId }),
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("startChatApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function exitChatroomApi(chatroomUuid) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/chat/${chatroomUuid}/exit`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("exitChatroomApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

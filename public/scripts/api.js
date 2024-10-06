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

async function getFriendListApi(cursor) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    let url = `${API_SERVER_URL}/v1/friends`;
    if (cursor) {
      url += `?cursor=${cursor}`;
    }
    const response = await fetch(url, {
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

async function getChatroomListApi(cursor) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    let url = `${API_SERVER_URL}/v1/member/chatroom`;
    if (cursor) {
      url += `?cursor=${cursor}`;
    }
    const response = await fetch(url, {
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
      method: "PATCH", // PATCH 메서드로 요청
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

async function startChatByMemberIdApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/chat/start/member/${memberId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("startChatByMemberIdApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function startChatByBoardIdApi(boardId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/chat/start/board/${boardId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("startChatByBoardIdApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function exitChatroomApi(chatroomUuid) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/chat/${chatroomUuid}/exit`, {
      method: "PATCH", // PATCH 메서드로 요청
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

async function starFriendApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/friends/${memberId}/star`, {
      method: "PATCH", // PATCH 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("starFriendApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function unstarFriendApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/friends/${memberId}/star`, {
      method: "DELETE", // DELETE 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("unstarFriendApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function deleteFriendApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/friends/${memberId}`, {
      method: "DELETE", // DELETE 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("unstarFriendApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function sendFriendRequestApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/friends/request/${memberId}`, {
      method: "POST", // POST 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("starFriendApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function blockMemberApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/v1/member/block/${memberId}`, {
      method: "POST", // POST 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("starFriendApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function reissueToken() {
  try {
    console.log("reissueToken api called");
    const refreshToken = localStorage.getItem("refreshToken");
    const response = await fetch(`${API_SERVER_URL}/v1/member/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // JSON 형식으로 전송 명시
      },
      body: JSON.stringify({ refreshToken: refreshToken }), // 객체를 JSON 문자열로 변환
    });
    console.log("response:", response);

    const data = await response.json();
    console.log("data:", data);
    if (data.isSuccess && data.result) {
      return data.result;
    } else {
      throw new Error("refreshTokenApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

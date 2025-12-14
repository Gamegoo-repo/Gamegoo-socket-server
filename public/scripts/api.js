export async function loginApi(memberId) {
  try {
    const response = await fetch(`${API_SERVER_URL}/home/tokens/${memberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json", // JSON 형식으로 전송 명시
      }
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("Login failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getMemberInfoApi() {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/member/profile`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, 
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("getMemberInfoApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function loginNodeApi(socketId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${NODE_SERVER_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
        "Socket-Id": socketId,
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

export async function getFriendListApi() {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    let url = `${API_SERVER_URL}/api/v2/friend`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("getFriendListApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getChatroomListApi() {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    let url = `${API_SERVER_URL}/api/v2/chatroom`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("getChatroomListApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function enterChatroomApi(chatroomUuid) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/chat/${chatroomUuid}/enter`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("enterChatroomApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function readChatApi(chatroomUuid, timestamp) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/chat/${chatroomUuid}/read?timestamp=${timestamp}`, {
      method: "PATCH", // PATCH 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("readChatApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getMessageApi(chatroomUuid, cursor) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/chat/${chatroomUuid}/messages?cursor=${cursor}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("getMessageApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function startChatByMemberIdApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/chat/start/member/${memberId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("startChatByMemberIdApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function startChatByBoardIdApi(boardId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/chat/start/board/${boardId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("startChatByBoardIdApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function exitChatroomApi(chatroomUuid) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/chat/${chatroomUuid}/exit`, {
      method: "PATCH", // PATCH 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("exitChatroomApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function starFriendApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/friend/${memberId}/star`, {
      method: "PATCH", // PATCH 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("starFriendApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function deleteFriendApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/friend/${memberId}`, {
      method: "DELETE", // DELETE 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("deleteFriendApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function sendFriendRequestApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/friend/request/${memberId}`, {
      method: "POST", // POST 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("sendFriendRequestApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function blockMemberApi(memberId) {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/block/${memberId}`, {
      method: "POST", // POST 메서드로 요청
      headers: {
        Authorization: `Bearer ${jwtToken}`, // Include JWT token in header
      },
    });
    const data = await response.json();
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("blockMemberApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function reissueToken() {
  try {
    console.log("reissueToken api called");
    const refreshToken = localStorage.getItem("refreshToken");
    const response = await fetch(`${API_SERVER_URL}/api/v2/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // JSON 형식으로 전송 명시
      },
      body: JSON.stringify({ refreshToken: refreshToken }), // 객체를 JSON 문자열로 변환
    });
    console.log("response:", response);

    const data = await response.json();
    console.log("data:", data);
    if (data.status == 200) {
      return data.data;
    } else {
      throw new Error("refreshTokenApi failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

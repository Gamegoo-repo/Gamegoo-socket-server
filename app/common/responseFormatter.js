function successResponse(result) {
  return {
    isSuccess: true,
    code: "COMMON200",
    message: "성공입니다",
    result: result,
  };
}

function failResponse(code, message, result = "") {
  return {
    isSuccess: false,
    code: code,
    message: message,
    result: result,
  };
}

module.exports = {
  successResponse,
  failResponse,
};

class JWTTokenError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "JWTTokenError";
    this.code = code;
  }
}

module.exports = JWTTokenError;

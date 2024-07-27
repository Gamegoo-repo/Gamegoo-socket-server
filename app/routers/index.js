const express = require("express");
const { join } = require("node:path");
const path = require("path");

module.exports = (io) => {
  const router = express.Router();

  const { login } = require("../controller/loginController")(io); // io 객체를 전달

  router.use("/img", express.static(path.join(__dirname, "../../public/img")));

  router.use("/scripts", express.static(path.join(__dirname, "../../public/scripts")));

  router.post("/login", login);

  return router;
};

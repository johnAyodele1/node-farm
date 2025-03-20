const express = require("express");
const userController = require("../controllers/userController.js");
const router = express.Router();

router.post("/signup", userController.createUser);
router.post("/login", userController.login);
router.route("/").get(userController.protect, userController.getUsers);
module.exports = router;

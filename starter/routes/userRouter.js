const express = require("express");
const userController = require("../controllers/userController.js");
const router = express.Router();

router.post("/signup", userController.createUser);
router.post("/login", userController.login);
router
  .route("/")
  .get(
    userController.protect,
    userController.restrictTo("admin", "lead guide"),
    userController.getUsers
  );
router
  .route("/update")
  .patch(userController.protect, userController.updateUser);
router.route("/updatepassword").patch(userController.updatePassword);
router.route("/forgetpassword").post(userController.forgetPassword);
router.route("/verifyemail").post(userController.verifyEmail);
router.patch("/resetpassword/:token", userController.resetPassword);
module.exports = router;

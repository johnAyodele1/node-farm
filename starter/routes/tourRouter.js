const express = require("express");
const tourController = require("../controllers/tourController.js");
const userController = require("../controllers/userController.js");

const router = express.Router();
// router.param("id", tourController.checkId);
router
  .route("/top5cheap")
  .get(
    userController.protect,
    tourController.cheapTour,
    tourController.getAllTour
  );
router.route("/tour-stats").get(tourController.tourStats);
router
  .route("/")
  .get(userController.protect, tourController.getAllTour)
  .post(userController.protect, tourController.createTour);
router
  .route("/:id")
  .get(userController.protect, tourController.getTour)
  .patch(
    userController.protect,
    userController.restrictTo("admin", "lead guide"),
    tourController.updateTour
  )
  .delete(
    userController.protect,
    userController.restrictTo("admin", "lead guide"),
    tourController.deleteTour
  );

module.exports = router;

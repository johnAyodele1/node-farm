const express = require("express");
const tourController = require("../controllers/tourController.js");

const router = express.Router();
// router.param("id", tourController.checkId);
router
  .route("/top5cheap")
  .get(tourController.cheapTour, tourController.getAllTour);
router.route("/tour-stats").get(tourController.tourStats);
router
  .route("/")
  .get(tourController.getAllTour)
  .post(tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;

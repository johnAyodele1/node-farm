const { query } = require("express");
const Tour = require("./../models/tourModel");

exports.cheapTour = (req, res, next) => {
  // req.query.page = 1;
  req.query.limit = 5;
  req.query.sort = "price,ratingAverage";
  next();
};
exports.getAllTour = async (req, res) => {
  try {
    let queryObj = { ...req.query };
    const excludedField = ["page", "limit", "sort", "fields"];
    excludedField.forEach((el) => delete queryObj[el]);
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gte|gt|lte|lt)\b/g, (el) => `$${el}`);
    queryObj = JSON.parse(queryObj);
    let tour = Tour.find(queryObj);
    if (req.query.sort) {
      const sorter = req.query.sort.split(",").join(" ");

      tour = tour.sort(sorter);
    } else {
      tour = tour.sort("ratingAverage createdAt");
    }
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      tour = tour.select(fields);
    } else tour = tour.select("-__v");

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    tour = tour.skip(skip).limit(limit);
    if (req.query.page) {
      const totalDocs = await Tour.countDocuments(queryObj);
      if (skip >= totalDocs) {
        throw new Error("This page does not exist");
      }
    }
    const tours = await tour;
    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      requestedAt: req.requestTime,
      message: err.message,
    });
  }
};
exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: "success",
      requestedAt: req.requestTime,
      data: {
        newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      requestedAt: req.requestTime,
      message: err.message,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      requestedAt: req.requestTime,
      message: "Tour not found",
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(202).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      return res.status(404).json({
        status: "error",
        message: "Tour not found",
      });
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
exports.tourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: "$difficulty",
          numRating: { $sum: "$ratingQuantity" },
          avgRating: { $avg: "$ratingAverage" },
          avgPrice: { $avg: "$price" },
          maxPrice: { $max: "$price" },
          minPrice: { $min: "$price" },
        },
      },
    ]);
    res.status(202).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

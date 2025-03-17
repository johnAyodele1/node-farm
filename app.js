const express = require("express");
const app = express();
const tourRoute = require("./starter/routes/tourRouter");
const userRoute = require("./starter/routes/userRouter");
app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
app.use("/api/v1/tours", tourRoute);
app.use("/api/v1/users", userRoute);
app.all("*", (req, res, next) => {
  res.status(400).json({
    status: "fail",
    message: `We can't find the ${req.originalUrl} route`,
  });
});
module.exports = app;

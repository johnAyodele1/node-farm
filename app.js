const express = require("express");
const app = express();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const tourRoute = require("./starter/routes/tourRouter");
const userRoute = require("./starter/routes/userRouter");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
// Data sanitization against NoSQL injection
app.use(helmet());
app.use(mongoSanitize());
// Data sanitization against SQL injection

app.use(xss());
app.use(
  express.json({
    limit: "10kb",
  })
);

const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message:
    "Too many request from this IP address. Please, try again in an hour.",
});
app.use("/api", limiter);
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

const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const signToken = (id) => {
  return jwt.sign({ id: id._id }, "my-ultra-safe-password", {
    expiresIn: "10h",
  });
};
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
exports.createUser = async (req, res) => {
  try {
    const body = ({ email, password, name } = req.body);
    const newUser = await User.create(body);
    const token = signToken(newUser);
    res.status(201).json({
      status: "success",
      token,
      data: {
        newUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(500).json({
      status: "fail",
      message: "Email or Password invalid",
    });
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    res.status(401).json({
      status: "fail",

      message: "Incorrect email or password",
    });
  }
  const token = signToken(user);
  res.status(200).json({
    status: "success",
    token,
  });
};

exports.protect = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization;
  }
  if (!token) {
    res.status(401).json({
      status: "fail",
      message: "You don't have access to the site. Please log in",
    });
  }
  next();
};

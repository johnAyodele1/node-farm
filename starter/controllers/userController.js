const User = require("../models/userModel");
const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const sendEmail = require("./../utils/email.js");

const signToken = (id) => {
  return jwt.sign({ id: id._id }, "my-ultra-safe-password", {
    expiresIn: "10h",
  });
};

const fliterOj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
const reqResponse = (user, status, msg, res) => {
  const token = signToken(user);
  res.status(status).json({
    status: "success",
    message: msg,
    token,
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
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new Error("Email and Password required");
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new Error("Email or Password invalid");
    }
    const token = signToken(user);
    res.status(200).json({
      status: "success",
      token,
    });
  } catch (err) {
    res.status(401).json({
      status: "fail",
      message: err.message,
    });
  }
};
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new Error("Email and Password required for verification");
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("No User found");
    if (!(await user.correctPassword(password, user.password)))
      throw new Error("Incorrect Email or Password");
    const verifyToken = await user.verifyEmail();
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/verifyemail/${verifyToken}`;
    const message = `You are receiving this email because you (or someone else) have requested a verification for your account.\n\nPlease click on the following link to verify your account:\n\n${resetUrl}\n\n`;
    await sendEmail({
      to: email,
      subject: "Verification Notification",
      text: message,
    });
    if (!user) {
      throw new Error("Invalid or expired token");
    }
    res.status(200).json({
      status: "success",
      message: "Verification Email sent",
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      throw new Error(
        "You don't have access to the site. Please login to have access"
      );
    }
    const decoded = await promisify(jwt.verify)(
      token,
      "my-ultra-safe-password"
    );

    const decodedUser = await User.findById(decoded.id);
    if (!decodedUser) {
      throw new Error("The user with this account no longer exist");
    }
    // console.log(decoded, decodedUser);
    if (await decodedUser.changedPassword(decoded.iat)) {
      throw new Error("The password has been changed. Please, login again.");
    }

    req.user = decodedUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: "fail",
      message: err.message,
    });
  }
};
exports.updateUser = async (req, res, next) => {
  try {
    if (req.body.password || req.body.passwordConfirm) {
      throw new Error("This route is not for password update");
    }
    const updates = ({ name, email } = req.body);
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new Error("No user found");
    }
    console.log(user);
    const fliterObj = fliterOj(req.body, "name", "email");
    const updatedUser = await User.findByIdAndUpdate(req.user.id, fliterObj, {
      new: true,
      runValidators: true,
    });
    console.log(updatedUser);
    res.status(200).json({
      status: "success",
      data: {
        updatedUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to perform this action",
      });
    }
    next();
  };
};
exports.forgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) {
      throw new Error("No email provided!");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("No user with this email");
    }
    // Generate reset token and set expiration
    const resetToken = await user.resetToken();
    console.log(resetToken);
    // Save the reset token and expiration time
    try {
      await user.save({ validateBeforeSave: false });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: "fail",
        message: "Failed to save user. Please try again later.",
      });
    }
    // Generate the reset URL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) have requested a password reset for your account. The link is only valid for ten minutes.\n\nPlease click on the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;
    // Send the reset password email
    await sendEmail({
      to: email,
      subject: "Password Reset",
      text: message,
    });

    res.status(200).json({
      status: "success",
      message: "Reset password email sent",
    });
  } catch (err) {
    // Log the error and send a response
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    if (!req.params.token) {
      throw new Error("No token provided!");
    }
    const resetToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    passwordResetToken = resetToken;
    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpiresAt: { $gt: Date.now() },
    });
    console.log(user, passwordResetToken);
    if (!user) {
      throw new Error("Expired or Invalid Token");
    }
    // Set the new password
    if (!req.body.password || !req.body.passwordConfirm) {
      throw new Error("Please provide a new password and confirm it");
    }
    if (req.body.password !== req.body.passwordConfirm) {
      throw new Error("Passwords do not match");
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    // Remove the reset token and expiration time
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    const token = signToken(user);
    res.status(201).json({
      status: "success",
      token,
      message: "Password changed successfully",
    });

    const length = req.body.password.length;

    const sentPassword = req.body.password
      .slice(0, length / 2)
      .padEnd(length, "*");

    // Send a reset password email to the user with the new password
    const message = `Your password has been changed. Please use this new password to log in: ${sentPassword}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset Successful",
      text: message,
    });

    // Set the new password
  } catch (err) {
    // Log the error and send a response
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: `${err.message}. Please try again later.`,
    });
  }
};
exports.updatePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new Error("Email and Password required to update pasword.");
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("Email or Password invalid");
    try {
      if (!(await user.correctPassword(password, user.password)))
        throw new Error("Email or Password not correct");
    } catch (err) {
      throw err;
    }
    if (!req.body.newPassword) throw new Error("Provide new password");
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPassword;
    await user.save();

    // Send a reset password email to the user with the new password
    const length = req.body.newPassword.length;
    const sentPassword = req.body.newPassword
      .slice(length / 2)
      .padStart(length, "*");
    const message = `Your password has been changed. Please use this new password to log in: ${sentPassword}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset Successful",
      text: message,
    });
    reqResponse(user, 202, message, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

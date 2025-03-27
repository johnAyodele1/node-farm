const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { console } = require("inspector");
const { verifyEmail } = require("../controllers/userController");
// name, email, password, photo, passwordConfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A User must have a name"],
  },
  email: {
    type: String,
    required: [true, "A user must enter a valid email"],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "A User must have a passsword"],
    minlength: 8,
    select: false,
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "admin", "lead guide", "guide"],
    default: "user",
  },
  passwordChangedAt: Date,
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (passwordConfirm) {
        return passwordConfirm === this.password;
      },
      message: "Passwords must match",
    },
  },
  passwordResetToken: String,
  emailVerified: {
    type: Boolean,
    default: false,
  },
  passwordResetExpiresAt: Date,
  verifyEmailToken: String,
  active: {
    type: Boolean,
    default: false,
    select: false,
  },
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});
userSchema.pre("save", async function (next) {
  // only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // remove passwordConfirm field to reduce data size in the database
  next();
});
userSchema.methods.verifyEmail = async function () {
  const verifyToken = crypto.randomBytes(32).toString("hex");
  this.verifyEmailToken = verifyToken;
  return verifyToken;
};

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPassword = async function (JWTtimeStamp) {
  // Check if the JWT timestamp is older than the passwordChangedAt timestamp.
  if (this.passwordChangedAt) {
    const parsedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(parsedTime, JWTtimeStamp);
    return (await JWTtimeStamp) < parsedTime;
  }
  if (!this.passwordChangedAt) {
    return false;
  }
};
userSchema.methods.resetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // Set the token expiration time to 10 minutes from now.
  this.passwordResetExpiresAt = Date.now() + 600000; // 10 minutes
  console.log(this.passwordResetToken, this.passwordResetExpiresAt);
  return resetToken;
};
const User = mongoose.model("User", userSchema);
module.exports = User;

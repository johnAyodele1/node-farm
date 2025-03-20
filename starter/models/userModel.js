const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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
});
userSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // remove passwordConfirm field to reduce data size in the database
  next();
});
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
const User = mongoose.model("User", userSchema);
module.exports = User;

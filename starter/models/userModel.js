const mongoose = require("mongoose");
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
  },
  photo: String,
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  tries: {
    type: Number,
    default: 3,
  },
  status: {
    type: String,
    default: "ENABLED",
  },
  authCode: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("User", UserSchema);

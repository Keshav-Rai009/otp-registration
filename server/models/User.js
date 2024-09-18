// models/User.js
const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: false }, // Unique email for each user
  phone: { type: String, unique: true, sparse: false }, // Unique phone for each user
  emailVerified: { type: Boolean, default: false }, // Email verification status
  phoneVerified: { type: Boolean, default: false }, // Phone verification status
  phoneOtp: String, // OTP for phone verification
  emailOtp: String, // OTP for email verification
  phoneOtpExpiration: Date, // Expiration time for phone OTP
  emailOtpExpiration: Date, // Expiration time for email OTP
});

module.exports = mongoose.model("Users", usersSchema);

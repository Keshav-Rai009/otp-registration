// routes/auth.js
const express = require("express");
const { sendOtp, verifyOtp } = require("../controllers/otpGenerator");

const router = express.Router();

// Route to send OTP to phone and email
router.post("/send-otp", sendOtp);

// Route to verify OTP for phone or email
router.post("/verify-otp", verifyOtp);

module.exports = router;

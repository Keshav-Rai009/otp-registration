const User = require("../models/User");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const { Vonage } = require("@vonage/server-sdk");
require("dotenv").config();

const CLICK_SEND_API_USERNAME = process.env.CLICK_SEND_API_USERNAME;
const CLICK_SEND_API_KEY = process.env.CLICK_SEND_API_KEY;

// Helper function to generate OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const setOtpExpiration = () => new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

const updateUser = async (
  email,
  phone,
  phoneOtp,
  emailOtp,
  phoneOtpExpiration,
  emailOtpExpiration
) => {
  try {
    // Find user by email or phone
    const user = await User.findOneAndUpdate(
      { $or: [{ email }, { phone }] }, // Match by either email or phone
      {
        email,
        phone,
        phoneOtp, // Update or set phone OTP
        emailOtp, // Update or set email OTP
        phoneOtpExpiration, // Set expiration for phone OTP
        emailOtpExpiration, // Set expiration for email OTP
        phoneVerified: false,
        emailVerified: false,
      },
      { upsert: true, new: true } // Upsert: Create if it doesn't exist
    );
    //console.log("User updated:", user);
  } catch (error) {
    console.error("Error updating user OTPs:", error);
  }
};

// Function to send OTP via SMS using ClickSend API
const sendSmsOtp = async (phone, otp) => {
  const url = "https://rest.clicksend.com/v3/sms/send";
  const payload = {
    messages: [
      {
        source: "nodejs",
        from: "1Fi", // Your sender ID or phone number
        to: phone,
        body: `Your OTP code for verifying your 1Fi account is ${otp}. This code is valid for the next 5 minutes. Please use it to complete your verification process.`,
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            CLICK_SEND_API_USERNAME + ":" + CLICK_SEND_API_KEY
          ).toString("base64"),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("SMS sent successfully:", data);
    } else {
      console.error("Error sending SMS:", data);
      throw new Error("Failed to send SMS");
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send SMS");
  }
};

// Function to send OTP via Email
const sendEmailOtp = async (email, otp) => {
  // Create the transporter with SMTP2GO credentials
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USERNAME, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD, // Your generated app password
    },
  });

  const mailOptions = {
    from: "Keshav Rai <keshav.rai@sap.com",
    to: email,
    subject: "Your Email OTP Code",
    text: `Your OTP code for verifying your 1Fi account is ${otp}. This code is valid for the next 5 minutes. Please use it to complete your verification process.`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// Generate and Send OTP for both email and phone
exports.sendOtp = async (req, res) => {
  const { email, phone } = req.body;
  console.log(email, phone);
  const phoneOtp = generateOtp();
  const emailOtp = generateOtp();
  const otpExpiration = setOtpExpiration();

  try {
    // Store OTP in the database for phone or email
    let user,
      phoneOtpSend = false,
      emailOtpSend = false;
    if (phone && email) {
      //await User.deleteMany({ $or: [{ email: null }, { phone: null }] });
      await updateUser(
        email,
        phone,
        phoneOtp,
        emailOtp,
        otpExpiration,
        otpExpiration
      );
      // Send OTP via SMS

      //await sendSmsOtp(phone, phoneOtp);
      phoneOtpSend = true;

      // Send OTP via Email
      await sendEmailOtp(email, emailOtp);
      emailOtpSend = true;
    } else {
      res.status(400).json({
        success: false,
        message: "Missing phone/email",
      });
    }
    //console.log(phoneOtpSend, emailOtpSend);
    if (phoneOtpSend && emailOtpSend) {
      res.status(200).json({
        success: true,
        message: `OTP sent to email ${email} and phone ${phone}`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send OTP",
        error: "Internal error",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const { phone, email, phoneOtp, emailOtp } = req.body;
  console.log(phone, email, phoneOtp, emailOtp);

  try {
    const now = new Date();
    let user;

    // Verify OTP for phone
    if (phone && phoneOtp) {
      user = await User.findOne({ phone });
      if (user && user.phoneOtp === phoneOtp && user.phoneOtpExpiration > now) {
        user.phoneVerified = true;
        await user.save();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired phone OTP",
        });
      }
    }

    // Verify OTP for email
    if (email && emailOtp) {
      user = await User.findOne({ email });
      if (user && user.emailOtp === emailOtp && user.emailOtpExpiration > now) {
        user.emailVerified = true;
        await user.save();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired email OTP",
        });
      }
    }

    // Check if both OTPs have been verified
    if (user && user.phoneVerified && user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: "Both Phone and Email OTPs verified successfully",
      });
    } else if (user) {
      return res.status(200).json({
        success: true,
        message: "OTP(s) verified successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    // Only send error response if no response has been sent
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify OTP",
        error: error.message,
      });
    }
  }
};

import React, { useState, useEffect } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";

function SendOtp({ onOtpSent }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [otpText, setOtpText] = useState("");
  const [otpBtnText, setOtpBtnText] = useState("Send OTP");
  const [disableButton, setDisableButton] = useState(true);

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://otp-registration-oxly.vercel.app"
      : "http://localhost:3000";

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Phone validation regex (10 digits)
  const phoneRegex = /^[0-9]{12}$/;

  useEffect(() => {
    if (!phoneError && !emailError && phone && email) {
      setDisableButton(false);
    }
  }, [phone, email, phoneError, emailError]);

  const handlePhone = (phone) => {
    setPhone(phone);
    // Phone number validation
    if (!phoneRegex.test(phone)) {
      setPhoneError(true); // Set phone error if invalid
    } else {
      setPhoneError(false); // Reset phone error if valid
    }
  };

  const handleEmail = (email) => {
    setEmail(email);
    // Email validation
    if (!emailRegex.test(email)) {
      setEmailError(true); // Set email error if invalid
    } else {
      setEmailError(false); // Reset email error if valid
    }
  };

  const handleSendOtp = async () => {
    // set India by default
    if (phone.length === 10) {
      setPhone("91" + phone);
    }
    try {
      setOtpText("Sending OTPs. Please wait...");
      const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, phone }),
      });
      const data = await response.json();
      if (data?.success) {
        setOtpBtnText("Resend OTP");
        setOtpText("OTPs sent successfully! Verify using the next screen.");
        onOtpSent({ email, phone });
      }
      alert(data.message);
    } catch (error) {
      alert(error);
    }
  };

  return (
    <Box sx={{ width: 400, margin: "auto", mt: 5 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ padding: "1rem", textAlign: "center" }}
      >
        Register with 1Fi
      </Typography>

      {/* Phone Input with Validation */}
      <TextField
        label="Enter Phone"
        variant="outlined"
        fullWidth
        value={phone}
        onChange={(e) => handlePhone(e.target.value)}
        error={phoneError} // Triggers red border if error is true
        helperText={
          phoneError
            ? "Please enter a valid 10-digit phone number with country code"
            : ""
        } // Error message
        sx={{ mb: 2 }}
      />

      {/* Email Input with Validation */}
      <TextField
        label="Enter Email"
        variant="outlined"
        fullWidth
        value={email}
        onChange={(e) => handleEmail(e.target.value)}
        error={emailError} // Triggers red border if error is true
        helperText={emailError ? "Please enter a valid email address" : ""} // Error message
        sx={{ mb: 2 }}
      />

      {/* Send OTP Button */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleSendOtp}
        sx={{ mb: 2 }}
        disabled={phoneError || emailError || disableButton}
      >
        {otpBtnText}
      </Button>

      {otpText && (
        <Typography sx={{ textAlign: "center", color: "green" }}>
          {otpText}
        </Typography>
      )}
    </Box>
  );
}

export default SendOtp;

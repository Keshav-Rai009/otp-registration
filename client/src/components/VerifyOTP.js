import React, { useState } from "react";
import { TextField, Button, Box, Typography, Grid } from "@mui/material";

function VerifyOtp({ phone, email }) {
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const [retry, setRetry] = useState(2);
  const [disableResend, setDisableResend] = useState(false);
  const [resendMessage, setResendMessage] = useState({
    message: "",
    visible: false,
  }); // Updated to track visibility
  const [fadeOut, setFadeOut] = useState(false); // For controlling fade-out effect

  const handleVerifyOtp = async () => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, email, phoneOtp, emailOtp }), // Sending both OTPs in the request
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage(data.message);
        setVerified(true);
      } else {
        setVerified(false);
        setStatusMessage(data.message || "Failed to verify OTPs");
      }
    } catch (error) {
      setVerified(false);
      setStatusMessage("Error verifying OTPs: " + error.message);
    }
  };

  const handleResendOtp = async () => {
    setDisableResend(true);
    setStatusMessage("");
    setRetry((prev) => prev - 1);
    if (!retry) {
      setDisableResend(true);
      setResendMessage({
        message: "Max attempts reached. Please try after some time.",
        visible: true,
      });
    }

    setResendMessage({
      message: "Resending OTPs. Please wait...",
      visible: true,
    });
    setFadeOut(false); // Reset fade-out state
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, email }),
      });

      const data = await response.json();
      if (data.success) {
        setResendMessage({
          message: data.message || "OTP resent successfully.",
          visible: true,
        });
      } else {
        setResendMessage({ message: "Failed to resend OTPs.", visible: true });
      }

      setTimeout(() => {
        setDisableResend(false);
      }, 10000);

      // Set timeout for fade-out effect
      setTimeout(() => {
        setFadeOut(true); // Trigger fade-out
        setTimeout(() => {
          setResendMessage({ message: "", visible: false }); // Hide after fade-out
        }, 500); // Delay to allow the fade-out transition
      }, 5000); // Show for 5 seconds
    } catch (error) {
      setResendMessage({
        message: "Error resending OTPs: " + error.message,
        visible: true,
      });
    }
  };

  return (
    <Box sx={{ width: 400, margin: "auto", mt: 5 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ textAlign: "center", padding: "1rem" }}
      >
        Verify OTP
      </Typography>

      {/* Phone OTP Input */}
      <TextField
        label="Phone OTP"
        variant="outlined"
        fullWidth
        value={phoneOtp}
        onChange={(e) => setPhoneOtp(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Email OTP Input */}
      <TextField
        label="Email OTP"
        variant="outlined"
        fullWidth
        value={emailOtp}
        onChange={(e) => setEmailOtp(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Verify OTP Button */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleVerifyOtp}
            disabled={!phoneOtp || !emailOtp}
          >
            Verify OTP
          </Button>
        </Grid>

        {/* Resend OTP Button */}
        <Grid item xs={6}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={handleResendOtp}
            disabled={disableResend}
          >
            Resend OTP
          </Button>
        </Grid>
      </Grid>

      {/* Status Messages */}
      {statusMessage && (
        <Typography
          sx={{ mt: 2, color: verified ? "green" : "red", textAlign: "center" }}
        >
          {statusMessage}
        </Typography>
      )}
      {/* Resend message with transition */}
      {resendMessage.visible && (
        <Typography
          sx={{
            mt: 2,
            opacity: fadeOut ? 0 : 1, // Control opacity
            transition: "opacity 1s ease-in-out", // Smooth fade transition
            color: "green",
            textAlign: "center",
          }}
        >
          {resendMessage.message}
        </Typography>
      )}
    </Box>
  );
}

export default VerifyOtp;

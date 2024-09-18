// server.js
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const cors = require("cors");
const PORT = process.env.PORT;

const app = express();
app.use(cors());
app.use(bodyParser.json()); // Middleware

mongoose
  .connect("mongodb://localhost:27017/OTP", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Failed to connect to MongoDB:", err));

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log("Server running on http://localhost:5000");
});

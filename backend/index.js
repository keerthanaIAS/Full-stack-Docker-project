const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Mongo connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("Backend running inside Docker 🚀");
});

// Sample API
app.get("/users", (req, res) => {
  res.json([{ id: 1, name: "Docker User" }]);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
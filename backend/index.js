const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const fs = require('fs')

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

app.post('/upload', (req, res) => {
  const file = req.files.image;
  file.mv('/app/uploads/' + file.name);  // Saves to shared volume
});

app.use((req, res, next) => {
  fs.appendFileSync('/app/logs/backend.log', `${Date.now()}: ${req.url}\n`);
  next();
});

fs.writeFileSync('/app/cache/users.json', JSON.stringify(users));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
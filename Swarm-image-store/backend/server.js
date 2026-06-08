const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Backend Version 2");
});

app.listen(5000, () => {
  console.log("Backend running on 5000");
});
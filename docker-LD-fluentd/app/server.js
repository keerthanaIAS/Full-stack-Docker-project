const express = require('express');
const app = express();
const PORT = 3000;

// Simple counter to generate different logs
let visitCount = 0;

// Home page
app.get('/', (req, res) => {
  visitCount++;
  console.log(`[INFO] Home page visited (Count: ${visitCount})`);
  res.send(`Hello! Visit count: ${visitCount}`);
});

// Simulate error
app.get('/error', (req, res) => {
  console.error(`[ERROR] Something went wrong at ${new Date().toISOString()}`);
  res.status(500).send('Error occurred');
});

// Simulate user action
app.get('/user/:name', (req, res) => {
  const name = req.params.name;
  console.log(`[INFO] User ${name} accessed the app`);
  res.send(`Welcome ${name}!`);
});

// Generate logs every 10 seconds (simulate activity)
setInterval(() => {
  console.log(`[INFO] Heartbeat - Server running fine`);
}, 10000);

app.listen(PORT, () => {
  console.log(`[STARTUP] App running on port ${PORT}`);
  console.log(`[STARTUP] Fluentd will capture all these logs!`);
});
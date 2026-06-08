const express = require('express');
const app = express();
const port = 3000;

const instance = process.env.HOSTNAME || 'unknown';

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Docker Swarm!',
    instance: instance,
    time: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', instance: instance });
});

app.listen(port, () => {
  console.log(`Instance ${instance} running on port ${port}`);
});
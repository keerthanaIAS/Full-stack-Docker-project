const express = require('express');
const app = express();
const PORT = 3000;

let orderCount = 0;
let errorCount = 0;

// Generate structured logs (Graylog loves structured data!)

// Home page
app.get('/', (req, res) => {
  console.log(JSON.stringify({
    action: 'home_visit',
    page: 'home',
    timestamp: new Date().toISOString()
  }));
  res.send('Welcome to Shop! Try /order or /error');
});

// Simulate order
app.get('/order', (req, res) => {
  orderCount++;
  const order = {
    order_id: orderCount,
    amount: Math.floor(Math.random() * 100) + 1,
    user: 'customer_' + orderCount,
    action: 'order_placed'
  };
  console.log(JSON.stringify(order));
  res.json(order);
});

// Simulate payment
app.get('/payment', (req, res) => {
  const success = Math.random() > 0.3; // 70% success rate
  
  if (success) {
    console.log(JSON.stringify({
      action: 'payment_success',
      amount: 50,
      gateway: 'stripe',
      duration_ms: Math.floor(Math.random() * 500)
    }));
    res.send('Payment successful!');
  } else {
    console.error(JSON.stringify({
      action: 'payment_failed',
      reason: 'card_declined',
      amount: 50,
      severity: 'high'
    }));
    res.status(402).send('Payment failed!');
  }
});

// Simulate errors
app.get('/error', (req, res) => {
  errorCount++;
  console.error(JSON.stringify({
    action: 'system_error',
    error_type: 'database_timeout',
    error_count: errorCount,
    stack: 'Connection timeout after 30s',
    severity: 'critical'
  }));
  res.status(500).send('Error occurred!');
});

// Simulate user login
app.get('/login/:user', (req, res) => {
  const user = req.params.user;
  console.log(JSON.stringify({
    action: 'user_login',
    username: user,
    ip: req.ip,
    browser: req.headers['user-agent']?.substring(0, 50)
  }));
  res.send(`Welcome ${user}!`);
});

// Auto-generate traffic every 10 seconds
setInterval(() => {
  const actions = ['/order', '/payment', '/login/user' + Math.floor(Math.random() * 100)];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  console.log(JSON.stringify({
    action: 'auto_traffic',
    endpoint: randomAction,
    health: 'ok'
  }));
}, 10000);

app.listen(PORT, () => {
  console.log(JSON.stringify({
    action: 'server_start',
    port: PORT,
    env: 'production',
    version: '1.0.0'
  }));
});
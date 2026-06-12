const express = require('express');
const client = require('prom-client'); // Prometheus client library for Node.js

// without `prom-client` you can't see metrics.

// Why?
// Prometheus ONLY understands a specific format:
// # Without prom-client - Your app returns:
// "Hello World"  ← Prometheus can't read this

// # With prom-client - /metrics endpoint returns:
// http_requests_total{method="GET"} 42
// http_request_duration_seconds_count 150
// ← Prometheus understands this format

// Simple Analogy:
// Prometheus = Only reads French
// Your app = Speaks English
// prom-client = Translator (English → French)

// What prom-client does:
// - Counts requests automatically
// - Measures response time
// - Formats numbers in Prometheus-readable format
// - Exposes `/metrics` endpoint

// Without it:
// You'd have to manually write this format yourself:javascript
// app.get('/metrics', (req, res) => {
//   res.send(`
//     http_requests_total 42
//     http_errors_total 5
//     cpu_usage_percent 67.3
//   `);
// });

// `prom-client` just makes it easier - automatically counts, measures, and formats everything correctly.

const app = express();
const PORT = 3000;

// Create metrics
const httpRequests = new client.Counter({  // Counter for total HTTP requests
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'endpoint']
});

const requestDuration = new client.Histogram({ // Histogram for request duration
  name: 'http_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['method', 'endpoint']
});

// Expose metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Home page with metrics tracking
app.get('/', (req, res) => {
  const start = Date.now();
  httpRequests.inc({ method: 'GET', endpoint: '/' });
  res.send('Hello Prometheus!');
  requestDuration.observe({ method: 'GET', endpoint: '/' }, (Date.now() - start) / 1000);
});

// API endpoint
app.get('/api/data', (req, res) => {
  const start = Date.now();
  httpRequests.inc({ method: 'GET', endpoint: '/api/data' });
  res.json({ status: 'ok', timestamp: new Date() });
  requestDuration.observe({ method: 'GET', endpoint: '/api/data' }, (Date.now() - start) / 1000);
});

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
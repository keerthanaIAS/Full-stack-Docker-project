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
app.get('/metrics', async (req, res) => { // Prometheus scrapes this endpoint to collect metrics
  res.set('Content-Type', client.register.contentType); // Set content type to Prometheus format
  res.end(await client.register.metrics()); // Return all metrics in Prometheus format
});

// Home page with metrics tracking
app.get('/', (req, res) => {
  const start = Date.now();
  httpRequests.inc({ method: 'GET', endpoint: '/' }); // Increment request count for this endpoint 
  // Counter goes: 0 → 1 → 2 → 3 → 4 ...
//   Requests
//    ↑
// 10 │        ●
//  8 │      ●
//  6 │    ●
//  4 │  ●
//  2 │●
//  0 └──────────→ Time
//     Each dot = someone visited your grafna page 
// Without .inc() → Graph stays at 0 forever. Each .inc() adds +1 to the counter, creating the upward graph you see in Grafana!
  res.send('Hello Prometheus!');
  requestDuration.observe({ method: 'GET', endpoint: '/' }, (Date.now() - start) / 1000); // Observe request duration in seconds
  // Example: (10:00:00.150 - 10:00:00.000) / 1000 = 0.150 seconds
//   Response Time (seconds)
//    ↑
// 0.5│     ● (slow request)
// 0.3│   ●
// 0.2│ ●   ●
// 0.1│●       ●  ● (most are fast)
//    └──────────────────→ Time
});

// API endpoint
app.get('/api/data', (req, res) => {
  const start = Date.now();
  httpRequests.inc({ method: 'GET', endpoint: '/api/data' });
  res.json({ status: 'ok', timestamp: new Date() });
  requestDuration.observe({ method: 'GET', endpoint: '/api/data' }, (Date.now() - start) / 1000);
});

setInterval(() => {
  console.log("Hello Loki");
}, 5000);

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`); // Start the server and listen on the specified port
});

// Why Histogram (not Counter)?
// Counter: just counts (1, 2, 3, 4...)
// httpRequests.inc()  // "5 requests happened"

// Histogram: records values (0.1s, 0.5s, 0.05s...)
// requestDuration.observe(0.15)  // "One request took 0.15 seconds"

// Histogram lets you calculate:
// - Average: 0.2s
// - Slowest 5%: > 1s  
// - Fastest: 0.01s

// Simple: .inc() = "+1 to counter" (graph goes up), .observe(value) = "record this number" (shows distribution of response times).


## Prometheus in Docker - Simple Monitoring Setup

### What is Prometheus?
**Prometheus = Time-series database that scrapes metrics (CPU, memory, requests) from your apps and containers.**

```
Your App → Exposes /metrics endpoint → Prometheus scrapes every 15s → Grafana visualizes
```

## Step-by-Step

```bash
# 1. Create project

# 2. Create all files

# 3. Start
docker-compose up -d

# 4. Generate load
for i in {1..50}; do
  curl http://localhost:3000/
  curl http://localhost:3000/api/data
  sleep 0.5
done

# 5. Check metrics
curl http://localhost:3000/metrics

# 6. Open tools
open http://localhost:9090    # Prometheus UI
open http://localhost:3001    # Grafana
```

---

## What You'll See

### Prometheus UI (localhost:9090):
- Search: `http_requests_total`
- Search: `http_request_duration_seconds`
- Search: `rate(http_requests_total[1m])`

### Grafana (localhost:3001):
- Add Prometheus datasource: `http://prometheus:9090`
- Create dashboard with graphs

---

## Flow Diagram
```
App (port 3000)
  ↓ exposes /metrics
Prometheus (port 9090)
  ↓ scrapes every 15s
  ↓ stores time-series data
Grafana (port 3001)
  ↓ queries Prometheus
  ↓ shows beautiful dashboards
```

**That's Prometheus - scrapes metrics from apps, stores numbers over time, Grafana makes it visual!**

## prometheus deep steps in grafana:-
------------------------------------

## Add Prometheus Datasource in Grafana

### Steps:

1. **Login** (if not auto-login):
   - Username: `admin`
   - Password: `admin`
   - new password: `admin123` -> i created

2. **Go to Connections → Data sources:**
   - Click hamburger menu (☰ top left)
   - Click **Connections** → **Data sources**

3. **Add Prometheus:**
   - Click blue **"Add data source"** button
   - Select **Prometheus**
   - In URL field: `http://prometheus:9090`
   - Scroll down, click **"Save & test"**
   - Should show green: ✅ "Data source is working"

4. **Create Dashboard:**
   - Click ☰ → **Dashboards**
   - Click **New** → **New Dashboard**
   - Click **"Add visualization"**
   - Select **Prometheus** datasource
   - In query field type: `http_requests_total`
   - Click **Run queries** (top right)
   - Click **Save** → Give name → **Save**

### Quick Video Steps:
```
☰ Menu → Connections → Data Sources → Add data source → Prometheus
→ URL: http://prometheus:9090 → Save & test
→ ☰ Dashboards → New → Add visualization → Select Prometheus
→ Type query → Run queries → Save
```

**That's it! You'll see graphs of your app metrics.**


*now we are using prometheus inteaded of using fluentd logger driver and loki plugin right?*                                --------> *stupid question*
**No, they solve different problems:**

- **Prometheus** = Monitors **METRICS** (CPU, memory, request count, response time - NUMBERS)
- **Fluentd + Loki** = Collects **LOGS** (error messages, user actions, debug info - TEXT)

**Both are needed:**
```
Prometheus tells you: "Error rate is high at 50 errors/second" (WHAT happened)
Logs tell you: "Failed to connect to database at 10:30:45" (WHY it happened)
```

**Simple analogy:** Prometheus is your heart rate monitor (numbers), logs are your diary (text describing events).

>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                General Notes
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

1. cAdvisor (Container Metrics)
2. Node Exporter (Host Metrics)

# Add Alerts in Grafana
Go to Alerting → Alert rules → New alert rule
Query: rate(http_requests_total[5m]) > 10
Set notification (email, Slack, etc.)

# understand the difference clearly:
Application Metrics -> Prometheus Client in Node.js
Container Metrics   -> cAdvisor
Host Metrics        -> Node Exporter
Visualization       -> Grafana
Logs                -> Loki
Alerts              -> Alertmanager

# Verify Prometheus
Open:
http://localhost:9090/targets

Expected:
node-app    UP
cadvisor    UP

# cadvice -> grafna graph check command
# Create Dashboard Panels
# Create a dashboard and try these queries.
Container CPU
* rate(container_cpu_usage_seconds_total[1m])
Container Memory
* container_memory_usage_bytes
Container Network Receive
* rate(container_network_receive_bytes_total[1m])
Container Network Transmit
* rate(container_network_transmit_bytes_total[1m])

#### ! Network prometheus-demo_default  Resource is still in use , what i have to do for stop

# 1. See what's using the network
docker network inspect prometheus-demo_default

# 2. Stop ALL containers using it
docker-compose down

# 3. If still stuck, force remove containers
docker ps -a
docker stop $(docker ps -aq)    # Stop all containers
docker rm $(docker ps -aq)      # Remove all containers

# 4. Remove the network manually
docker network rm prometheus-demo_default

# 5. Prune unused networks
docker network prune

# 6. Now restart fresh
docker-compose up -d

*or one line*
docker-compose down --remove-orphans


#### why loki:3001 not wokring this is working loki-url: "http://host.docker.internal:3100/loki/api/v1/push" can u say in one line.      --->*questin*

## In one line:

The Docker Loki logging plugin runs outside the Docker Compose network, so it cannot resolve loki:3100, but it can reach host.docker.internal:3100, which points to your Docker host.

# For interviews:

Containers can use service names like loki, but Docker plugins/logging drivers often need host.docker.internal because they run at the Docker daemon level, not inside the Compose network.


# if prometheus dont show the label means steps to follow:                                                      ----->*important fix*
Prometheus queries are case-sensitive and need EXACT metric names.

keerthana@Keerthanas-MacBook-Air prometheus-demo % curl http://localhost:3000/metrics
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter

# HELP http_request_duration_seconds Request duration in seconds
# TYPE http_request_duration_seconds histogram
keerthana@Keerthanas-MacBook-Air prometheus-demo % for i in {1..10}; do curl http://localhost:3000/; done
Hello Prometheus!Hello Prometheus!Hello Prometheus!Hello Prometheus!Hello Prometheus!Hello Prometheus!Hello Prometheus!Hello Prometheus!Hello Prometheus!Hello Prometheus!%   
*now u can see the http_request_total option*
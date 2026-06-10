## Docker Swarm's built-in features provide:
✅ Manual scaling
✅ Self-healing (auto-restart failed containers)
✅ Load balancing across replicas
❌ Automatic scaling based on metrics (needs external tools)

*auto-scaling using external tools:* -> Prometheus + Docker Swarm Autoscaler

## Line-by-Line Explanation:
---------------------------
# version: '3.8'
Specifies Docker Compose file format version. '3.8' supports all Swarm deployment features.

# services:
Root level that defines all containers/services in your application.

#  web-app:
Your service name. This is how Docker references this service internally.

# image: nginx:latest
The Docker image to use. Replace with your application image.

# ports:
      - "80:80"
Maps host port 80 to container port 80. Format: "host:container".

# deploy:
Swarm-specific deployment configuration. Only works with docker stack deploy, not docker-compose up.

# mode: replicated
Creates multiple identical containers across Swarm nodes. Alternative is global (one per node).

# replicas: 2
Initial number of container instances to run. This is what you manually scale up/down.

# resources:
Defines CPU and memory constraints for each container.

# limits:
          cpus: '0.50'
          memory: 256M
Maximum resources a container can use. '0.50' = half CPU core. 256M = 256 megabytes memory.

# reservations:
          cpus: '0.25'
          memory: 128M
Minimum resources guaranteed for each container. Docker scheduler uses this for placement.

# restart_policy:
        condition: on-failure
Auto-restart containers only if they fail/crash. Other options: none, any.

## Line-by-Line Explanation:
----------------------------
Auto-scaling Labels:
--------------------
labels:
#        - "swarm.autoscaler=true"
Tells the autoscaler this service should be auto-scaled.

#        - "swarm.autoscaler.minimum=2"
Never go below 2 replicas even if load is low.

#        - "swarm.autoscaler.maximum=10"
Never exceed 10 replicas even if load is high.

#        - "swarm.autoscaler.cpu.threshold=0.7"
Scale up when CPU exceeds 70% across replicas.

#        - "swarm.autoscaler.memory.threshold=0.8"
Scale up when memory exceeds 80% across replicas.

Prometheus Service:
------------------
#  prometheus:
    image: prom/prometheus:latest
Monitoring system that collects metrics from all containers.

#  placement:
        constraints:
          - node.role == manager
Runs only on manager node for centralized monitoring.

#  configs:
      - source: prometheus_config
        target: /etc/prometheus/prometheus.yml
Injects Prometheus configuration from Docker config system.

Cadvisor Service:
-----------------
#  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
Collects CPU, memory, network metrics from each container.

#   mode: global
Runs one instance on EVERY node in the swarm. This ensures complete monitoring coverage.

#   volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
Mounts Docker socket read-only to access container statistics.

Node Exporter:
--------------
#  node-exporter:
    image: prom/node-exporter:latest
Collects host-level metrics (CPU, memory, disk) from each node.

Autoscaler Service:
------------------
#  autoscaler:
    image: registry.gitlab.com/simon.erridge/docker-swarm-autoscaler:latest
The actual auto-scaling engine that makes scaling decisions.

#  volumes:
      - /var/run/docker.sock:/var/run/docker.sock
Needs Docker socket access to execute scale commands.

#  environment:
      - PROMETHEUS_URL=http://prometheus:9090
Where to query for metrics.

# - CHECK_INTERVAL=30
How often (seconds) to check if scaling is needed.

# - SCALE_UP_COOLDOWN=60
Wait 60 seconds after scaling up before allowing another scale-up.

# - SCALE_DOWN_COOLDOWN=300
Wait 5 minutes before scaling down to prevent flapping.


## How Auto-Scaling Works (The Flow):
1. cAdvisor collects container CPU/memory usage
2. Prometheus scrapes metrics from cAdvisor every 15 seconds
3. AutoScaler queries Prometheus: "What's the average CPU of web-app?"
4. If CPU > 70%: AutoScaler runs docker service scale myapp_web-app=<current+1>
5. If CPU < 30%: AutoScaler runs docker service scale myapp_web-app=<current-1>
6. AlertManager notifies if thresholds are breached
___________________________________________________________________________


## relying on a third-party autoscaler container that watches metrics and calls:

# What each service does

## 1. web-app

```yaml
deploy:
  replicas: 2
```

Initial state:

```text
web-app.1
web-app.2
```

Running 2 containers.

---

## 2. cAdvisor

```yaml
cadvisor:
  image: gcr.io/cadvisor/cadvisor
```

Purpose:

```text
Read Docker container statistics
```

Collects:

```text
CPU %
Memory %
Network
Disk
```

Without cAdvisor:

```text
Prometheus has no container metrics
```

---

## 3. Prometheus

```yaml
prometheus:
  image: prom/prometheus
```

Purpose:

```text
Store metrics
```

Example:

```text
web-app CPU = 15%
web-app CPU = 25%
web-app CPU = 82%
```

Prometheus keeps this data.

---

## 4. Alertmanager

Purpose:

```text
React to alerts
```

Example:

```text
CPU > 70%
```

Prometheus:

```text
High CPU detected
```

Alertmanager:

```text
Send notification
```

In this case:

```text
Send webhook to autoscaler
```

---

## 5. Autoscaler

This is the important piece.

Purpose:

```text
Make scaling decision
```

Reads:

```text
Prometheus says CPU=85%
```

Runs:

```bash
docker service scale myapp_web-app=3
```

Swarm creates:

```text
web-app.3
```

Now:

```text
2 replicas
↓
3 replicas
```

---

# Actual Flow

Imagine traffic spikes.

### Before traffic

```text
web-app replicas = 2

CPU = 20%
```

---

### Users arrive

```text
100 users
500 users
1000 users
```

CPU:

```text
85%
```

---

### cAdvisor

Collects:

```text
CPU=85%
```

---

### Prometheus

Stores:

```text
CPU=85%
```

---

### Alertmanager

Rule:

```text
CPU > 70%
```

Triggered.

---

### Autoscaler

Receives alert.

Runs:

```bash
docker service scale myapp_web-app=3
```

---

### Swarm

Creates:

```text
web-app.3
```

Now:

```text
3 replicas
```

Traffic distributed.

---

# Why use these labels?

Example:

```yaml
labels:
  - "swarm.autoscaler.minimum=2"
  - "swarm.autoscaler.maximum=10"
```

Meaning:

```text
Never go below 2
Never go above 10
```

---

If CPU becomes:

```text
95%
```

Autoscaler can do:

```text
2 → 3
3 → 4
4 → 5
```

until:

```text
10 replicas
```

Maximum reached.

---

# Practical Learning Order

Learn in this order:

### Phase 1

Swarm

```bash
docker swarm init
docker stack deploy
docker service scale
```

---

### Phase 2

Prometheus

Run:

```bash
docker run -d -p 9090:9090 prom/prometheus
```

Learn:

```text
Targets
Metrics
Queries
```

---

### Phase 3

cAdvisor

Run:

```bash
docker run \
-d \
-p 8080:8080 \
-v /var/run/docker.sock:/var/run/docker.sock \
gcr.io/cadvisor/cadvisor
```

Learn:

```text
Container CPU
Container Memory
```

---

### Phase 4

Prometheus + cAdvisor

Verify:

```text
Prometheus can see container metrics
```

---

### Phase 5

Alertmanager

Create:

```text
CPU > 70%
```

alert.

---

### Phase 6

Autoscaler

Add the scaling component.

---

## Practical Testing Steps:
Step 1: Initialize Swarm
------------------------
docker swarm init
Step 2: Create Required Config Files
-----------------------------------
Create prometheus.yml:
yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'cadvisor'
    dns_sd_configs:
      - names: ['tasks.cadvisor']
        type: 'A'
        port: 8080

  - job_name: 'node-exporter'
    dns_sd_configs:
      - names: ['tasks.node-exporter']
        type: 'A'
        port: 9100
Create alertmanager.yml:

yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'scale-alerts'

receivers:
  - name: 'scale-alerts'
    webhook_configs:
      - url: 'http://autoscaler:6000/alert'
Step 3: Deploy the Stack
-----------------------
docker stack deploy -c docker-compose.yml myapp  -> -c is creating containers
Step 4: Verify All Services Running
----------------------------------
docker service ls
Expected output should show:

myapp_web-app (2 replicas)

myapp_prometheus (1 replica)

myapp_cadvisor (global - one per node)

myapp_node-exporter (global - one per node)

myapp_alertmanager (1 replica)

myapp_autoscaler (1 replica)

Step 5: Generate Load to Trigger Auto-Scaling
----------------------------------------------
# Install stress testing tool
docker run -d --name load-generator --network host \
  alpine/bombardier -c 100 -d 300s http://localhost:80
This sends 100 concurrent connections for 5 minutes.

Step 6: Watch Auto-Scaling in Action
------------------------------------
# Watch replicas change in real-time
watch -n 2 docker service ls

# Check autoscaler logs
docker service logs myapp_autoscaler --follow

# Monitor CPU usage via Prometheus
# Open browser: http://localhost:9090
# Query: rate(container_cpu_usage_seconds_total{container_label_com_docker_swarm_service_name="myapp_web-app"}[1m])
Step 7: Verify Auto-Scaling Response
------------------------------------
bash
# Before load: Should see 2 replicas
docker service ps myapp_web-app

# During load: Should see replicas increasing
# Wait 1-2 minutes, check again
docker service ps myapp_web-app


## After load stops: Should see replicas decreasing after 5 minutes
docker service ps myapp_web-app
How to See Auto-Scaling Triggers:
bash
# Check Prometheus alerts
curl http://localhost:9090/api/v1/alerts

# Check which services are being auto-scaled
curl http://localhost:9093/api/v1/alerts

# View autoscaler decisions
docker service logs myapp_autoscaler | grep "scaling"
Clean Up:
bash
docker stack rm myapp
docker swarm leave --force

##  Generate load for testing:
bash
# Install Apache Bench (built-in on macOS)
# Send 1000 requests with 10 concurrent users
ab -n 1000 -c 10 http://localhost:80/

# Or use curl in a loop
for i in {1..1000}; do curl -s http://localhost:80/ > /dev/null & done

YMAL:
-----
version: '3.8'

services:
  # Your application service that will auto-scale
  web-app:
    image: nginx:latest
    ports:
      - "80:80"
    deploy:
      mode: replicated
      replicas: 2
      resources:
        limits:
          cpus: '0.50'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
      restart_policy:
        condition: on-failure
      labels:
        - "swarm.autoscaler=true"
        - "swarm.autoscaler.minimum=2"
        - "swarm.autoscaler.maximum=10"
        - "swarm.autoscaler.cpu.threshold=0.7"

  # Prometheus for monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    deploy:
      placement:
        constraints:
          - node.role == manager
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=1h'
    configs:
      - source: prometheus_config
        target: /etc/prometheus/prometheus.yml

  # Cadvisor to collect container metrics
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - "8080:8080"
    deploy:
      mode: global
    command:
      - '--docker_only=true'
      - '--housekeeping_interval=10s'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

  # Simple Autoscaler that works
  autoscaler:
    image: containous/swarm-scaler:latest
    deploy:
      placement:
        constraints:
          - node.role == manager
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - SWARM_SCALER_SERVICE_NAME=myapp_web-app
      - SWARM_SCALER_MIN_REPLICAS=2
      - SWARM_SCALER_MAX_REPLICAS=10
      - SWARM_SCALER_CPU_SCALE_UP_THRESHOLD=0.7
      - SWARM_SCALER_CPU_SCALE_DOWN_THRESHOLD=0.3
      - SWARM_SCALER_PROMETHEUS_URL=http://prometheus:9090
      - SWARM_SCALER_INTERVAL=30s

configs:
  prometheus_config:
    file: ./prometheus.yml


----------------------------------------------------------------------------------------------------------------------------
                                                    AUTOSCALING 
----------------------------------------------------------------------------------------------------------------------------

version: '3.8'

services:
  web-app:
    image: nginx:latest
    ports:
      - "80:80"
    deploy:
      mode: replicated
      replicas: 2
      restart_policy:
        condition: on-failure

  scaler:
    image: docker:cli
    deploy:
      placement:
        constraints:
          - node.role == manager
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    entrypoint: ["/bin/sh"]
    command: ["-c", "while true; do docker service scale myapp_web-app=5; sleep 10; docker service scale myapp_web-app=2; sleep 10; done"]


 => it's scaling based on a time loop, not based on actual load/CPU usage


## What We Built: CPU-Based Auto-Scaling in Docker Swarm

Here's the complete architecture and line-by-line explanation:
-------------------------------------------------------------
## File 1: `scaler.sh` - The Brain

```bash
#!/bin/sh
```
**Why:** Tells the system to use `/bin/sh` to run this script.

---

```bash
echo "=== CPU AutoScaler Started ==="
```
**Why:** Confirms the script actually started running.

---

```bash
SCALE_UP=30
SCALE_DOWN=5
MIN=2
MAX=8
COOLDOWN=20
```
**Why:** These are **configuration parameters** — change them to tune behavior:

*Threshold is the limit value that triggers an action when a metric goes above or below it.*

Example:

SCALE_UP=30 → if CPU goes above 30%, scale up.
SCALE_DOWN=5 → if CPU goes below 5%, scale down.

| Variable | Meaning | Current |
|----------|---------|---------|
| SCALE_UP | CPU% threshold to add replicas | 30% |
| SCALE_DOWN | CPU% threshold to remove replicas | 5% |
| MIN | Minimum replicas (never go below) | 2 |
| MAX | Maximum replicas (never exceed) | 8 |
| COOLDOWN | Seconds to wait between scale actions | 20s |

---

```bash
LAST_SCALE=0
```
**Why:** Tracks when we last scaled. Prevents **oscillation** (scaling up/down too fast).
*Oscillation is when a system repeatedly switches back and forth between states, such as scaling up and then immediately scaling down over and over.*

---

```bash
docker service scale myapp_web-app=2 2>/dev/null
```
**Why:** Ensures we start from a known state (2 replicas). `2>/dev/null` hides error messages.

---

```bash
while true; do
```
**Why:** Infinite loop — the autoscaler runs forever, checking every 10 seconds.

---

### CPU Collection Loop

```bash
  for CID in $(docker ps -q --filter name=myapp_web-app); do
```
**What it does:** Gets container IDs of all running web-app containers.
- `docker ps -q` — quiet mode, only shows container IDs
- `--filter name=myapp_web-app` — only containers matching this name

**Example output:**
```
abc123
def456
```

---

```bash
    CPU_RAW=$(docker stats --no-stream --format '{{.CPUPerc}}' $CID 2>/dev/null)
```
**What it does:** Gets CPU percentage for ONE container.
- `--no-stream` — take one measurement, don't stream continuously
- `--format '{{.CPUPerc}}'` — only show CPU percentage
- `$CID` — container ID from the loop

**Example output:** `12.34%`

---

```bash
    CPU_VAL=$(echo "$CPU_RAW" | sed 's/%//')
```
**What it does:** Removes the `%` sign from `12.34%` → `12.34`

---

```bash
    if [ -n "$CPU_VAL" ]; then
      TOTAL_CPU=$(echo "$TOTAL_CPU + $CPU_VAL" | bc 2>/dev/null)
      CPU_COUNT=$((CPU_COUNT + 1))
    fi
```
**What it does:** 
- Checks if CPU value is not empty (`-n`)
- Adds this container's CPU to running total using `bc` (basic calculator)
- Increments counter

**Example:** Container 1: 12% + Container 2: 8% → TOTAL_CPU=20, CPU_COUNT=2

---

### Calculate Average

```bash
  if [ "$CPU_COUNT" -gt 0 ]; then
    AVG_CPU=$(echo "scale=1; $TOTAL_CPU / $CPU_COUNT" | bc 2>/dev/null)
  else
    AVG_CPU=0
  fi
```
**What it does:** Calculates average CPU across all containers.
- `scale=1` — one decimal place
- Example: 20 / 2 = 10.0%

---

### Get Current Replicas

```bash
  CUR=$(docker service inspect myapp_web-app --format '{{.Spec.Mode.Replicated.Replicas}}' 2>/dev/null)
  if [ -z "$CUR" ]; then CUR=2; fi
```
**What it does:**
- Queries Docker API for current replica count
- `{{.Spec.Mode.Replicated.Replicas}}` — Go template to extract just the replica number
- Falls back to 2 if empty

---

```bash
  TIME_SINCE=$((NOW - LAST_SCALE))
```
**What it does:** How many seconds since last scale action.

---

```bash
  echo "[Replicas: $CUR | CPU: ${AVG_CPU}% | Cooldown: ${TIME_SINCE}s]"
```
**What it does:** Log line showing current state. Example:
```
[Replicas: 3 | CPU: 45.2% | Cooldown: 25s]
```

---

### Decision Logic

```bash
  HIGH=$(echo "$AVG_CPU > $SCALE_UP" | bc 2>/dev/null)
  LOW=$(echo "$AVG_CPU < $SCALE_DOWN" | bc 2>/dev/null)
```
**What it does:** Boolean checks using `bc`.
- `HIGH=1` if CPU > 30%
- `LOW=1` if CPU < 5%

---

```bash
  if [ "$HIGH" = "1" ] && [ "$CUR" -lt "$MAX" ] && [ "$TIME_SINCE" -gt "$COOLDOWN" ]; then
```
**3 conditions to scale UP:**
1. CPU is above threshold (HIGH=1)
2. Current replicas below maximum (CUR < MAX)
3. Enough time has passed since last scale (cooldown)

---

```bash
    NEW=$((CUR + 1))
    docker service scale myapp_web-app=$NEW
    echo ">>> SCALE UP -> $NEW <<<"
    LAST_SCALE=$NOW
```
**What it does:**
- Calculates new replica count
- Calls Docker API to scale
- Logs the action
- Resets cooldown timer

---

```bash
  elif [ "$LOW" = "1" ] && [ "$CUR" -gt "$MIN" ] && [ "$TIME_SINCE" -gt "$COOLDOWN" ]; then
    NEW=$((CUR - 1))
    docker service scale myapp_web-app=$NEW
    echo ">>> SCALE DOWN -> $NEW <<<"
    LAST_SCALE=$NOW
```
**Same logic for scaling DOWN:** CPU below threshold, above minimum, cooldown passed.

---

```bash
  sleep 10
```
**Why:** Check every 10 seconds — balances responsiveness vs API load.

---

## File 2: `docker-compose.swarm.yaml` - The Infrastructure

```yaml
configs:
  scaler_script:
    file: ./scaler.sh
```
**Why:** Docker configs store files that can be mounted into containers. This is how we inject the script without YAML escaping issues.

---

```yaml
  scaler:
    image: docker:cli
    deploy:
      placement:
        constraints:
          - node.role == manager
```
**Why:** 
- `docker:cli` — has Docker CLI built-in (can run `docker service scale`)
- Runs on manager node — only managers can execute Docker API commands

---

```yaml
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```
**Why:** This is the **most critical line**. Mounts the Docker socket into the container, giving it access to the Docker API on the host. Without this, the scaler can't scale anything.

*/var/run/docker.sock:/var/run/docker.sock*
One-line explanation: It mounts the Docker daemon socket into the container, allowing the container to run Docker commands and control the host's Docker engine.

---

```yaml
    configs:
      - source: scaler_script
        target: /scaler.sh
        mode: 0555
```
**Why:** Mounts our script into the container at `/scaler.sh` with execute permissions.

---

```yaml
    entrypoint: ["/bin/sh"]
    command: ["/scaler.sh"]
```
**Why:** Runs the script when container starts.

---

## Quick Commands Reference

```bash
# Deploy
docker stack deploy -c docker-compose.swarm.yaml myapp

# Watch logs
docker service logs myapp_scaler -f

# Check replicas
docker service ls

# Generate load
docker run -d --rm --name loadgen --network host alpine/bombardier -c 200 -d 180s http://localhost:80

# Stop load
docker rm -f loadgen

# Clean up
docker stack rm myapp
```
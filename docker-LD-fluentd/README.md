### What is Fluentd?
Fluentd collects logs from all containers and sends them to a central place (Elasticsearch). Instead of checking each container, you see ALL logs in one dashboard (Kibana).

## Kibana Quick Setup (First Time)
Open http://localhost:5601

Go to Stack Management → Index Patterns

Click Create index pattern

Type: docker-logs-*

Select @timestamp as time field

Click Create index pattern

Go to Discover - see all your logs!

## Filtering Logs in Kibana

# Filter by container
kubernetes.container_name: "backend"

# Filter by log level (if you add it)
message: "*error*"

# Filter by FTP operations  
message: "*FTP*"

# Time range (top right)
Last 15 minutes, Last 1 hour, etc.

## Visual Flow

Frontend Container  ──┐
                       │
Backend Container  ────┤  logs (stdout)
                       ├────▶ Fluentd ────▶ Elasticsearch ────▶ Kibana
FTP Server Container ─┘      (collector)    (storage)         (dashboard)
                              
                              Port 24224    Port 9200    Port 5601

---------------------------->>>>>>>>>>>>>>>>>>>>>>-------------------------------
# Terminal logs error handled and solution:
1. 
[+] Running 4/5uentd                                                                                                                        
 ✔ docker-ld-fluentd-app                                                                                                                                  Built0.0s  image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform 
 ✔ Network docker-ld-fluentd_default                                                                                                                      Created0.0s                                                                                                                   
 ✔ Container fluentd                                                                                                                                      Started0.2s 
 ! fluentd The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested 0.0s 
 ⠹ Container my-app                                                                                                                                       Starting3.2s 
Error response from daemon: failed to create task for container: failed to initialize logging driver: dial tcp [::1]:24224: i/o timeout

*solution* -> from fluentd-address: "localhost:24224" to fluentd-address: "fluentd:24224"

This line is the problem:

```yaml id="kct4iq"
fluentd-address: "localhost:24224"
```

Change it to:

```yaml id="q9f2a4"
fluentd-address: "fluentd:24224"
```

---

Why?

You have two containers:

```text id="zq8j8w"
fluentd
app
```

Inside Docker network:

```text id="ecrlr5"
app
 ↓
localhost
```

means:

```text id="7rq0i2"
app container itself
```

NOT:

```text id="mbcl1z"
fluentd container
```

---

Docker Compose automatically creates DNS names:

```text id="edtwuh"
service name = hostname
```

So:

```yaml id="0j3h3m"
fluentd:
```

creates hostname:

```text id="kwz3lw"
fluentd
```

Your app should connect to:

```text id="0rk71m"
fluentd:24224
```

---

One more thing:

```yaml id="yc0mdn"
depends_on:
  - fluentd
```

only guarantees container startup order.

It does **not** guarantee Fluentd is ready to accept connections.

Sometimes Docker tries:

```text id="aqh9g9"
start app
 ↓
connect to fluentd
 ↓
fluentd still initializing
 ↓
connection failure
```

2. 
              Created0.0s                                                                                                                   
 ✔ Container fluentd                                                                                                                                      Started0.2s 
 ! fluentd The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested 0.0s 
 ⠸ Container my-app                                                                                                                                       Starting0.3s 
Error response from daemon: failed to create task for container: failed to initialize logging driver: dial tcp: lookup fluentd on 192.168.65.7:53: no such host

*solution* -> from luentd-address: "fluentd:24224" to fluentd-address: "host.docker.internal:24224"

This is actually a known Docker limitation.

Your new error:

```text id="ow9g77"
failed to initialize logging driver:
lookup fluentd ... no such host
```

means:

```text id="bm74zy"
Docker Logging Driver
      ↓
trying to resolve "fluentd"
      ↓
DNS not available yet
```

The important thing:

**Logging drivers run in the Docker daemon, not inside the container.**                                               -------> *inportant notes*

You are thinking:

```text id="1lfp2v"
app container
    ↓
fluentd hostname
```

But reality is:

```text id="zpph2o"
Docker Daemon
    ↓
Fluentd Logging Driver
    ↓
Needs address before app container starts
```

At that moment Docker Compose DNS is not available.

---

For local testing on Docker Desktop, use:

```yaml id="3f0ujr"
logging:
  driver: fluentd
  options:
    fluentd-address: "host.docker.internal:24224"
```

or sometimes:

```yaml id="4q1ndm"
fluentd-address: "127.0.0.1:24224"
```

depending on how Fluentd is exposed.

Because Fluentd has:

```yaml id="z78lqd"
ports:
  - "24224:24224"
```

so Docker daemon can reach it through the host.

---

Let's verify Fluentd first.

Run:

```bash id="k7sxqr"
docker logs fluentd
```

You should see something like:

```text id="y2jv1v"
listening port 24224
```

or

```text id="f47v3t"
starting fluentd worker
```

---


---------------------------->>>>>>>>>>>>>>>>>>>>>>-------------------------------

*Restart the fluentd* -> docker compose restart fluentd

Because before the restart, Fluentd was running with the **old state/config**.

When you restarted:

```bash
docker compose restart fluentd
```

or recreated the containers:

```bash
docker compose down
docker compose up -d
```

Fluentd did this:

```text
Load fluent.conf
    ↓
Load Loki plugin
    ↓
Connect to Loki
    ↓
Start accepting logs
```

---

In Docker, changing:

```text
Dockerfile
fluent.conf
plugins
environment variables
```

does **nothing** to an already running container.

The running container keeps using:

```text
Old filesystem
Old process
Old loaded config
```

until you restart or recreate it.

---


---------------------------------->>>>>>>>>>>>>>>>>>>>>>>>--------------------------------------------

This is the most important thing to understand:

**Fluentd is NOT reading the file and then sending it to Loki.**

Many beginners assume this flow:

```text
App
 ↓
Fluentd file
 ↓
Read file
 ↓
Loki
```

That is NOT what your config does.

---

Your actual flow is:

```text
App
 ↓
stdout
 ↓
Docker Fluentd Driver
 ↓
Fluentd
 ↓
Copy Plugin
 ├── File Store
 └── Loki Store
```

---

Look at this section:

```xml
<match app.**>
  @type copy
```

`copy` means:

```text
Receive ONE log record
 ↓
Send to MULTIPLE outputs
```

---

When your app logs:

```js
console.log("Hello");
```

Docker sends:

```json
{
  "container_name": "/my-app",
  "source": "stdout",
  "log": "Hello"
}
```

to Fluentd.

---

Then Fluentd receives ONE record:

```json
{
  "container_name": "/my-app",
  "source": "stdout",
  "log": "Hello"
}
```

and the copy plugin duplicates it:

```text
Record
 ↓
Copy
 ├── Store #1 File
 └── Store #2 Loki
```

---

### Store #1

```xml
<store>
  @type file
```

writes:

```text
./fluentd-logs/docker.log
```

through:

```yaml
volumes:
  - ./fluentd-logs:/fluentd/log
```

That's why you can see:

```bash
cat fluentd-logs/docker.log
```

---

### Store #2

```xml
<store>
  @type loki
  url "http://loki:3100"
```

sends the SAME record over HTTP:

```text
Fluentd
 ↓ HTTP POST
http://loki:3100
 ↓
Loki stores log
```

---

The file is NOT used for Loki.

Think of it like:

```text
Original Log
     ↓
     Copy
    /    \
   /      \
File      Loki
```

---

If you delete this section:

```xml
<store>
  @type file
</store>
```

then:

```text
App
 ↓
Docker
 ↓
Fluentd
 ↓
Loki
```

will still work.

No local file needed.

---

If you delete this section:

```xml
<store>
  @type loki
</store>
```

then:

```text
App
 ↓
Docker
 ↓
Fluentd
 ↓
File
```

will still work.

No Loki needed.

---

So the volume:

```yaml
- ./fluentd-logs:/fluentd/log
```

exists only because you decided:

> "I want a local copy of the logs too."

Loki receives logs directly from Fluentd memory, not from the file in `fluentd-logs`.

That's the key concept behind the `copy` plugin.

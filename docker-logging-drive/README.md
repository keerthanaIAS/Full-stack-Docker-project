# KEY POINT TO REMEMBER:
when you run docker-compose up, Docker automatically finds and uses the Dockerfile in the path specified by build: ./backend.

## how FTP connection works with docker:-

## Backend FTP Client to Docker FTP Server Connection - Code Flow
### 1. **docker-compose.yml - The Bridge**
```yaml
services:
  ftp-server:              # Service name becomes HOSTNAME in Docker network
    image: stilliard/pure-ftpd
    container_name: ftp-server
    environment:
      - FTP_USER_NAME=ftpuser    # Creates user
      - FTP_USER_PASS=ftppass    # Sets password
      - FTP_USER_HOME=/home/ftpuser  # Home directory

  backend:
    build: ./backend
    depends_on:
      - ftp-server          # Wait for FTP to start first
    # Both services are on same Docker network automatically
```

**Key Point**: Docker Compose creates a **default network**. Both containers get IPs and can communicate using **service names as hostnames**.

### 2. **backend/server.js - How Connection Happens**

```javascript
// FTP Configuration
const ftpConfig = {
  host: 'ftp-server',    // ← THIS IS THE MAGIC!
  // WHY 'ftp-server'? It's the service name from docker-compose.yml
  // Docker DNS resolves 'ftp-server' to the container's IP automatically
  
  user: 'ftpuser',       // Matches FTP_USER_NAME in yaml
  password: 'ftppass',   // Matches FTP_USER_PASS in yaml
  secure: false          // No SSL for local development
};
```

### 3. **Full Connection Flow in Code**

```javascript
const ftp = require('basic-ftp');

async function uploadToFTP(localPath, remoteName) {
  const client = new ftp.Client();
  // Step 1: Create FTP client object
  
  try {
    console.log('Connecting to FTP at ftp-server:21');
    
    await client.access({
      host: 'ftp-server',     // Step 2: Docker resolves this to FTP container IP
      user: 'ftpuser',        // Step 3: Authenticate with credentials
      password: 'ftppass',    //         (same as in docker-compose.yml)
      port: 21,               // Step 4: Default FTP port (auto if not specified)
      secure: false
    });
    // Step 5: Now connected to FTP server inside Docker network
    
    console.log('Connected to FTP server successfully');
    
    await client.uploadFrom(localPath, remoteName);
    // Step 6: Upload file to /home/ftpuser/remoteName
    
  } catch (error) {
    console.error('Connection failed:', error.message);
  } finally {
    client.close();
    // Step 7: Always disconnect
  }
}
```

### 4. **Docker Network Magic Explained**

```bash
# If you exec into backend container
docker exec -it backend sh

# You can ping FTP server by SERVICE NAME
ping ftp-server
# Returns: 172.18.0.2 (Docker internal IP)

# You can even FTP from command line inside backend container
ftp ftp-server 21
# Connects because Docker DNS resolves the name
```

### 5. **Visual Flow**

```
┌─────────────────────────────────────────┐
│         Docker Network (172.18.0.0)     │
│                                         │
│  ┌──────────────┐    ┌───────────────┐ │
│  │   Backend    │    │  FTP Server   │ │
│  │  Container   │───▶│  Container    │ │
│  │              │    │               │ │
│  │ basic-ftp    │    │ pure-ftpd     │ │
│  │ client       │    │ listening on  │ │
│  │              │    │ port 21       │ │
│  │ IP: 172.18.0.3│   │ IP: 172.18.0.2│ │
│  └──────────────┘    └───────────────┘ │
│         │                    ▲          │
│         │    host: 'ftp-server'         │
│         └────────────────────┘          │
│           (DNS Resolution)              │
└─────────────────────────────────────────┘
```

### 6. **Code Connection Summary**

```javascript
// The connection string in code:
"ftp://ftpuser:ftppass@ftp-server:21"

// Breakdown:
// ftp://         - Protocol (basic-ftp handles this)
// ftpuser       - From docker-compose.yml FTP_USER_NAME
// ftppass       - From docker-compose.yml FTP_USER_PASS  
// ftp-server    - Service name → Docker DNS → Container IP
// 21            - Default FTP port (exposed in yaml)
```

### 7. **Testing Connection - Add This to Debug**

```javascript
// Add in server.js to test connection
app.get('/api/test-ftp', async (req, res) => {
  const client = new ftp.Client();
  try {
    console.log('Testing FTP connection to ftp-server...');
    await client.access(ftpConfig);
    console.log('✅ FTP connection successful');
    
    const list = await client.list();
    console.log('Files on FTP:', list.length);
    
    res.json({ connected: true, files: list.length });
  } catch (error) {
    console.error('❌ FTP connection failed:', error.message);
    res.json({ connected: false, error: error.message });
  } finally {
    client.close();
  }
});
```

**Simple Answer**: `host: 'ftp-server'` in code matches service name in docker-compose.yml. Docker automatically resolves this hostname to the FTP container's IP address on the internal network.


-------------------------------------------------------------------------------------------
                                JSON file logging driver
-------------------------------------------------------------------------------------------
 logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

docker-compose up -d

# View logs from Docker
docker-compose logs -f backend    # Backend logs
docker-compose logs -f frontend   # Frontend logs


-------------------------------------------------------------------------------------------
                                Local logging driver
-------------------------------------------------------------------------------------------
Simple Hands-On Practice
Step 1: Change to local driver

yaml
# docker-compose.yml - just change backend logging
logging:
  driver: "local"
  options:
    max-size: "5m"
    max-file: "2"
Step 2: Restart and observe

bash
docker-compose up -d backend
docker-compose logs backend  # Still works
docker inspect backend | grep -A 5 LogConfig  # See the change      

---------------------------------------------------------------------------
# Difference between json-file and local driver?
json-file:
- Stores logs as JSON text files
- Easier to inspect manually
- Uses more disk space

local:
- Stores logs in compressed Docker format
- Uses less disk space
- Better performance
- Recommended for production if centralized logging isn't used

---------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>---------------------------


**where the logs are going after `console.log()`**.

# Step 1: What happens when Node logs?

In your app:

```js
console.log("File uploaded");
```

Node writes to:

```text
stdout (Standard Output)
```

Flow:

```text
Node App
   ↓
console.log()
   ↓
stdout
```

At this point Docker catches it.

```text
Node App
   ↓
stdout
   ↓
Docker
```

Docker now asks:

> "Which logging driver should I use?"

Based on:

```yaml
logging:
  driver: local
```

or

```yaml
logging:
  driver: json-file
```

---

# Step 2: json-file driver

```yaml
logging:
  driver: json-file
```

Flow:

```text
Node
 ↓
stdout
 ↓
Docker
 ↓
container-id-json.log
```

Stored as:

```json
{
  "log":"File uploaded\n",
  "stream":"stdout",
  "time":"2026-06-11T10:00:00Z"
}
```

Human-readable JSON.

---

# Step 3: local driver

```yaml
logging:
  driver: local
```

Flow:

```text
Node
 ↓
stdout
 ↓
Docker
 ↓
compressed Docker log files
```

Not JSON.

Not human-readable.

Optimized for Docker.

Think:

```text
json-file
   ↓
text file

local
   ↓
binary/compressed file
```

---

# Step 4: Why does `docker logs` work for both?

Because:

```bash
docker logs backend
```

does NOT read your JSON file directly.

It asks Docker Engine:

```text
"Give me logs for backend"
```

Docker reads whatever format it stored and converts it back to text.

So:

```text
json-file
 ↓
Docker
 ↓
docker logs
 ↓
text output
```

and

```text
local
 ↓
Docker
 ↓
docker logs
 ↓
text output
```

look exactly the same.

That's why you're seeing:

```text
info: Server started
info: Uploading file
```

for both drivers.

---

# Step 5: How can I see json-file logs?

On Linux host:

Find container id:

```bash
docker ps
```

Then:

```bash
docker inspect backend | grep Id
```

Example:

```text
abc123
```

Then:

```bash
cat /var/lib/docker/containers/abc123/abc123-json.log
```

You'll see raw JSON.

---

# Step 6: How can I see local driver files?

You generally don't.

That's the whole point.

Docker manages them internally.

Instead you use:

```bash
docker logs backend
```

or

```bash
docker compose logs backend
```

The files are not meant for manual reading.

---

# Simple comparison

| Feature            | json-file     | local                |
| ------------------ | ------------- | -------------------- |
| Human readable     | ✅ Yes         | ❌ No                 |
| JSON records       | ✅ Yes         | ❌ No                 |
| Compressed         | ❌ No          | ✅ Yes                |
| Disk usage         | Higher        | Lower                |
| Docker recommended | Older default | Better local storage |
| docker logs works  | ✅             | ✅                    |

---

# Most important thing to understand

The logging driver is **not creating logs**.

Your application creates logs:

```js
console.log()
logger.info()
logger.error()
```

The logging driver only decides:

```text
Where should Docker store these logs?
```

Like a courier service:

```text
Node App
   ↓
Log Message
   ↓
Docker Driver
   ↓
Storage Location
```

Drivers:

```text
json-file  → store as JSON files
local      → store as compressed Docker files
fluentd    → send to Fluentd server
```

---------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>---------------------------

> Which code produced this?

Probably something like:

```js
logger.info("Server started on port 5000");
```

or

```js
console.log("Server started on port 5000");
```

---

### Full flow

Your code:
```js
logger.info("File uploaded successfully");
```
↓
Winston Console Transport:
```js
new winston.transports.Console()
```
↓
Writes to:
```text
stdout
```
↓
Docker captures stdout
↓
Local logging driver stores it internally
↓
When you run:
```bash
docker compose logs backend
```

Docker reads those stored logs and prints them.

---

### Visual flow

```text
logger.info(...)
      ↓
Winston Console Transport
      ↓
stdout
      ↓
Docker
      ↓
local driver storage
      ↓
docker compose logs
      ↓
Terminal
```

---

### The important line to find

Open your `logger.js`.

If you have:

```js
transports: [
  new winston.transports.Console()
]
```

THIS is why Docker can see the logs.

Because:

```text
Console Transport
      ↓
stdout
      ↓
Docker captures it
```

---

### What if you remove Console Transport?

Example:

```js
transports: [
  new winston.transports.File({
    filename: "logs/app.log"
  })
]
```

Now flow becomes:

```text
logger.info(...)
      ↓
app.log
```

No stdout.

No Docker capture.

Then:

```bash
docker compose logs backend
```

shows almost nothing.

Because Docker only sees stdout/stderr.

---

### One sentence summary

`docker compose logs backend` does **not read your code files or Winston logs directly**; it only shows whatever your application writes to **stdout/stderr**, which Docker captured and stored using the configured logging driver.

---------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>---------------------------


There are actually **two different things**:

### 1. See logs through Docker

```bash
docker logs backend
```

or

```bash
docker compose logs backend
```

Docker reads its storage and shows them.

---

### 2. See the actual files Docker stored

This depends on the driver.

## json-file driver

On a Linux Docker host:

```bash
docker inspect backend --format='{{.LogPath}}'
```

Example output:

```text
/var/lib/docker/containers/abc123/abc123-json.log
```

Then:

```bash
cat /var/lib/docker/containers/abc123/abc123-json.log
```

You'll see:

```json
{"log":"Server started\n","stream":"stdout","time":"2026-06-11T06:01:14Z"}
{"log":"File uploaded\n","stream":"stdout","time":"2026-06-11T06:04:51Z"}
```

That's the real stored file.

---

## local driver

Run:

```bash
docker inspect backend --format='{{.LogPath}}'
```

You might get something like:

```text
/var/lib/docker/containers/abc123/local-logs/container.log
```

If you open it:

```bash
cat <path>
```

you'll usually see:

```text
gibberish / binary data
```

or unreadable content.

Why?

Because the `local` driver stores logs in Docker's optimized internal format, not plain JSON.

---

## Practical takeaway

For learning:

```yaml
logging:
  driver: json-file
```

You can inspect the raw JSON storage (on a Linux host).

For production:

```yaml
logging:
  driver: local
```

You normally **don't inspect the files directly**. You use:

```bash
docker logs
docker compose logs
```

and let Docker manage the storage.

### Simple memory rule

```text
json-file
    ↓
Human-readable storage

local
    ↓
Docker-readable storage

docker logs
    ↓
Works for both
```

------------------------------>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>-------------------------------

# Terminal logs JSON file:
keerthana@Keerthanas-MacBook-Air docker-logging-drive % docker inspect backend --format='{{.LogPath}}'
/var/lib/docker/containers/f2c9d690dc1b85e41f3bdd89aeb0a6124c77c71976dc37e594913c32c8325d70/f2c9d690dc1b85e41f3bdd89aeb0a6124c77c71976dc37e594913c32c8325d70-json.log

*Point to remember* -> so we can see the docker log using winston not actual log that is hidden in linix                          ----> *important line*

This is because you're on **Docker Desktop for Mac**, not a native Linux machine.

Docker shows:

```bash
docker inspect backend --format='{{.LogPath}}'
```

Output:

```text
/var/lib/docker/containers/.../container-json.log
```

But that path exists **inside Docker's Linux VM**, not on your macOS filesystem.                                     --------> *important notes*

So when you run:

```bash
cat /var/lib/docker/containers/...
```

macOS looks for:

```text
Mac filesystem
└── /var/lib/docker/containers
```

and finds nothing.

---

### Why does `docker inspect` show it then?

Because Docker Engine knows where the file is **inside its VM**.

Think:

```text
Your Mac
   ↓
Docker Desktop
   ↓
Hidden Linux VM
   ↓
/var/lib/docker/containers/...
```

`docker inspect` asks Docker Engine.

`cat` asks macOS.

They're looking in different places.

---

# Terminal log Local:
keerthana@Keerthanas-MacBook-Air docker-logging-drive % docker inspect backend --format='{{.LogPath}}'

keerthana@Keerthanas-MacBook-Air docker-logging-drive % 

----

After switching to:

```yaml id="3mtnmb"
logging:
  driver: local
```

you got:

```bash id="c5k75y"
docker inspect backend --format='{{.LogPath}}'
```

Output:

```text id="5v4g2f"
```

(blank)

This is expected on many Docker versions.

Why?

Because:

```text id="rfq6m1"
json-file
   ↓
single log file
   ↓
LogPath available

local
   ↓
Docker-managed storage
   ↓
LogPath may be empty
```

The `local` driver does not expose a traditional log file path the same way `json-file` does.                            ----> *important line*

---

The first thing I'd verify is:

```bash id="5vl1zd"
docker inspect backend --format='{{json .HostConfig.LogConfig}}'
```

you now see:

```json id="jlwmrf"
{"Type":"local","Config":{"max-file":"3","max-size":"10m"}}
```
******* That blank LogPath is one of the clues that Docker is no longer using a normal JSON log file and is instead managing logs through the local driver's internal storage mechanism. ******

-----------------------------------------------

# Terminal log for both local and json
keerthana@Keerthanas-MacBook-Air docker-logging-drive % docker inspect backend --format='{{json .HostConfig.LogConfig}}'
{"Type":"json-file","Config":{"max-file":"3","max-size":"10m"}}
keerthana@Keerthanas-MacBook-Air docker-logging-drive % docker inspect backend --format='{{json .HostConfig.LogConfig}}'
{"Type":"local","Config":{"max-file":"3","max-size":"10m","mode":"non-blocking"}}

-----------------------------------------------

#### Summary
You have TWO log systems:
Winston File → logs/app.log (always JSON, you control format)
Docker Driver → captures console output (format depends on driver)

-----------------------------------------------

## if i use fluentd now i can see the docker real log using the server?

Yes, now you're thinking in the right direction.

With `json-file`:

```text id="h7j5tl"
Node
 ↓
stdout
 ↓
Docker
 ↓
json log file
```

With `local`:

```text id="jz9vkp"
Node
 ↓
stdout
 ↓
Docker
 ↓
Docker internal storage
```

With `fluentd`:

```text id="8x5m74"
Node
 ↓
stdout
 ↓
Docker
 ↓
Fluentd
 ↓
Log storage/server
```

The big difference is:

```text id="qqqf8s"
json-file/local
    ↓
Logs stay on same machine

fluentd
    ↓
Logs are forwarded elsewhere
```

---

For example:

```text id="ffllnm"
Backend Container
 ↓
Fluentd Container
 ↓
Elasticsearch
 ↓
Kibana UI
```

Now instead of:

```bash id="lkv7mb"
docker logs backend
```

you can open Kibana and search:

```text id="spc9dq"
ERROR
userId=123
uploaded file
```

across all containers.

---

In production the flow often becomes:

```text id="8dz2vk"
10 backend containers
5 frontend containers
3 worker containers
 ↓
Fluentd
 ↓
Central log store
 ↓
Dashboard
```

Without Fluentd you'd need to SSH into servers and check logs one by one.

---

One small correction:

> "see the docker real log"

Not exactly.

Fluentd doesn't show a more "real" log.

The log is still:

```text id="0r7h4e"
console.log(...)
logger.info(...)
```

The difference is where it gets sent.

```text id="2a5shj"
json-file
 → stored as file

local
 → stored internally

fluentd
 → forwarded to log server
```

---

-----------------------------------------------

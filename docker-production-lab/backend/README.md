# PHASE 1 — Docker Network

## Dockerfile

```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm","start"]
```

---

## Build

```bash
docker build -t backend:v1 .
```

---

# Step 3

Create network

```bash
docker network create app-net
```

Check

```bash
docker network ls
```

---

# Step 4

Run Redis

```bash
docker run -d \
--name redis \
--network app-net \
redis
```

---

# Step 5

Run Backend

```bash
docker run -d \
--name backend \
--network app-net \
-p 3000:3000 \
backend:v1
```

---

# Test

Open

```bash
http://localhost:3000
```

Output

```text
Visits : 1
Visits : 2
Visits : 3
```

---

# Important Understanding

Backend config:

```js
url: "redis://redis:6379"
```

Question:

How does backend know redis IP?

Answer:

```text
Docker DNS
```

Network provides:

```text
redis
backend
frontend
```

name resolution.

---

Verify

```bash
docker exec -it backend sh
```

Inside:

```bash
ping redis
```

or

```bash
getent hosts redis
```

You'll see Redis IP.

---

# What Happens Without Network?

Run backend without:

```bash
--network app-net
```

Backend logs:

```text
ENOTFOUND redis
```

because container cannot find Redis.

---

# Real Interview Question

Why not use IP?

Bad:

```js
172.18.0.3
```

Because:

```text
Container recreated
IP changed
Application breaks
```

Use:

```text
Service Name
```
Always.

---


## Terminal logs : -
keerthana@Keerthanas-MacBook-Air docker-production-lab % cd backend 
keerthana@Keerthanas-MacBook-Air backend % docker rm -f backend redis
backend
redis
keerthana@Keerthanas-MacBook-Air backend % docker rmi backend:v2
Untagged: backend:v2
Deleted: sha256:0c29ddba94106cf0330a88da0afbf5f4377b12e28390bd72bd3cf82cbd396885
keerthana@Keerthanas-MacBook-Air backend % docker build -t docker-lab-backend:v1 .
[+] Building 7.2s (10/10) FINISHED                                                                         docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 134B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:20                                                                 3.2s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 2B                                                                                            0.0s
 => [1/5] FROM docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5           0.1s
 => => resolve docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5           0.0s
 => [internal] load build context                                                                                          1.1s
 => => transferring context: 7.23MB                                                                                        1.1s
 => [2/5] WORKDIR /app                                                                                                     0.0s
 => [3/5] COPY package*.json ./                                                                                            0.1s
 => [4/5] RUN npm install                                                                                                  1.6s
 => [5/5] COPY . .                                                                                                         0.4s
 => exporting to image                                                                                                     0.8s 
 => => exporting layers                                                                                                    0.3s 
 => => exporting manifest sha256:2ad20bad3f63b5a87ba011b0037e035a8f0bac1399454f1f210bd0c41fcbd61f                          0.0s
 => => exporting config sha256:b059072679a4eb2416147cd69a61d7bccf0eb60db634f4eab950b0a1d2d3dbcb                            0.0s
 => => exporting attestation manifest sha256:a7288c58ce9aab33b49d3ab31f81afe5547a8578aace1c5b84b502642e4cd248              0.0s
 => => exporting manifest list sha256:fbc3451b64b8c00062369338fd9c7a35bdac11a1ff7a52701c7311d2e5153796                     0.0s
 => => naming to docker.io/library/docker-lab-backend:v1                                                                   0.0s
 => => unpacking to docker.io/library/docker-lab-backend:v1                                                                0.4s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/vf115uyz5uhuxgp7dd0l0ukya
keerthana@Keerthanas-MacBook-Air backend % docker run -d \
--name redis \
--network app-net \
redis
0ec0f843311683716b3bc5b033cd8b3cf59624f5032921914d75e55fcdcf3633
keerthana@Keerthanas-MacBook-Air backend % docker run -d \
--name backend \
--network app-net \
-p 3000:3000 \
docker-lab-backend:v1
287602f8dee1cccb6dc7d51a2f23c3e39d983138b046b43fb55e872220f0e46e
keerthana@Keerthanas-MacBook-Air backend % 
keerthana@Keerthanas-MacBook-Air backend % docker exec -it backend sh
# getent hosts redis
172.18.0.2      redis
# 

## one line explain:
--------------------
Docker network allows containers to communicate with each other, using container names instead of IP addresses. Docker provides built-in DNS resolution, so even if container IPs change, services can still communicate reliably.

When you ran:
docker run --network app-net redis
docker run --network app-net backend

you were attaching both containers to the same private network.

Think of it like:
Room A
 ├─ backend
 └─ redis
Containers in the same room can talk.
Containers outside that room cannot directly communicate unless connected to that network.

*Summary* : -
------------
You learned:
✅ Create a network
docker network create app-net
✅ Attach containers to a network
docker run --network app-net ...
✅ Containers communicate using names
backend → redis
✅ Avoid hardcoded IPs
Use: redis
Don't use: 172.18.0.2
✅ Docker provides internal DNS automatically
redis → 172.x.x.x

## If the container is exited:
Terminal Logs:-
--------------
keerthana@Keerthanas-MacBook-Air backend % docker ps -a
CONTAINER ID   IMAGE                   COMMAND                  CREATED              STATUS                          PORTS                                         NAMES
3a440d69c543   docker-lab-backend:v1   "docker-entrypoint.s…"   About a minute ago   Exited (1) About a minute ago                                                 backend
c928d43b252d   redis                   "docker-entrypoint.s…"   About a minute ago   Up About a minute               6379/tcp                                      redis
f79bac26b7a8   redis                   "docker-entrypoint.s…"   10 minutes ago       Up 10 minutes                   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp   redis-local
keerthana@Keerthanas-MacBook-Air backend % docker logs backend

> backend@1.0.0 start
> node app.js

Backend Running
node:internal/process/promises:391
    triggerUncaughtException(err, true /* fromPromise */);
    ^

Error: connect ECONNREFUSED 127.0.0.1:6379
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1611:16)
Emitted 'error' event on Class instance at:
    at RedisSocket.<anonymous> (/app/node_modules/@redis/client/dist/lib/client/index.js:588:18)
    at RedisSocket.emit (node:events:524:28)
    at #connect (/app/node_modules/@redis/client/dist/lib/client/socket.js:219:22)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Class.connect (/app/node_modules/@redis/client/dist/lib/client/index.js:698:9) {
  errno: -111,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '127.0.0.1',
  port: 6379
}

Node.js v20.20.2
keerthana@Keerthanas-MacBook-Air backend % docker inspect backend --format='{{.State.Status}}'
exited
keerthana@Keerthanas-MacBook-Air backend % docker port backend
keerthana@Keerthanas-MacBook-Air backend % docker ps -a                                       
CONTAINER ID   IMAGE                   COMMAND                  CREATED          STATUS                     PORTS                                         NAMES
3a440d69c543   docker-lab-backend:v1   "docker-entrypoint.s…"   2 minutes ago    Exited (1) 2 minutes ago                                                 backend
c928d43b252d   redis                   "docker-entrypoint.s…"   2 minutes ago    Up 2 minutes               6379/tcp                                      redis
f79bac26b7a8   redis                   "docker-entrypoint.s…"   11 minutes ago   Up 11 minutes              0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp   redis-local
keerthana@Keerthanas-MacBook-Air backend % docker run -d \                                    
--name backend \
--network app-net \
-p 3000:3000 \
docker-lab-backend:v1
docker: Error response from daemon: Conflict. The container name "/backend" is already in use by container "3a440d69c54377c5ea88c622973c4b8690677c8e8fffef3c287ab947e39fd292". You have to remove (or rename) that container to be able to reuse that name.

Run 'docker run --help' for more information
keerthana@Keerthanas-MacBook-Air backend % docker rm -f backend
backend
keerthana@Keerthanas-MacBook-Air backend % docker build -t docker-lab-backend:v2 .
[+] Building 2.8s (10/10) FINISHED                                                                         docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 134B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:20                                                                 1.6s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 2B                                                                                            0.0s
 => [internal] load build context                                                                                          0.1s
 => => transferring context: 246.32kB                                                                                      0.1s
 => [1/5] FROM docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5           0.0s
 => => resolve docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5           0.0s
 => CACHED [2/5] WORKDIR /app                                                                                              0.0s
 => CACHED [3/5] COPY package*.json ./                                                                                     0.0s
 => CACHED [4/5] RUN npm install                                                                                           0.0s
 => [5/5] COPY . .                                                                                                         0.4s
 => exporting to image                                                                                                     0.6s
 => => exporting layers                                                                                                    0.3s
 => => exporting manifest sha256:434fd2a9a64bf6ee9a3cf5c177c2ed578ae83aab3b9094c7e5fabfd0728b6082                          0.0s
 => => exporting config sha256:971d29223f43917ad11a9a75eea013282e8c7108118fae5536bc13a75075f639                            0.0s
 => => exporting attestation manifest sha256:07b61ea2c45f2da7ef0f11905b19c6555f9742f3fb1449c7e93240acd057df58              0.0s
 => => exporting manifest list sha256:60fb0d1a907aaa1e54a28ef10221f7af3a946bee4031a1749ac87d2af59ae97e                     0.0s
 => => naming to docker.io/library/docker-lab-backend:v2                                                                   0.0s
 => => unpacking to docker.io/library/docker-lab-backend:v2                                                                0.2s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/s2a4b4sle7ip67r7xgaxovqra
keerthana@Keerthanas-MacBook-Air backend % docker run -d \
  --name backend \
  --network app-net \
  -p 3000:3000 \
  docker-lab-backend:v2
f9f78e16303eb31331a8c7c797b9c2c09db09ef6f0c9d1b8e2c251de304129dc
keerthana@Keerthanas-MacBook-Air backend % docker logs backend

> backend@1.0.0 start
> node app.js

Backend Running

## PHASE 2 - Healthcheck

## The Problem

Suppose Docker shows:

```bash
docker ps
```

Output:

```text
backend   Up 2 hours
```

Most beginners think:

```text
Container is up = application is working
```

Wrong.

Example:

```text
Node process running
Redis connection broken
Database disconnected
Application returning 500 errors
```

Docker still says:

```text
Up 2 hours
```

because Docker only sees the process, not whether the app is healthy.

---

# Step 1: Add HEALTHCHECK to Dockerfile

Current Dockerfile:

```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm","start"]
```

Add:

```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

HEALTHCHECK --interval=10s \
            --timeout=3s \
            --retries=3 \
CMD curl -f http://localhost:5000/health || exit 1

CMD ["npm","start"]
```

---

# What This Means

Every:

```text
10 seconds
```

Docker executes:

```bash
curl http://localhost:5000/health
```

If:

```text
HTTP 200
```

Container:

```text
healthy
```

If:

```text
error
```

Container:

```text
unhealthy
```

---

# Step 2: Rebuild

```bash
docker build -t docker-lab-backend:v2 .
```

---

# Step 3: Run

Remove old:

```bash
docker rm -f backend
```

Run:

```bash
docker run -d \
--name backend \
--network app-net \
-p 3000:5000 \
docker-lab-backend:v2
```

---

# Step 4: Verify

Immediately:

```bash
docker ps
```

You may see:

```text
(health: starting)
```

Wait 15–20 seconds.

Then:

```bash
docker ps
```

Output:

```text
healthy
```

Example:

```text
Up 30 seconds (healthy)
```

---

# Inspect Health Details

Run:

```bash
docker inspect backend
```

Too much output.

Filter:

```bash
docker inspect backend | grep -A 20 Health
```

You'll see:

```text
Status: healthy
```

and check history.

---

# Let's Break It

This is where learning happens.

Enter container:

```bash
docker exec -it backend sh
```

Find node process:

```bash
ps
```

Kill it:

```bash
kill 1
```

Exit.

---

Docker sees:

```text
App gone
```

Healthcheck fails.

Container becomes:

```text
unhealthy
```

or exits completely.

---

# Why Production Uses This

Without healthcheck:

```text
Container running
App broken
Traffic still sent
Users affected
```

With healthcheck:

```text
Container unhealthy
Swarm/Kubernetes notices
Traffic removed
New container created
```

---

# What You Learned

Before healthcheck:

```text
docker ps = process alive
```

After healthcheck:

```text
docker ps = process alive + application responding
```

---

# One-Line Interview Answer

> A Docker healthcheck periodically verifies whether an application inside a container is functioning correctly. It helps distinguish between a running container and a healthy application.

---

## One line explain:
Healthcheck allows Docker to verify that the application inside the container is responding correctly. If the main process (PID 1) is killed, the container exits regardless of healthchecks. Healthchecks are mainly used to detect unhealthy applications and enable self-healing in orchestrators like Swarm and Kubernetes.


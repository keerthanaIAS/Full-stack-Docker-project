✅ Built images locally

```bash
docker build -t backend:v1 ./backend
docker build -t frontend:v1 ./frontend
```

✅ Swarm deployed services using those images

```bash
docker stack deploy -c docker-compose.swarm.yml Swarm-image-store
```

✅ Swarm created replicas

```text
backend   3/3
frontend  2/2
```

✅ Tasks are running

```text
backend.1 Running
backend.2 Running
backend.3 Running
```

---

*Now do the interesting Swarm tests:-*

## Test 1: Self-Healing

Find backend containers:

```bash
docker ps
```

Kill one:

```bash
docker kill <container-id>
```

Immediately check:

```bash
docker service ps Swarm-image-store_backend
```

You'll see something like:

```text
backend.2 Shutdown
backend.xyz Running
```

Swarm automatically creates a replacement.

**Concept proven:**

> Desired state = 3 replicas. Swarm always tries to maintain it.

---

## Test 2: Scale Up

```bash
docker service scale Swarm-image-store_backend=5
```

Check:

```bash
docker service ls
```

Output:

```text
backend  5/5
```

**Concept proven:**

> Swarm can scale services dynamically.

---

## Test 3: Scale Down

```bash
docker service scale Swarm-image-store_backend=2
```

Check:

```bash
docker service ls
```

Output:

```text
backend  2/2
```

**Concept proven:**

> Swarm removes excess replicas automatically.

---

## Test 4: Overlay Network

See network:

```bash
docker network ls
```

You should see:

```text
Swarm-image-store_default
```

Inspect:

```bash
docker network inspect Swarm-image-store_default
```

**Concept proven:**

> Swarm created an overlay network for service communication.

---

## Test 5: Update Service

Create:

```js
res.send("Backend Version 2");
```

Rebuild:

```bash
docker build -t backend:v2 ./backend
```

Update:

```bash
docker service update \
--image backend:v2 \
Swarm-image-store_backend
```

Check:

```bash
docker service ps Swarm-image-store_backend
```

**Concept proven:**

> Rolling updates.

*More Deep Test 5 explain*:

Open:

```text
Swarm-image-store/
└── backend/
    └── server.js
```

Currently it probably looks like:

```js
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({
    service: "backend",
    message: "Backend Running"
  });
});

app.listen(5000);
```

Change it to:

```js
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Backend Version 2");
});

app.listen(5000);
```

Save the file.

---

Now rebuild the image:

```bash
docker build -t backend:v2 ./backend
```

Verify:

```bash
docker images
```

You should see:

```text
backend    v1
backend    v2
```

---

Now update the running Swarm service:

```bash
docker service update \
--image backend:v2 \
Swarm-image-store_backend
```

Watch the update:

```bash
docker service ps Swarm-image-store_backend
```

You will see old containers being replaced by new ones.

---

Then test:

```bash
curl http://localhost:5000
```

Before:

```text
Backend Running
```

After:

```text
Backend Version 2
```

This demonstrates a **rolling update**:

```text
backend:v1
      ↓
backend:v2
      ↓
Swarm replaces containers one by one
      ↓
No manual container deletion needed
```
That's the purpose of Test 5.


---

## Test 6: See Desired State

```bash
docker service inspect Swarm-image-store_backend --pretty
```

You'll see:

```text
Replicas: 3
UpdateConfig
RollbackConfig
Placement
Resources
```

This is the actual Swarm service definition.

---

For an interview/demo, the strongest sequence is:

```bash
docker service ls
docker ps
docker kill <container>
docker service ps Swarm-image-store_backend
docker service scale Swarm-image-store_backend=5
docker service ls
```

That demonstrates:

* Replicas
* Scheduling
* Self-healing
* Scaling

which are the core reasons Swarm exists.

## Terminal Logs:
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker ps
CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS         PORTS                                         NAMES
02336f45d43d   frontend:v1            "docker-entrypoint.s…"   3 minutes ago   Up 3 minutes                                                 Swarm-image-store_frontend.1.t5mywbdbhxwznffgtaxenirgd
daf779adad7c   frontend:v1            "docker-entrypoint.s…"   3 minutes ago   Up 3 minutes                                                 Swarm-image-store_frontend.2.jn1dork06jsix2713ef30vcch
4482ec208ad2   backend:v1             "docker-entrypoint.s…"   3 minutes ago   Up 3 minutes                                                 Swarm-image-store_backend.2.fi0vz2er3hdzdb5hh6kkd8ezc
515ee43f8bb4   backend:v1             "docker-entrypoint.s…"   3 minutes ago   Up 3 minutes                                                 Swarm-image-store_backend.3.9r2pm1cwrccse7zsym5fvbw81
41ca9ee361d6   backend:v1             "docker-entrypoint.s…"   3 minutes ago   Up 3 minutes                                                 Swarm-image-store_backend.1.gq3tdo003g1k7al0mt3k6haa2
b6d40416e04a   redis-lock-demo-app3   "docker-entrypoint.s…"   6 hours ago     Up 6 hours     0.0.0.0:3003->3003/tcp, [::]:3003->3003/tcp   redis-lock-demo-app3-1
4364ab0f4a49   redis-lock-demo-app2   "docker-entrypoint.s…"   6 hours ago     Up 6 hours     0.0.0.0:3002->3002/tcp, [::]:3002->3002/tcp   redis-lock-demo-app2-1
998eccdf0e91   redis-lock-demo-app1   "docker-entrypoint.s…"   6 hours ago     Up 6 hours     0.0.0.0:3001->3001/tcp, [::]:3001->3001/tcp   redis-lock-demo-app1-1
4fce3ebdb57d   redis:7-alpine         "docker-entrypoint.s…"   6 hours ago     Up 6 hours     0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp   redis-lock-demo-redis-1
keerthana@Keerthanas-MacBook-Air Swarm-image-store % 
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker kill Swarm-image-store_backend.2.fi0vz2er3hdzdb5hh6kkd8ezc
Swarm-image-store_backend.2.fi0vz2er3hdzdb5hh6kkd8ezc
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker service ps Swarm-image-store_backend
ID             NAME                              IMAGE        NODE             DESIRED STATE   CURRENT STATE           ERROR                         PORTS
gq3tdo003g1k   Swarm-image-store_backend.1       backend:v1   docker-desktop   Running         Running 6 minutes ago                                 
50cos2g1z8f1   Swarm-image-store_backend.2       backend:v1   docker-desktop   Running         Running 2 seconds ago                                 
fi0vz2er3hdz    \_ Swarm-image-store_backend.2   backend:v1   docker-desktop   Shutdown        Failed 7 seconds ago    "task: non-zero exit (137)"   
9r2pm1cwrccs   Swarm-image-store_backend.3       backend:v1   docker-desktop   Running         Running 6 minutes ago                                 
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker service scale Swarm-image-store_backend=5
Swarm-image-store_backend scaled to 5
overall progress: 5 out of 5 tasks 
1/5: running   [==================================================>] 
2/5: running   [==================================================>] 
3/5: running   [==================================================>] 
4/5: running   [==================================================>] 
5/5: running   [==================================================>] 
verify: Service Swarm-image-store_backend converged 
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker service ls
ID             NAME                         MODE         REPLICAS   IMAGE         PORTS
nku3rv49cbjy   Swarm-image-store_backend    replicated   5/5        backend:v1    *:5000->5000/tcp
cacl0rx0j434   Swarm-image-store_frontend   replicated   2/2        frontend:v1   *:3000->3000/tcp
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker network ls
NETWORK ID     NAME                        DRIVER    SCOPE
0c526jxn6tlf   Swarm-image-store_default   overlay   swarm
a4ec7bfa5be8   bridge                      bridge    local
f3e98b1d2f1e   docker_gwbridge             bridge    local
33376a3cbf5e   host                        host      local
22m4uxe0m9bv   ingress                     overlay   swarm
b1796f480fc1   none                        null      local
99f49c0844a3   redis-lock-demo_default     bridge    local
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker network inspect Swarm-image-store_default
[
    {
        "Name": "Swarm-image-store_default",
        "Id": "0c526jxn6tlfxqkase99c7l7z",
        "Created": "2026-06-08T11:15:12.114296002Z",
        "Scope": "swarm",
        "Driver": "overlay",
        "EnableIPv4": true,
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "10.0.1.0/24",
                    "Gateway": "10.0.1.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "02336f45d43d3c5bc23ec051775737a1da39ccb80ee9104e23b9b5ba853357bf": {
                "Name": "Swarm-image-store_frontend.1.t5mywbdbhxwznffgtaxenirgd",
                "EndpointID": "c8283a65f23eec58b9660103ebdee8516063eb44193059f647abae0f65f09027",
                "MacAddress": "02:42:0a:00:01:08",
                "IPv4Address": "10.0.1.8/24",
                "IPv6Address": ""
            },
            "41ca9ee361d66e3b1df9e20dad8c8b7a0bd1f8d866a036f54e7dc2220356ae2f": {
                "Name": "Swarm-image-store_backend.1.gq3tdo003g1k7al0mt3k6haa2",
                "EndpointID": "58260f47b0413298458172b1baeadd6084a65accaab393cde54775e7a8a90fa6",
                "MacAddress": "02:42:0a:00:01:04",
                "IPv4Address": "10.0.1.4/24",
                "IPv6Address": ""
            },
            "43cb5382ccd11a667f8aaefa95bb88968d11c048196257b38ac1c24f8c042c95": {
                "Name": "Swarm-image-store_backend.4.xynbu5ghaz0n64ep7ex4gc4jg",
                "EndpointID": "9cdb144c51ed5e8fd185bed589bc694008d429ef2c755ee6aeb6ba65eefbdbc3",
                "MacAddress": "02:42:0a:00:01:0b",
                "IPv4Address": "10.0.1.11/24",
                "IPv6Address": ""
            },
            "515ee43f8bb4020ead08567c67466ec9a84938b4119acd35665dac195dfeee02": {
                "Name": "Swarm-image-store_backend.3.9r2pm1cwrccse7zsym5fvbw81",
                "EndpointID": "e0430011e6177533b7f4a3cfd57126ffb6f7f7e2e35205982698932963bc4671",
                "MacAddress": "02:42:0a:00:01:03",
                "IPv4Address": "10.0.1.3/24",
                "IPv6Address": ""
            },
            "d23ca5a3955a3b0b86d7c68c0c54deae1769e0c60769ca0be28147b87c41a066": {
                "Name": "Swarm-image-store_backend.2.50cos2g1z8f19jhyccimvl87h",
                "EndpointID": "6e3e18443c1e11a02f7ea005cb3eb36dfe8c5f1fc6a95071fd2713847b2b0c5b",
                "MacAddress": "02:42:0a:00:01:0a",
                "IPv4Address": "10.0.1.10/24",
                "IPv6Address": ""
            },
            "daf779adad7c2cb9b04cc57d3a73e62c969d48645efdae749738d052f647176d": {
                "Name": "Swarm-image-store_frontend.2.jn1dork06jsix2713ef30vcch",
                "EndpointID": "4c7dd54221f6ade5c27c7e40507104746a414cca2c9c2f82ff23afa76a80d131",
                "MacAddress": "02:42:0a:00:01:09",
                "IPv4Address": "10.0.1.9/24",
                "IPv6Address": ""
            },
            "e065004cfe562b542abdc146b5faa8966c9ff9d7292b2a34290bebce9b73b764": {
                "Name": "Swarm-image-store_backend.5.fxturqr8ls2t1q3ajeps3gbyc",
                "EndpointID": "a1877764174a085b1f2712917279fdde395b07002ed392dc84af065be2abcbd0",
                "MacAddress": "02:42:0a:00:01:0c",
                "IPv4Address": "10.0.1.12/24",
                "IPv6Address": ""
            },
            "lb-Swarm-image-store_default": {
                "Name": "Swarm-image-store_default-endpoint",
                "EndpointID": "bb62685667639cd3bef1c07a6730838512ba46de4499247e12dbad93a7f48017",
                "MacAddress": "02:42:0a:00:01:06",
                "IPv4Address": "10.0.1.6/24",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.driver.overlay.vxlanid_list": "4097"
        },
        "Labels": {
            "com.docker.stack.namespace": "Swarm-image-store"
        },
        "Peers": [
            {
                "Name": "7c6f2c9bf7ec",
                "IP": "192.168.65.3"
            }
        ]
    }
]
keerthana@Keerthanas-MacBook-Air Swarm-image-store % 

*After updated the backend service*
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker build -t backend:v2 ./backend
[+] Building 0.6s (10/10) FINISHED                                                                         docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 134B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:20                                                                 0.2s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 2B                                                                                            0.0s
 => [1/5] FROM docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5           0.0s
 => => resolve docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5           0.0s
 => [internal] load build context                                                                                          0.0s
 => => transferring context: 301B                                                                                          0.0s
 => CACHED [2/5] WORKDIR /app                                                                                              0.0s
 => CACHED [3/5] COPY package*.json ./                                                                                     0.0s
 => CACHED [4/5] RUN npm install                                                                                           0.0s
 => [5/5] COPY . .                                                                                                         0.0s
 => exporting to image                                                                                                     0.1s
 => => exporting layers                                                                                                    0.1s
 => => exporting manifest sha256:fc94595ae030288ae92418f72d0a43c6e07d771f5208f145c9c241029d3201d2                          0.0s
 => => exporting config sha256:8f9d1c0d4865587383cfc8a7b9c74d8ef5ae4c16ee987f3a95d49ed861205c1e                            0.0s
 => => exporting attestation manifest sha256:66a988cf78b3ae3b5f549c3b4d686268fa077945e1d53ee9f8efec8aa085401f              0.0s
 => => exporting manifest list sha256:0c29ddba94106cf0330a88da0afbf5f4377b12e28390bd72bd3cf82cbd396885                     0.0s
 => => naming to docker.io/library/backend:v2                                                                              0.0s
 => => unpacking to docker.io/library/backend:v2                                                                           0.0s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/1f2u51uqcwpqhgerivwbsz9ev
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker images
REPOSITORY                           TAG          IMAGE ID       CREATED             SIZE
backend                              v2           0c29ddba9410   5 seconds ago       1.58GB
frontend                             v1           4d03027591c7   11 minutes ago      1.58GB
backend                              v1           99549f373916   12 minutes ago      1.58GB
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker service update \
--image backend:v2 \
Swarm-image-store_backend
image backend:v2 could not be accessed on a registry to record
its digest. Each node will access backend:v2 independently,
possibly leading to different nodes running different
versions of the image.

Swarm-image-store_backend
overall progress: 5 out of 5 tasks 
1/5: running   [==================================================>] 
2/5: running   [==================================================>] 
3/5: running   [==================================================>] 
4/5: running   [==================================================>] 
5/5: running   [==================================================>] 
verify: Service Swarm-image-store_backend converged 
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker service ps Swarm-image-store_backend
ID             NAME                              IMAGE        NODE             DESIRED STATE   CURRENT STATE             ERROR                         PORTS
ak4lf3vnl8o3   Swarm-image-store_backend.1       backend:v2   docker-desktop   Running         Running 14 seconds ago                                  
gq3tdo003g1k    \_ Swarm-image-store_backend.1   backend:v1   docker-desktop   Shutdown        Shutdown 14 seconds ago                                 
bnt3lh674vq0   Swarm-image-store_backend.2       backend:v2   docker-desktop   Running         Running 27 seconds ago                                  
50cos2g1z8f1    \_ Swarm-image-store_backend.2   backend:v1   docker-desktop   Shutdown        Shutdown 27 seconds ago                                 
fi0vz2er3hdz    \_ Swarm-image-store_backend.2   backend:v1   docker-desktop   Shutdown        Failed 5 minutes ago      "task: non-zero exit (137)"   
cljdh3iz8wh7   Swarm-image-store_backend.3       backend:v2   docker-desktop   Running         Running 22 seconds ago                                  
9r2pm1cwrccs    \_ Swarm-image-store_backend.3   backend:v1   docker-desktop   Shutdown        Shutdown 23 seconds ago                                 
orsmopf12aa3   Swarm-image-store_backend.4       backend:v2   docker-desktop   Running         Running 9 seconds ago                                   
xynbu5ghaz0n    \_ Swarm-image-store_backend.4   backend:v1   docker-desktop   Shutdown        Shutdown 10 seconds ago                                 
epn60tb6nlf3   Swarm-image-store_backend.5       backend:v2   docker-desktop   Running         Running 18 seconds ago                                  
fxturqr8ls2t    \_ Swarm-image-store_backend.5   backend:v1   docker-desktop   Shutdown        Shutdown 18 seconds ago                                 
keerthana@Keerthanas-MacBook-Air Swarm-image-store % docker service inspect Swarm-image-store_backend --pretty

ID:             nku3rv49cbjyxk9x6k71noxad
Name:           Swarm-image-store_backend
Labels:
 com.docker.stack.image=backend:v1
 com.docker.stack.namespace=Swarm-image-store
Service Mode:   Replicated
 Replicas:      5
UpdateStatus:
 State:         completed
 Started:       2 minutes ago
 Completed:     About a minute ago
 Message:       update completed
Placement:
UpdateConfig:
 Parallelism:   1
 On failure:    pause
 Monitoring Period: 5s
 Max failure ratio: 0
 Update order:      stop-first
RollbackConfig:
 Parallelism:   1
 On failure:    pause
 Monitoring Period: 5s
 Max failure ratio: 0
 Rollback order:    stop-first
ContainerSpec:
 Image:         backend:v2
Resources:
Networks: Swarm-image-store_default 
Endpoint Mode:  vip
Ports:
 PublishedPort = 5000
  Protocol = tcp
  TargetPort = 5000
  PublishMode = ingress 

## What I demonstrated so far
✅ Replicated services
docker service scale

✅ Self-healing
docker kill <container>
Swarm recreated it.

✅ Overlay networking
docker network inspect
showing all containers on the Swarm network.

✅ Rolling updates
docker service update --image backend:v2

## Distroless:-

*"Distroless"* container images (like Docker) that contain only your application and its essential runtime dependencies, without a standard operating system.
"distro" (short for Linux distribution, such as Ubuntu or Alpine) and "less"



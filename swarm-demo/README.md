## Terminal Logs:

keerthana@Keerthanas-MacBook-Air swarm-demo % docker build -t swarm-app:latest .
[+] Building 5.3s (10/10) FINISHED                                                                                                    docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                  0.0s
 => => transferring dockerfile: 156B                                                                                                                  0.0s
 => [internal] load metadata for docker.io/library/node:18-alpine                                                                                     2.3s
 => [internal] load .dockerignore                                                                                                                     0.0s
 => => transferring context: 2B                                                                                                                       0.0s
 => [1/5] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e                               0.0s
 => => resolve docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e                               0.0s
 => [internal] load build context                                                                                                                     0.0s
 => => transferring context: 640B                                                                                                                     0.0s
 => CACHED [2/5] WORKDIR /app                                                                                                                         0.0s
 => [3/5] COPY package*.json ./                                                                                                                       0.0s
 => [4/5] RUN npm install                                                                                                                             2.4s
 => [5/5] COPY app.js .                                                                                                                               0.0s
 => exporting to image                                                                                                                                0.5s 
 => => exporting layers                                                                                                                               0.2s 
 => => exporting manifest sha256:0861f94ff2f731f2e8af2e455418224c5d89bb1718d5a84db862e1bcd19620d7                                                     0.0s
 => => exporting config sha256:2540a6208da0e6880a8b14a99371b2ad272a9952fdeebeceb7c49f30fff6d811                                                       0.0s
 => => exporting attestation manifest sha256:7bbec01ce5bf53429abefdfbfae456bb1ff0110afd6fd59b80ef648eb977af1f                                         0.0s
 => => exporting manifest list sha256:12f1245da2061770be8dcc4071eecc5193ca9ff4189d0aa60ba6b8fbb3025a5a                                                0.0s
 => => naming to docker.io/library/swarm-app:latest                                                                                                   0.0s
 => => unpacking to docker.io/library/swarm-app:latest                                                                                                0.2s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/lk3rvn9l3sh2mijladgdjj2xh
keerthana@Keerthanas-MacBook-Air swarm-demo % docker stack rm swarm-demo 2>/dev/null
docker stack rm swarm-simple 2>/dev/null
sleep 3
Removing service swarm-demo_backend
Removing service swarm-demo_frontend
Removing service swarm-demo_mongo
Removing service swarm-demo_nginx
Removing service swarm-demo_redis
Removing network swarm-demo_swarm-net
keerthana@Keerthanas-MacBook-Air swarm-demo % docker swarm init 2>/dev/null || echo "Swarm already initialized"

Swarm already initialized
keerthana@Keerthanas-MacBook-Air swarm-demo %
keerthana@Keerthanas-MacBook-Air swarm-demo % docker ps
CONTAINER ID   IMAGE                  COMMAND                  CREATED       STATUS       PORTS                                         NAMES
b6d40416e04a   redis-lock-demo-app3   "docker-entrypoint.s…"   5 hours ago   Up 5 hours   0.0.0.0:3003->3003/tcp, [::]:3003->3003/tcp   redis-lock-demo-app3-1
4364ab0f4a49   redis-lock-demo-app2   "docker-entrypoint.s…"   5 hours ago   Up 5 hours   0.0.0.0:3002->3002/tcp, [::]:3002->3002/tcp   redis-lock-demo-app2-1
998eccdf0e91   redis-lock-demo-app1   "docker-entrypoint.s…"   5 hours ago   Up 5 hours   0.0.0.0:3001->3001/tcp, [::]:3001->3001/tcp   redis-lock-demo-app1-1
4fce3ebdb57d   redis:7-alpine         "docker-entrypoint.s…"   5 hours ago   Up 5 hours   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp   redis-lock-demo-redis-1
keerthana@Keerthanas-MacBook-Air swarm-demo % 
keerthana@Keerthanas-MacBook-Air swarm-demo %
keerthana@Keerthanas-MacBook-Air swarm-demo % docker stack deploy -c docker-compose.yml swarm-demo --resolve-image never
Ignoring unsupported options: build

Since --detach=false was not specified, tasks will be created in the background.
In a future release, --detach=false will become the default.
Creating network swarm-demo_default
Creating service swarm-demo_app
*NOTE*: --resolve-image never # Tells Swarm: Use local images, don't pull from Docker Hub
keerthana@Keerthanas-MacBook-Air swarm-demo % echo ""
echo "=== SERVICES ==="
docker service ls

=== SERVICES ===
ID             NAME             MODE         REPLICAS   IMAGE              PORTS
s2m25o6yejdr   swarm-demo_app   replicated   4/4        swarm-app:latest   *:8080->3000/tcp
keerthana@Keerthanas-MacBook-Air swarm-demo %
keerthana@Keerthanas-MacBook-Air swarm-demo % echo ""
echo "=== INSTANCES ==="
docker service ps swarm-demo_app  

=== INSTANCES ===
ID             NAME               IMAGE              NODE             DESIRED STATE   CURRENT STATE                ERROR     PORTS
8k7yi6zuhkan   swarm-demo_app.1   swarm-app:latest   docker-desktop   Running         Running about a minute ago             
y8elnmbxyjb6   swarm-demo_app.2   swarm-app:latest   docker-desktop   Running         Running about a minute ago             
tpr8kupg68jk   swarm-demo_app.3   swarm-app:latest   docker-desktop   Running         Running about a minute ago             
114v8e1478x8   swarm-demo_app.4   swarm-app:latest   docker-desktop   Running         Running about a minute ago             
keerthana@Keerthanas-MacBook-Air swarm-demo % echo ""
echo "=== TESTING LOAD BALANCING ==="
for i in {1..5}; do
  curl -s http://localhost:8080 | grep instance
done

=== TESTING LOAD BALANCING ===
{"message":"Hello from Docker Swarm!","instance":"dbbd1a9ed9f9","time":"2026-06-08T10:26:25.223Z"}
{"message":"Hello from Docker Swarm!","instance":"70c880c1d722","time":"2026-06-08T10:26:25.256Z"}
{"message":"Hello from Docker Swarm!","instance":"08c06a668c3c","time":"2026-06-08T10:26:25.286Z"}
{"message":"Hello from Docker Swarm!","instance":"5d40c0ec00a5","time":"2026-06-08T10:26:25.315Z"}
{"message":"Hello from Docker Swarm!","instance":"dbbd1a9ed9f9","time":"2026-06-08T10:26:25.340Z"}
keerthana@Keerthanas-MacBook-Air swarm-demo % 


## Commands to Continue Testing:-

# 1. See all 4 running instances
docker service ps swarm-demo_app

# 2. Scale up to 6 instances
docker service scale swarm-demo_app=6

# 3. Verify 6 instances are running
docker service ps swarm-demo_app

# 4. Scale down to 2 instances
docker service scale swarm-demo_app=2

# 5. See load balancing with 2 instances
for i in {1..10}; do curl -s http://localhost:8080 | grep -o '"instance":"[^"]*"'; done

# 6. View real-time logs from all instances
docker service logs swarm-demo_app -f

# 7. See service details
docker service inspect swarm-demo_app --pretty

# 8. Update the image (rolling update)
docker build -t swarm-app:v2 .
docker service update --image swarm-app:v2 swarm-demo_app

# 9. Remove the entire stack
docker stack rm swarm-demo

# 10. Leave swarm (when completely done)
docker swarm leave --force

*Above command running in terminal*:
keerthana@Keerthanas-MacBook-Air swarm-demo % docker service ps swarm-demo_app
ID             NAME               IMAGE              NODE             DESIRED STATE   CURRENT STATE           ERROR     PORTS
8k7yi6zuhkan   swarm-demo_app.1   swarm-app:latest   docker-desktop   Running         Running 6 minutes ago             
y8elnmbxyjb6   swarm-demo_app.2   swarm-app:latest   docker-desktop   Running         Running 6 minutes ago             
tpr8kupg68jk   swarm-demo_app.3   swarm-app:latest   docker-desktop   Running         Running 6 minutes ago             
114v8e1478x8   swarm-demo_app.4   swarm-app:latest   docker-desktop   Running         Running 6 minutes ago             
keerthana@Keerthanas-MacBook-Air swarm-demo % docker service scale swarm-demo_app=6
swarm-demo_app scaled to 6
overall progress: 6 out of 6 tasks 
1/6: running   [==================================================>] 
2/6: running   [==================================================>] 
3/6: running   [==================================================>] 
4/6: running   [==================================================>] 
5/6: running   [==================================================>] 
6/6: running   [==================================================>] 
verify: Service swarm-demo_app converged 
keerthana@Keerthanas-MacBook-Air swarm-demo % docker service ps swarm-demo_app
ID             NAME               IMAGE              NODE             DESIRED STATE   CURRENT STATE            ERROR     PORTS
8k7yi6zuhkan   swarm-demo_app.1   swarm-app:latest   docker-desktop   Running         Running 6 minutes ago              
y8elnmbxyjb6   swarm-demo_app.2   swarm-app:latest   docker-desktop   Running         Running 6 minutes ago              
tpr8kupg68jk   swarm-demo_app.3   swarm-app:latest   docker-desktop   Running         Running 6 minutes ago              
114v8e1478x8   swarm-demo_app.4   swarm-app:latest   docker-desktop   Running         Running 6 minutes ago              
0oph4fgqle95   swarm-demo_app.5   swarm-app:latest   docker-desktop   Running         Running 17 seconds ago             
f79qncizojin   swarm-demo_app.6   swarm-app:latest   docker-desktop   Running         Running 17 seconds ago             
keerthana@Keerthanas-MacBook-Air swarm-demo % docker service scale swarm-demo_app=2
swarm-demo_app scaled to 2
overall progress: 2 out of 2 tasks 
1/2: running   [==================================================>] 
2/2: running   [==================================================>] 
verify: Service swarm-demo_app converged 
keerthana@Keerthanas-MacBook-Air swarm-demo % for i in {1..10}; do curl -s http://localhost:8080 | grep -o '"instance":"[^"]*"'; done
"instance":"5d40c0ec00a5"
"instance":"dbbd1a9ed9f9"
"instance":"5d40c0ec00a5"
"instance":"dbbd1a9ed9f9"
"instance":"5d40c0ec00a5"
"instance":"dbbd1a9ed9f9"
"instance":"5d40c0ec00a5"
"instance":"dbbd1a9ed9f9"
"instance":"5d40c0ec00a5"
"instance":"dbbd1a9ed9f9"
keerthana@Keerthanas-MacBook-Air swarm-demo % docker service logs swarm-demo_app -f
swarm-demo_app.1.8k7yi6zuhkan@docker-desktop    | Instance 5d40c0ec00a5 running on port 3000
swarm-demo_app.2.y8elnmbxyjb6@docker-desktop    | Instance dbbd1a9ed9f9 running on port 3000

keerthana@Keerthanas-MacBook-Air swarm-demo % docker service inspect swarm-demo_app --pretty

ID:             s2m25o6yejdr6tgq9ewcee5lq
Name:           swarm-demo_app
Labels:
 com.docker.stack.image=swarm-app:latest
 com.docker.stack.namespace=swarm-demo
Service Mode:   Replicated
 Replicas:      2
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
 Image:         swarm-app:latest
Resources:
Networks: swarm-demo_default 
Endpoint Mode:  vip
Ports:
 PublishedPort = 8080
  Protocol = tcp
  TargetPort = 3000
  PublishMode = ingress 

keerthana@Keerthanas-MacBook-Air swarm-demo % docker build -t swarm-app:v2 .
[+] Building 1.7s (10/10) FINISHED                                                                         docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 156B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:18-alpine                                                          1.6s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 2B                                                                                            0.0s
 => [1/5] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e    0.0s
 => => resolve docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e    0.0s
 => [internal] load build context                                                                                          0.0s
 => => transferring context: 59B                                                                                           0.0s
 => CACHED [2/5] WORKDIR /app                                                                                              0.0s
 => CACHED [3/5] COPY package*.json ./                                                                                     0.0s
 => CACHED [4/5] RUN npm install                                                                                           0.0s
 => CACHED [5/5] COPY app.js .                                                                                             0.0s
 => exporting to image                                                                                                     0.1s
 => => exporting layers                                                                                                    0.0s
 => => exporting manifest sha256:0861f94ff2f731f2e8af2e455418224c5d89bb1718d5a84db862e1bcd19620d7                          0.0s
 => => exporting config sha256:2540a6208da0e6880a8b14a99371b2ad272a9952fdeebeceb7c49f30fff6d811                            0.0s
 => => exporting attestation manifest sha256:05bcd54f08c2bc6fda92abd02ee2f58fe501706ec5578487d9e2790d00ca8a62              0.0s
 => => exporting manifest list sha256:bec641f35ef48d95443c26f9e023ce8ebd69b0dd3f47900ee8ebbd0b5cc9f1bb                     0.0s
 => => naming to docker.io/library/swarm-app:v2                                                                            0.0s
 => => unpacking to docker.io/library/swarm-app:v2                                                                         0.0s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/pxcjp51l6ppe1y23yetbowj36
keerthana@Keerthanas-MacBook-Air swarm-demo % docker service update --image swarm-app:v2 swarm-demo_app
image swarm-app:v2 could not be accessed on a registry to record
its digest. Each node will access swarm-app:v2 independently,
possibly leading to different nodes running different
versions of the image.

swarm-demo_app
overall progress: 2 out of 2 tasks 
1/2: running   [==================================================>] 
2/2: running   [==================================================>] 
verify: Service swarm-demo_app converged 
keerthana@Keerthanas-MacBook-Air swarm-demo % docker stack rm swarm-demo
Removing service swarm-demo_app
Removing network swarm-demo_default
keerthana@Keerthanas-MacBook-Air swarm-demo % docker swarm leave --force
Node left the swarm.
keerthana@Keerthanas-MacBook-Air swarm-demo % 



# Most useful commands for your running swarm:

docker service ls                          # List all services
docker service ps swarm-demo_app           # See instances
docker service logs swarm-demo_app -f      # Watch logs
docker service scale swarm-demo_app=10     # Scale to 10 instances
docker service scale swarm-demo_app=1      # Scale down to 1
docker stack rm swarm-demo                 # Delete everything


## Core Concepts Now Understand
Concept	                           What It Means	                                           Your Proof
---------                          ---------------------------------                -----------------------------------------
Docker Swarm	                    Native clustering for Docker	                 You initialized it with docker swarm init
Service	                            A group of identical containers	                 swarm-demo_app with 4 replicas
Replica	                            Multiple copies of same container	            4 different instance IDs shown
Load Balancing	                    Traffic distributed automatically	            Different instances handled each request
Rolling Update	                    Update without downtime	                        service update command
Stack	                            Group of related services	                     docker stack deploy

## Commands Learned
Swarm Management
---------------
docker swarm init              # Start a swarm (you are the manager)
docker swarm leave --force     # Leave the swarm
docker node ls                 # See all nodes in swarm
Service Management
-----------------
docker service ls                          # List all services
docker service ps <service>                # See running instances
docker service logs <service> -f           # View real-time logs
docker service scale <service>=6           # Scale up/down
docker service inspect <service> --pretty  # Detailed info
docker service update --image <image> <service>  # Rolling update
Stack Management
----------------
docker stack deploy -c compose.yml <name> --resolve-image never  # Deploy
docker stack rm <name>                                           # Remove
docker stack ls                                                   # List stacks
docker stack ps <name>                                           # See tasks

## Key Architecture Lessons
1. Single Node Swarm (Your Setup)
┌─────────────────────────────────────┐
│         Your Mac (Manager)           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │App1 │ │App2 │ │App3 │ │App4 │    │
│  └─────┘ └─────┘ └─────┘ └─────┘    │
│         Load Balancer                │
│              │                       │
│         Port 8080                     │
└─────────────────────────────────────┘
2. Multi-Node Swarm (What's Possible)
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Node 1      │  │  Node 2      │  │  Node 3      │
│  (Manager)   │  │  (Worker)    │  │  (Worker)    │
│  App1 App2   │  │  App3 App4   │  │  App5 App6   │
└──────────────┘  └──────────────┘  └──────────────┘
         └──────────────┬──────────────┘
                    Load Balancer
3. The Critical Flag You Learned
--resolve-image never  # Tells Swarm: Use local images, don't pull from Docker Hub
This is essential for local development!

4. Load Balancing - Test Results Proved
Request 1 → instance: "dbbd1a9ed9f9"  ← Container 1
Request 2 → instance: "70c880c1d722"  ← Container 2  
Request 3 → instance: "08c06a668c3c"  ← Container 3
Request 4 → instance: "5d40c0ec00a5"  ← Container 4
Request 5 → instance: "dbbd1a9ed9f9"  ← Back to Container 1
Swarm's built-in load balancer distributed traffic across all 4 containers!

## Comparison: Docker vs Swarm
Feature	                        Docker Compose	                                Docker Swarm
---------                    ---------------------                   ---------------------------------
Scope	                       Single machine	                        Multiple machines (cluster)
Scaling	                       Manual (up --scale)	                    Automatic (service scale)
Load Balancing	                       No	                             Yes (built-in)
High Availability	                   No	                          Yes (restarts failed containers)
Rolling Updates	                       No	                             Yes (zero downtime)
Use Case	                       Development	                          Production

# Q1: What happens if one container crashes in a 4-replica service?
Swarm automatically restarts it. The other 3 keep serving traffic. Zero downtime!
# Q2: Why did we need --resolve-image never?
Swarm normally pulls images from Docker Hub. This flag tells it to use locally built images instead.
# Q3: How does Swarm distribute traffic?
Built-in internal load balancer uses round-robin to distribute requests across all replicas.


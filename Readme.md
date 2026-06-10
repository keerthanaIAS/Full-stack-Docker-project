## PART 1
1. Dockerfile = “How to build ONE app”

It defines:
how backend image is created
how frontend image is created

It answers:
“How do I package this app?”

2. docker-compose.yml = “How to run MANY apps together”

It defines:
backend
frontend
mongo
networking
volumes
ports

It answers:
“How do I connect and run everything together?”

3. Container = “Running process”

It is:
built from image
managed by compose or docker run

*Dockerfile vs YAML*

| Concept        | Dockerfile     | docker-compose.yml   |
| -------------- | -------------- | -------------------- |
| Purpose        | Build image    | Run system           |
| Scope          | Single service | Multi-service        |
| Output         | Image          | Running architecture |


## PART 2
*Backend:*
Dockerfile (build step):
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

What it means:
build node environment
install dependencies
copy code
define startup

*Frontend:*
Same idea:
build React app environment
run dev server

*Compose*
services:
  backend:
  frontend:
  mongo:

What it means:
start all services together
connect them internally
manage lifecycle

## PART 3
Without Dockerfile:-
You cannot:
build images consistently
move app between machines
Without Compose:-
You cannot:
run full system easily
manage multiple containers
define networks cleanly

Real truth:
Dockerfile = engineering your app
Compose = engineering your system


# PART 4 — Deep Docker Basics
Now we go step-by-step like debugging real systems.

## 1. Image vs Container (you must internalize this)

### Image

static blueprint

Example:
node:18 + your code + dependencies

### Container

running instance of that image

Like:
Image = class
Container = object

## 2. Port mapping (your setup)

5000:5000

Left = host machine
Right = container


### WHY IT MATTERS

Without it:
* backend exists
* but you CANNOT access it

## 3. Networking (MOST IMPORTANT concept)

Inside container:

```env
mongodb://mongo:27017
```

### Why not localhost?

Because:

* localhost = inside SAME container
* mongo is a DIFFERENT container

Docker creates internal DNS:

```
mongo → resolves to container IP
```


## 4. Volumes (your biggest learning unlock)

```yaml
./backend:/app
```

### What it really means:

“mirror my local code inside container”


### WHY node_modules exclusion exists:

```yaml
/app/node_modules
```

Because:

* host OS node_modules ≠ container node_modules
* mixing them breaks everything


# PART 5 — Docker lifecycle (real mental model)

When you run:

```bash
docker compose up
```

This happens:

### Step 1: Build images

* backend Dockerfile executed
* frontend Dockerfile executed


### Step 2: Create network

* backend ↔ mongo ↔ frontend


### Step 3: Start containers

* each service becomes a process


### Step 4: Attach logs

* you see output


# PART 6 — Advanced Docker concepts (using your project)

## 1. depends_on (important misconception)

```yaml
depends_on:
```

### It ONLY means:

start order

NOT:

* service is ready
* DB is connected


## 2. restart policies

```yaml
restart: always
```

container auto-recovers


## 3. environment variables

```yaml
environment:
  MONGO_URL:
```

external config injection


## 4. Docker caching (WHY builds are fast sometimes)

Each Dockerfile line = layer

If unchanged:
Docker reuses cache


## 5. image vs container separation (critical)

* image = reusable
* container = disposable

production mindset:
containers die, images survive


# PART 7 — What advanced Docker REALLY means

If someone says “advanced Docker,” it is NOT fancy commands.

It means:

## 1. Debugging broken systems

* logs
* exec into containers
* inspect networks


## 2. Multi-stage builds

* smaller images
* production optimization


## 3. Production networking

* reverse proxy (nginx)
* load balancing


## 4. CI/CD pipelines

* build → test → deploy automatically


## 5. Scaling containers

```bash
docker compose up --scale backend=3
```

# FINAL MENTAL MODEL (this is everything)

If you forget everything else, remember this:
Dockerfile → builds app
Compose → connects apps
Container → runs app
Volume → syncs code
Network → connects containers


If you're preparing for Docker and Docker Swarm demos/interviews, these are the most commonly used commands:-
------------------------------------------------------------------------------------------------------------

# Docker Commands

### List running containers

```bash
docker ps
```

### List all containers

```bash
docker ps -a
```

### List images

```bash
docker images
```

or

```bash
docker image ls
```

### View container logs

```bash
docker logs <container-id>
```

Follow logs:

```bash
docker logs -f <container-id>
```

### Enter a container

```bash
docker exec -it <container-id> sh
```

or

```bash
docker exec -it <container-id> bash
```

### Stop a container

```bash
docker stop <container-id>
```

### Start a container

```bash
docker start <container-id>
```

### Remove a container

```bash
docker rm <container-id>
```

### Remove an image

```bash
docker rmi <image-id>
```

### Build an image

```bash
docker build -t myapp .
```

### Run a container

```bash
docker run -d -p 3000:3000 myapp
```

### Inspect a container

```bash
docker inspect <container-id>
```

---

# Docker Network Commands

### List networks

```bash
docker network ls
```

### Inspect network

```bash
docker network inspect <network-name>
```

### Create network

```bash
docker network create my-network
```

---

# Docker Volume Commands

### List volumes

```bash
docker volume ls
```

### Inspect volume

```bash
docker volume inspect <volume-name>
```

### Remove volume

```bash
docker volume rm <volume-name>
```

---

# Docker Swarm Commands

### Initialize swarm

```bash
docker swarm init
```

### Leave swarm

Worker:

```bash
docker swarm leave
```

Manager:

```bash
docker swarm leave --force
```

### View swarm nodes

```bash
docker node ls
```

### Inspect node

```bash
docker node inspect <node-id>
```

---

# Service Commands

### List services

```bash
docker service ls
```

### Inspect service

```bash
docker service inspect <service-name>
```

Pretty output:

```bash
docker service inspect <service-name> --pretty
```

### View service tasks

```bash
docker service ps <service-name>
```

### View service logs

```bash
docker service logs <service-name>
```

Follow logs:

```bash
docker service logs -f <service-name>
```

### Scale service

```bash
docker service scale demo_user-service=5
```

### Update service

```bash
docker service update --force <service-name>
```

### Remove service

```bash
docker service rm <service-name>
```

---

# Stack Commands

### Deploy stack

```bash
docker stack deploy -c docker-compose.yml demo
```

### List stacks

```bash
docker stack ls
```

### List services in stack

```bash
docker stack services demo
```

### List tasks in stack

```bash
docker stack ps demo
```

### Remove stack

```bash
docker stack rm demo
```

---

# Useful Monitoring Commands

### Resource usage

```bash
docker stats
```

### Watch services continuously

```bash
watch docker service ls
```

### Watch containers continuously

```bash
watch docker ps
```

### Check health status

```bash
docker inspect <container-id> --format='{{.State.Health.Status}}'
```

---

For a Docker Swarm POC, the commands you'll use most often are:
---------------------------------------------------------------

```bash
docker swarm init
docker stack deploy -c docker-compose.yml demo
docker service ls
docker service ps demo_api-gateway
docker service logs -f demo_api-gateway
docker service scale demo_product-service=5
docker stack ps demo
docker node ls
docker stats
docker stack rm demo
docker swarm leave --force
```

These cover 90% of day-to-day Docker Swarm operations.
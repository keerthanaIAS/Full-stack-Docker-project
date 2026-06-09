Container works efficiently
# Phase 3 — Multi-Stage Build

## Problem

Look at your image:

```bash
docker images
```

You showed earlier:

```text
backend:v2      1.58GB
frontend:v1     1.58GB
```

For a simple Node app:

```text
1.58GB is huge
```

That's the problem Multi-Stage Build solves.

---

# Why is the image huge?

Typical build process:

```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm","start"]
```

Docker stores:

```text
Node runtime
npm
build tools
cache
source code
node_modules
dev dependencies
```

all in one image.

---

# Real Production Thinking

Ask yourself:

After application is built, does production need:

```text
npm
typescript compiler
webpack
eslint
test libraries
``` ?

Answer:

```text
No
```

Production only needs:

```text
Built application
Node runtime
```

---

# Multi-Stage Concept

Imagine two containers.

---

## Stage 1

Builder

```text
Install everything
Build application
Generate dist folder
```

---

## Stage 2

Production

```text
Copy only final output
Run application
```

---

Flow:

```text
Builder
   |
   | build
   v
dist
   |
   | copy
   v
Production Image
```

---

# Example Project

## Builder Stage

```dockerfile
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
```

Produces:

```text
dist/
```

---

## Production Stage

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["node","dist/server.js"]
```

---

# Important Line

```dockerfile
COPY --from=builder /app/dist ./dist
```

This means:

```text
Take files from builder stage
Copy into production stage
```

---

# Visual

Without Multi-Stage:

```text
Image
 ├── source code
 ├── node_modules
 ├── build tools
 ├── npm
 ├── caches
 └── application
```

---

With Multi-Stage:

```text
Image
 ├── node runtime
 └── application
```

Much smaller.

---

# Your Practical Task

Let's see the current image size.

Run:

```bash
docker images
```

Find:

```text
docker-lab-backend:v1
```

size.

---

# Create a New Dockerfile

we can still demonstrate multi-stage.

```dockerfile
# Stage 1
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Stage 2
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app .

CMD ["npm","start"]
```

---

Build:

```bash
docker build -t docker-lab-backend:multistage .
```

---

Check:

```bash
docker images
```

Compare:

```text
docker-lab-backend:v1
docker-lab-backend:multistage
```

---

# Why Production Uses It

Benefits:

### Smaller Image

```text
1.5GB
 ↓
200MB-300MB
```

---

### Faster Deployments

```text
Smaller image
↓
Less download time
↓
Faster deployments
```

---

### Better Security

Less software inside:

```text
Less attack surface
```

---

### Lower Storage Cost

```text
Registry stores less data
```

---

# Interview Question

**Why use Multi-Stage Build?**

Answer:

> Multi-stage builds separate the build environment from the runtime environment. This allows us to copy only the required application artifacts into the final image, reducing image size, improving security, and speeding up deployments.

---

# What You Should Understand

Don't memorize:

```dockerfile
COPY --from=builder
```

Understand the idea:

```text
Stage 1 = Build
Stage 2 = Run
```

Production containers should contain:

```text
Only what is needed to run
```

not

```text
Everything needed to build
```

That's the entire purpose of Multi-Stage Build.

---

## One-line definition:-
Multi-stage build is used to create smaller and more secure Docker images by separating the build stage from the runtime stage and copying only the required artifacts to production.

COPY --from=builder
COPY --from=builder copies files from the builder stage into the final runtime image, so only the necessary build output is included in production.

*model*
Stage 1 (builder)
    ↓
Build app
    ↓
dist / compiled files
    ↓
COPY --from=builder
    ↓
Stage 2 (production)


## Simple rule:-
--------------
COPY --from=builder /app .

= copy entire application

COPY --from=builder /app/dist ./dist

= copy only build artifacts

## **why the size changed from 213MB → 245MB.**

### Version 1 (213MB)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

CMD ["node","dist/app.js"]
```

Final image contains roughly:

```text
node:20-alpine
+
dist/
```

That's it.

So:

```text
~213MB
```

---

### Version 2 (245MB)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
```

Now final image contains:

```text
node:20-alpine
+
dist/
+
node_modules
```

because of:

```dockerfile
RUN npm install --omit=dev
```

---

### Where did the extra 32MB come from?

This command:

```dockerfile
RUN npm install --omit=dev
```

downloads and installs your production dependencies:

```text
express
cors
redis
axios
...
```

Those packages are stored in:

```text
/app/node_modules
```

inside the final image.

So:

```text
213MB
+
32MB node_modules
=
245MB
```

approximately.

---

### Why do we need this line then?

Because your application usually needs dependencies.

Imagine:

```js
const express = require("express");
```

When Node starts:

```bash
node dist/app.js
```

it looks for:

```text
node_modules/express
```

If you never install dependencies in the final image:

```dockerfile
COPY --from=builder /app/dist ./dist
```

then:

```text
node_modules
❌ missing
```

and you'll get:

```text
Error: Cannot find module 'express'
```

---

### Production pattern

Builder:

```dockerfile
RUN npm install
RUN npm run build
```

Runtime:

```dockerfile
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
```

Result:

```text
Source code          ❌
Tests                ❌
Dev dependencies     ❌
Build tools          ❌
Production deps      ✅
Compiled app         ✅
```

---

### learned

#### 213MB image

```text
node:20-alpine
+
dist
```

No runtime dependencies installed.

---

#### 245MB image

```text
node:20-alpine
+
dist
+
production node_modules
```

Runtime dependencies installed.

---

### One-line interview answer

> The image size increased from 213MB to 245MB because `npm install --omit=dev` installs production dependencies into the final image. The extra size comes from `node_modules`, which are required for the application to run in production.

## Terminal Logs:
keerthana@Keerthanas-MacBook-Air multi-stage-build % docker build -t docker-lab-backend:multistage .
[+] Building 5.3s (15/15) FINISHED                                                                         docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 744B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:20                                                                 1.2s
 => [internal] load metadata for docker.io/library/node:20-alpine                                                          1.2s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 2B                                                                                            0.0s
 => [builder 1/6] FROM docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5   0.0s
 => => resolve docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5           0.0s
 => [internal] load build context                                                                                          0.0s
 => => transferring context: 831B                                                                                          0.0s
 => [stage-1 1/3] FROM docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609  0.0s
 => => resolve docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293    0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                      0.0s
 => CACHED [builder 2/6] WORKDIR /app                                                                                      0.0s
 => CACHED [builder 3/6] COPY package*.json ./                                                                             0.0s
 => [builder 4/6] RUN npm install                                                                                          2.7s
 => [builder 5/6] COPY . .                                                                                                 0.0s
 => [builder 6/6] RUN npm run build                                                                                        0.4s
 => [stage-1 3/3] COPY --from=builder /app/dist ./dist                                                                     0.2s 
 => exporting to image                                                                                                     0.6s 
 => => exporting layers                                                                                                    0.3s
 => => exporting manifest sha256:ca966d9135e8853c181d619b75a7d174d0d5fe0365dfc7c4df1423b4b84ac03c                          0.0s
 => => exporting config sha256:ea1a6108a8367fbaa5f1bcfe78a48efd38e28f0be9cc34fe84ebcdf5adefbb3c                            0.0s
 => => exporting attestation manifest sha256:3b571b3507f696025f95fbb96263ee95d5aa8e6e336b8bcb6be3234304786874              0.0s
 => => exporting manifest list sha256:dd9ab98ffcbc159fa002bd89f704d0b4b7a3f900d020c3fd55d734cea7a2978a                     0.0s
 => => naming to docker.io/library/docker-lab-backend:multistage                                                           0.0s
 => => unpacking to docker.io/library/docker-lab-backend:multistage                                                        0.2s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/vi7ba91x6wreynz51ju8sop33
keerthana@Keerthanas-MacBook-Air multi-stage-build % docker images                                  
REPOSITORY           TAG          IMAGE ID       CREATED             SIZE
docker-lab-backend   multistage   dd9ab98ffcbc   7 seconds ago       213MB
docker-lab-backend   v2           2ebff2689fdb   23 minutes ago      1.61GB
docker-lab-backend   v1           e4501e7aa6d5   About an hour ago   1.61GB
frontend             v1           4d03027591c7   20 hours ago        1.58GB
redis                latest       aa049e689e14   13 days ago         227MB
keerthana@Keerthanas-MacBook-Air multi-stage-build % docker build -t docker-lab-backend:multistage .
[+] Building 6.2s (17/17) FINISHED                                                                         docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 885B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:20-alpine                                                          1.8s
 => [internal] load metadata for docker.io/library/node:20                                                                 1.8s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 2B                                                                                            0.0s
 => [builder 1/6] FROM docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5   0.0s
 => => resolve docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5           0.0s
 => [internal] load build context                                                                                          0.0s
 => => transferring context: 972B                                                                                          0.0s
 => [stage-1 1/5] FROM docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609  0.0s
 => => resolve docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293    0.0s
 => CACHED [stage-1 2/5] WORKDIR /app                                                                                      0.0s
 => CACHED [builder 2/6] WORKDIR /app                                                                                      0.0s
 => CACHED [builder 3/6] COPY package*.json ./                                                                             0.0s
 => CACHED [builder 4/6] RUN npm install                                                                                   0.0s
 => [stage-1 3/5] COPY package*.json ./                                                                                    0.0s
 => [builder 5/6] COPY . .                                                                                                 0.0s
 => [stage-1 4/5] RUN npm install --omit=dev                                                                               3.0s
 => [builder 6/6] RUN npm run build                                                                                        0.5s
 => [stage-1 5/5] COPY --from=builder /app/dist ./dist                                                                     0.2s 
 => exporting to image                                                                                                     0.9s 
 => => exporting layers                                                                                                    0.4s 
 => => exporting manifest sha256:bd53dadc64584aae33ad3f8d4f9a42a6e3372dc65ab478ee98f3a8f36db4e543                          0.0s
 => => exporting config sha256:8e0b823c3fe60bd635192ea626e8e8d1cd5c4d12b6e953862f93c72cea047d01                            0.0s
 => => exporting attestation manifest sha256:e6dbb028175b05b411cbbf7e21b941036a12dfa4e696ac0be5f23c72588e12f0              0.0s
 => => exporting manifest list sha256:34830e2811180d4924543ef45b8b5f3c2dc77e143655234a34e514d8da585cb9                     0.0s
 => => naming to docker.io/library/docker-lab-backend:multistage                                                           0.0s
 => => unpacking to docker.io/library/docker-lab-backend:multistage                                                        0.5s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/tdflsdvsm3vzp5ttzgqfy2fdr
keerthana@Keerthanas-MacBook-Air multi-stage-build % docker images                                  
REPOSITORY           TAG          IMAGE ID       CREATED             SIZE
docker-lab-backend   multistage   34830e281118   5 seconds ago       245MB
docker-lab-backend   v2           2ebff2689fdb   25 minutes ago      1.61GB
docker-lab-backend   v1           e4501e7aa6d5   About an hour ago   1.61GB
frontend             v1           4d03027591c7   20 hours ago        1.58GB
redis                latest       aa049e689e14   13 days ago         227MB

*without dist if i give node:20 apline how the size reduces* -> Because node:20-alpine uses a minimal Alpine Linux base image instead of the much larger Debian-based node:20, so the final image size drops significantly even if you copy the entire /app folder.

*dist/* contains only the built application files needed to run in production, so instead of copying the entire project (source code, dev files, configs, etc.), you copy only the final output and make the image smaller and cleaner.

*dist/* = compiled/processed production-ready code generated from your source files.

## Without dist:

You run source code directly:
app.js
routes/
controllers/
services/

Docker runs:
node app.js

Everything is copied into the image.

## With dist

You first build the project:
npm run build

and generate:
dist/
 ├── app.js
 ├── routes/
 ├── controllers/
 └── services/

The dist folder contains the compiled output of your application.

Then Docker copies only:
COPY --from=builder /app/dist ./dist

and runs:
node dist/app.js

## if i install npm in stage 1 why i need to install again in stage 2?

Stage 1 and Stage 2 are completely separate containers.

When you do:

# Stage 1
FROM node:20 AS builder

RUN npm install

the node_modules are installed only inside the builder stage.

When Docker starts Stage 2:

FROM node:20-alpine

it creates a new image from scratch.

# Stage 2 does not automatically get:

node_modules ❌
package.json ❌
dist ❌
source code ❌

from Stage 1.

You must explicitly copy what you need:

COPY --from=builder /app/dist ./dist

That's why you install again:

COPY package*.json ./
RUN npm install --omit=dev

to create a fresh node_modules containing only production packages.

*NOTE* -> exact reason to reinstall where we start FROM it will start image there so its new.
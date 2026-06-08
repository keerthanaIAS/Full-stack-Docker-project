This line:
```yaml
volumes:
  mongo_data:
```
means:
defines a **named Docker volume** called `mongo_data`.

Then this line:
```yaml
- mongo_data:/data/db
```
means:
* `mongo_data` → Docker-managed storage (outside the container)
* `/data/db` → MongoDB's data folder inside the container

So Docker mounts the volume into MongoDB's database directory.

### Flow
```text
Mongo writes data
        ↓
/data/db (inside container)
        ↓
mongo_data volume (stored by Docker)
```

### Why?
Without a volume:

```text
Container deleted
      ↓
Database data lost
```

With a volume:

```text
Container deleted
      ↓
mongo_data volume remains
      ↓
New container can reuse the same data
```

One-line explanation:
```yaml
mongo_data:/data/db
```
= "Store MongoDB data in a Docker volume so the data survives container restarts and deletions."

*i need to do this practival so give me the ymal file and commands to run and see how its storing and also i need next concept two container image use the sharing volume* :-

# Experiment 1: Persistent MongoDB Volume

### docker-compose.yml

```yaml
version: "3.9"

services:
  mongo:
    image: mongo
    container_name: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Start

```bash
docker compose up -d
```

### Check Volume Created

```bash
docker volume ls
```

Output:

```bash
DRIVER    VOLUME NAME
local     yourfolder_mongo_data
```

### See Where Docker Stores It

```bash
docker volume inspect yourfolder_mongo_data
```

Output:

```json
[
  {
    "Mountpoint": "/var/lib/docker/volumes/yourfolder_mongo_data/_data"
  }
]
```

This is the actual location on your machine.

---

### Insert Data

Enter Mongo:

```bash
docker exec -it mongo mongosh
```

Run:

```javascript
use test

db.users.insertOne({
  name: "Keerthana"
})
```

Verify:

```javascript
db.users.find()
```

---

### Delete Container

```bash
docker rm -f mongo
```

Container gone.

---

### Create Again

```bash
docker compose up -d
```

Enter Mongo:

```bash
docker exec -it mongo mongosh
```

Check:

```javascript
use test

db.users.find()
```

You will still see:

```json
{
  "name":"Keerthana"
}
```

because data was stored in the volume, not the container.

---

# Experiment 2: Share One Volume Between Two Containers

### docker-compose.yml

```yaml
version: "3.9"

services:
  writer:
    image: ubuntu
    container_name: writer
    command: tail -f /dev/null
    volumes:
      - shared_data:/shared

  reader:
    image: ubuntu
    container_name: reader
    command: tail -f /dev/null
    volumes:
      - shared_data:/shared

volumes:
  shared_data:
```

Start:

```bash
docker compose up -d
```

---

## Container 1 Writes

Enter writer:

```bash
docker exec -it writer bash
```

Create file:

```bash
echo "hello from writer" > /shared/test.txt
```

Check:

```bash
cat /shared/test.txt
```

Exit.

---

## Container 2 Reads

Enter reader:

```bash
docker exec -it reader bash
```

Read file:

```bash
cat /shared/test.txt
```

Output:

```text
hello from writer
```

Same file.

Why?

```text
Writer Container
      |
      v
/shared
      |
      v
shared_data volume
      ^
      |
/shared
      |
      v
Reader Container
```

Both containers are mounting the same Docker volume.

---

### One-line summary

```yaml
mongo_data:/data/db
```

= Mount Docker volume `mongo_data` into container folder `/data/db`.

```yaml
shared_data:/shared
```

= Both containers see the same storage, so one can write and the other can read.

*Terminal Logs for one image sharing* : -
------------------------------------------
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose up -d
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] Running 4/5
 ✔ Network full-stack-docker-project_default            Created                                                            0.0s 
 ✔ Container full-stack-docker-project-mongo-1          Started                                                            2.1s 
 ✔ Container full-stack-docker-project-mongo-express-1  Started                                                            2.2s 
 ⠦ Container full-stack-docker-project-backend-1        Starting                                                           2.2s 
 ✔ Container full-stack-docker-project-frontend-1       Created                                                            1.3s 
Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:5000 -> 127.0.0.1:0: listen tcp 0.0.0.0:5000: bind: address already in use
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker volume ls
DRIVER    VOLUME NAME
local     ff4af2604c61ec603ae9e39f547fa81813dd94cc8c44fa7d7e4ec7c6c907a05f
local     full-stack-docker-project_mongo_data
local     kafka-commerce_kafka1-data
local     kafka-commerce_kafka2-data
local     kafka-commerce_kafka3-data
local     kafka-commerce_mongo-data
local     redis-docker-2r-3s_redisinsight_data
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker volume inspect full-stack-docker-project_mongo_data
[
    {
        "CreatedAt": "2026-06-03T11:50:30Z",
        "Driver": "local",
        "Labels": {
            "com.docker.compose.config-hash": "54ed3ada146fa40553924b5f57f02369b3f8b0c57a2ab060a99da2fb6e387411",
            "com.docker.compose.project": "full-stack-docker-project",
            "com.docker.compose.version": "2.39.1",
            "com.docker.compose.volume": "mongo_data"
        },
        "Mountpoint": "/var/lib/docker/volumes/full-stack-docker-project_mongo_data/_data",
        "Name": "full-stack-docker-project_mongo_data",
        "Options": null,
        "Scope": "local"
    }
]
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker ps
CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS         PORTS                                             NAMES
c0c8cef23e72   mongo-express:latest   "/sbin/tini -- /dock…"   8 minutes ago   Up 8 minutes   0.0.0.0:8081->8081/tcp, [::]:8081->8081/tcp       full-stack-docker-project-mongo-express-1
3533d3b9d5db   mongo                  "docker-entrypoint.s…"   8 minutes ago   Up 8 minutes   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp   full-stack-docker-project-mongo-1
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker exec -it full-stack-docker-project-mongo-1 mongosh
Current Mongosh Log ID: 6a225a8db24893c047d1a7ba
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.8.3
Using MongoDB:          undefined
Using Mongosh:          2.8.3

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/


To help improve our products, anonymous usage data is collected and sent to MongoDB periodically (https://www.mongodb.com/legal/privacy-policy).
You can opt-out by running the disableTelemetry() command.

test> use test
already on db test
test> db.users.insertOne({
|   name: "Keerthana"
| })
MongoServerError[Unauthorized]: Command insert requires authentication
test> db.users.insertOne({ name: "Keerthana" })
MongoServerError[Unauthorized]: Command insert requires authentication
test> use admin
switched to db admin
admin> db.auth("admin", "secret")
{ ok: 1 }
admin> use test
switched to db test
test> db.users.insertOne({ name: "Keerthana" })
{
  acknowledged: true,
  insertedId: ObjectId('6a225af3b24893c047d1a7bd')
}
test> db.users.find()
[ { _id: ObjectId('6a225af3b24893c047d1a7bd'), name: 'Keerthana' } ]
test> 

*delete the container and see the log* :-

keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose down
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] Running 5/5
 ✔ Container full-stack-docker-project-frontend-1       Removed                                                            0.0s 
 ✔ Container full-stack-docker-project-mongo-express-1  Removed                                                            0.2s 
 ✔ Container full-stack-docker-project-backend-1        Removed                                                            0.0s 
 ✔ Container full-stack-docker-project-mongo-1          Removed                                                            0.3s 
 ✔ Network full-stack-docker-project_default            Removed                                                            0.2s 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose up -d
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] Running 4/5
 ✔ Network full-stack-docker-project_default            Created                                                            0.0s 
 ✔ Container full-stack-docker-project-mongo-1          Started                                                            1.1s 
 ⠸ Container full-stack-docker-project-backend-1        Starting                                                           1.2s 
 ✔ Container full-stack-docker-project-mongo-express-1  Started                                                            1.2s 
 ✔ Container full-stack-docker-project-frontend-1       Created                                                            0.7s 
Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:5000 -> 127.0.0.1:0: listen tcp 0.0.0.0:5000: bind: address already in use
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker exec -it full-stack-docker-project-mongo-1 mongosh
Current Mongosh Log ID: 6a225c141b1493e7a7d1a7ba
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.8.3
Using MongoDB:          undefined
Using Mongosh:          2.8.3

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/

test> show dbs
MongoServerError[Unauthorized]: Command listDatabases requires authentication
test> use admin
switched to db admin
admin> db.auth("admin","secret")
{ ok: 1 }
admin> use test
switched to db test
test> db.users.find()
[ { _id: ObjectId('6a225af3b24893c047d1a7bd'), name: 'Keerthana' } ]
test> 
## after removed container also the data is safe

*Terminal Logs for multiple image sharing* : -
--------------------------------------------
First: Understanding the Path
The path in volume is NOT an API endpoint! It's a folder path inside the container (like a directory on your computer).

yaml
volumes:
  - shared_uploads:/app/uploads  
  # ↑                ↑
  # Volume name      Folder path INSIDE container
  # (Docker storage) (NOT a URL!)
Analogy:

/app/uploads = C:\MyProject\uploads on Windows
It's just a folder where files live

## Terminal logs:-
---------------
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose ps
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
NAME                                        IMAGE                  COMMAND                  SERVICE         CREATED          STATUS          PORTS
full-stack-docker-project-mongo-1           mongo                  "docker-entrypoint.s…"   mongo           40 seconds ago   Up 39 seconds   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp
full-stack-docker-project-mongo-express-1   mongo-express:latest   "/sbin/tini -- /dock…"   mongo-express   40 seconds ago   Up 39 seconds   0.0.0.0:8081->8081/tcp, [::]:8081->8081/tcp
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose ps -a
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
NAME                                        IMAGE                                COMMAND                  SERVICE         CREATED              STATUS                          PORTS
full-stack-docker-project-backend-1         full-stack-docker-project-backend    "docker-entrypoint.s…"   backend         About a minute ago   Exited (1) About a minute ago   
full-stack-docker-project-frontend-1        full-stack-docker-project-frontend   "docker-entrypoint.s…"   frontend        About a minute ago   Exited (1) About a minute ago   
full-stack-docker-project-mongo-1           mongo                                "docker-entrypoint.s…"   mongo           About a minute ago   Up About a minute               0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp
full-stack-docker-project-mongo-express-1   mongo-express:latest                 "/sbin/tini -- /dock…"   mongo-express   About a minute ago   Up About a minute               0.0.0.0:8081->8081/tcp, [::]:8081->8081/tcp
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose logs backend
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
backend-1  | npm error Missing script: "dev"
backend-1  | npm error
backend-1  | npm error To see a list of scripts, run:
backend-1  | npm error   npm run
backend-1  | npm error A complete log of this run can be found in: /root/.npm/_logs/2026-06-05T05_52_34_103Z-debug-0.log
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose logs frontend
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
frontend-1  | 
frontend-1  | > frontend@0.0.0 dev
frontend-1  | > vite
frontend-1  | 
frontend-1  | You are using Node.js 18.20.8. Vite requires Node.js version 20.19+ or 22.12+. Please upgrade your Node.js version.
frontend-1  | file:///app/node_modules/vite/dist/node/cli.js:541
frontend-1  |                           this.dispatchEvent(new CustomEvent("command:!", { detail: command }));
frontend-1  |                                                  ^
frontend-1  | 
frontend-1  | ReferenceError: CustomEvent is not defined
frontend-1  |     at CAC.parse (file:///app/node_modules/vite/dist/node/cli.js:541:28)
frontend-1  |     at file:///app/node_modules/vite/dist/node/cli.js:834:5
frontend-1  |     at ModuleJob.run (node:internal/modules/esm/module_job:195:25)
frontend-1  |     at async ModuleLoader.import (node:internal/modules/esm/loader:337:24)
frontend-1  | 
frontend-1  | Node.js v18.20.8
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose down
docker compose build --no-cache
docker compose up -d
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] Running 5/5
 ✔ Container full-stack-docker-project-mongo-express-1  Removed                                                            0.2s 
 ✔ Container full-stack-docker-project-frontend-1       Removed                                                            0.0s 
 ✔ Container full-stack-docker-project-backend-1        Removed                                                            0.0s 
 ✔ Container full-stack-docker-project-mongo-1          Removed                                                            0.3s 
 ✔ Network full-stack-docker-project_default            Removed                                                            0.2s 
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
#1 [internal] load local bake definitions
#1 reading from stdin 1.19kB done
#1 DONE 0.0s

#2 [frontend internal] load build definition from Dockerfile
#2 transferring dockerfile: 152B done
#2 DONE 0.0s

#3 [backend internal] load build definition from Dockerfile
#3 transferring dockerfile: 152B done
#3 DONE 0.0s

#4 [frontend internal] load metadata for docker.io/library/node:20
#4 DONE 0.1s

#5 [frontend internal] load .dockerignore
#5 transferring context: 2B done
#5 DONE 0.0s

#6 [frontend 1/5] FROM docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5
#6 resolve docker.io/library/node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5 0.0s done
#6 DONE 0.1s

#7 [frontend internal] load build context
#7 ...

#8 [frontend 2/5] WORKDIR /app
#8 DONE 0.0s

#7 [frontend internal] load build context
#7 transferring context: 481.09kB 0.4s done
#7 DONE 0.4s

#9 [frontend 3/5] COPY package*.json ./
#9 DONE 0.0s

#10 [backend internal] load metadata for docker.io/library/node:18
#10 ...

#11 [frontend 4/5] RUN npm install
#11 0.890 npm warn EBADENGINE Unsupported engine {
#11 0.890 npm warn EBADENGINE   package: '@rolldown/plugin-babel@0.2.3',
#11 0.890 npm warn EBADENGINE   required: { node: '>=22.12.0 || ^24.0.0' },
#11 0.890 npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }
#11 0.890 npm warn EBADENGINE }
#11 3.065 
#11 3.065 added 185 packages, and audited 186 packages in 3s
#11 3.065 
#11 3.065 49 packages are looking for funding
#11 3.065   run `npm fund` for details
#11 3.066 
#11 3.066 found 0 vulnerabilities
#11 3.067 npm notice
#11 3.067 npm notice New major version of npm available! 10.8.2 -> 11.16.0
#11 3.067 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
#11 3.067 npm notice To update run: npm install -g npm@11.16.0
#11 3.067 npm notice
#11 DONE 3.5s

#12 [frontend 5/5] COPY . .
#12 ...

#10 [backend internal] load metadata for docker.io/library/node:18
#10 DONE 5.0s

#13 [backend internal] load .dockerignore
#13 transferring context: 2B done
#13 DONE 0.0s

#14 [backend 1/5] FROM docker.io/library/node:18@sha256:c6ae79e38498325db67193d391e6ec1d224d96c693a8a4d943498556716d3783
#14 resolve docker.io/library/node:18@sha256:c6ae79e38498325db67193d391e6ec1d224d96c693a8a4d943498556716d3783 0.0s done
#14 DONE 0.0s

#15 [backend 2/5] WORKDIR /app
#15 CACHED

#16 [backend internal] load build context
#16 transferring context: 143.83kB 0.1s done
#16 DONE 0.2s

#17 [backend 3/5] COPY package*.json ./
#17 DONE 0.2s

#12 [frontend 5/5] COPY . .
#12 DONE 2.0s

#18 [backend 4/5] RUN npm install
#18 0.910 npm warn EBADENGINE Unsupported engine {
#18 0.910 npm warn EBADENGINE   package: 'bson@7.2.0',
#18 0.910 npm warn EBADENGINE   required: { node: '>=20.19.0' },
#18 0.910 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#18 0.910 npm warn EBADENGINE }
#18 0.911 npm warn EBADENGINE Unsupported engine {
#18 0.911 npm warn EBADENGINE   package: 'mongodb@7.2.0',
#18 0.911 npm warn EBADENGINE   required: { node: '>=20.19.0' },
#18 0.911 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#18 0.911 npm warn EBADENGINE }
#18 0.912 npm warn EBADENGINE Unsupported engine {
#18 0.912 npm warn EBADENGINE   package: 'mongodb-connection-string-url@7.0.1',
#18 0.912 npm warn EBADENGINE   required: { node: '>=20.19.0' },
#18 0.912 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#18 0.912 npm warn EBADENGINE }
#18 0.912 npm warn EBADENGINE Unsupported engine {
#18 0.912 npm warn EBADENGINE   package: 'mongoose@9.6.3',
#18 0.912 npm warn EBADENGINE   required: { node: '>=20.19.0' },
#18 0.912 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#18 0.912 npm warn EBADENGINE }
#18 0.912 npm warn EBADENGINE Unsupported engine {
#18 0.912 npm warn EBADENGINE   package: 'mquery@6.0.0',
#18 0.912 npm warn EBADENGINE   required: { node: '>=20.19.0' },
#18 0.912 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#18 0.912 npm warn EBADENGINE }
#18 2.065 
#18 2.065 added 112 packages, and audited 113 packages in 2s
#18 2.065 
#18 2.065 32 packages are looking for funding
#18 2.065   run `npm fund` for details
#18 2.066 
#18 2.066 found 0 vulnerabilities
#18 2.067 npm notice
#18 2.067 npm notice New major version of npm available! 10.8.2 -> 11.16.0
#18 2.067 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
#18 2.067 npm notice To update run: npm install -g npm@11.16.0
#18 2.067 npm notice
#18 DONE 2.2s

#19 [frontend] exporting to image
#19 exporting layers
#19 ...

#20 [backend 5/5] COPY . .
#20 DONE 0.6s

#21 [backend] exporting to image
#21 exporting layers 0.8s done
#21 exporting manifest sha256:9b0bae8652ffafa5f3936561ca6dd732994199d9e06b6eca70637509cf017e0c
#21 exporting manifest sha256:9b0bae8652ffafa5f3936561ca6dd732994199d9e06b6eca70637509cf017e0c done
#21 exporting config sha256:253b6d556fb037f54eea2e53318ed29fbd77ab33519a8f1eb17680f855a03f3b done
#21 exporting attestation manifest sha256:47c232343a9730668b8d3c8c1b129f4bec2a6db4bf56eeda746b5e861f17ae29 0.0s done
#21 exporting manifest list sha256:1890b97093ab83f0d299ad3b8997a0999ea2752625d8ef9b7c16258991171970 done
#21 naming to docker.io/library/full-stack-docker-project-backend:latest done
#21 unpacking to docker.io/library/full-stack-docker-project-backend:latest
#21 unpacking to docker.io/library/full-stack-docker-project-backend:latest 0.4s done
#21 DONE 1.4s

#22 [backend] resolving provenance for metadata file
#22 DONE 0.0s

#19 [frontend] exporting to image
#19 exporting layers 6.3s done
#19 exporting manifest sha256:ed5e4d4dcf90a68750f39bbec840ac6788188a4d81434191246f631b4e93ea7c
#19 exporting manifest sha256:ed5e4d4dcf90a68750f39bbec840ac6788188a4d81434191246f631b4e93ea7c 0.0s done
#19 exporting config sha256:0a7308e094595ab7c8c7270cafb972d80af3ac13ec3df20a4a7597cbff26ab3f done
#19 exporting attestation manifest sha256:630f3bf34ec23b5f63b5e3605505bca6761ab25b306e89bd72d6a2bcef43e8c7 0.0s done
#19 exporting manifest list sha256:82709d6d074b76b9b3a0e559c586da4aca0ede34c3591815edb7f15bea6c808f done
#19 naming to docker.io/library/full-stack-docker-project-frontend:latest done
#19 unpacking to docker.io/library/full-stack-docker-project-frontend:latest
#19 unpacking to docker.io/library/full-stack-docker-project-frontend:latest 1.8s done
#19 DONE 8.2s

#23 [frontend] resolving provenance for metadata file
#23 DONE 0.0s
[+] Building 2/2
 ✔ full-stack-docker-project-backend   Built                                                                               0.0s 
 ✔ full-stack-docker-project-frontend  Built                                                                               0.0s 
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] Running 5/5
 ✔ Network full-stack-docker-project_default            Created                                                            0.0s 
 ✔ Container full-stack-docker-project-mongo-1          Started                                                            1.8s 
 ✔ Container full-stack-docker-project-mongo-express-1  Started                                                            1.5s 
 ✔ Container full-stack-docker-project-backend-1        Started                                                            1.6s 
 ✔ Container full-stack-docker-project-frontend-1       Started                                                            1.5s 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose ps -a        
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
NAME                                        IMAGE                                COMMAND                  SERVICE         CREATED         STATUS         PORTS
full-stack-docker-project-backend-1         full-stack-docker-project-backend    "docker-entrypoint.s…"   backend         6 seconds ago   Up 5 seconds   0.0.0.0:5000->5000/tcp, [::]:5000->5000/tcp
full-stack-docker-project-frontend-1        full-stack-docker-project-frontend   "docker-entrypoint.s…"   frontend        6 seconds ago   Up 4 seconds   0.0.0.0:5173->5173/tcp, [::]:5173->5173/tcp
full-stack-docker-project-mongo-1           mongo                                "docker-entrypoint.s…"   mongo           7 seconds ago   Up 5 seconds   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp
full-stack-docker-project-mongo-express-1   mongo-express:latest                 "/sbin/tini -- /dock…"   mongo-express   6 seconds ago   Up 5 seconds   0.0.0.0:8081->8081/tcp, [::]:8081->8081/tcp
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend sh -c "echo 'User profile picture' > /app/uploads/avatar.jpg"
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend ls -l /app/uploads
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
total 4
-rw-r--r-- 1 root root 21 Jun  5 05:58 avatar.jpg
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec mongo-express cat /data/uploads/avatar.jpg
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
User profile picture
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec mongo-express sh -c "echo 'Admin document' > /data/uploads/admin.doc"
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend cat /app/uploads/admin.doc
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
Admin document
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend ls -la /app/uploads/
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
total 12
drwxr-xr-x  2 root root 4096 Jun  5 06:00 .
drwxr-xr-x 13 root root  416 Jun  5 05:52 ..
-rw-r--r--  1 root root   15 Jun  5 06:00 admin.doc
-rw-r--r--  1 root root   21 Jun  5 05:58 avatar.jpg
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % 

*above terminal output for this scenario*:
Example 1: Shared Uploads (Backend + mongo-express)
Why needed?
When users upload files (profile pictures, documents), backend saves them. mongo-express needs to view/manage these files.

Real scenario:
javascript
// Your backend code (Node.js)
app.post('/upload', (req, res) => {
  const file = req.files.image;
  file.mv('/app/uploads/' + file.name);  // Saves to shared volume
});
How to test:
bash
# 1. Create a file in backend's uploads folder
docker compose exec backend sh -c "echo 'User profile picture' > /app/uploads/avatar.jpg"

# 2. Check if mongo-express can see it
docker compose exec mongo-express cat /data/uploads/avatar.jpg
# Output: User profile picture ✅

# 3. Create from mongo-express side
docker compose exec mongo-express sh -c "echo 'Admin document' > /data/uploads/admin.doc"

# 4. Verify backend can see it
docker compose exec backend cat /app/uploads/admin.doc
# Output: Admin document ✅

# 5. List all files
docker compose exec backend ls -la /app/uploads/

Where data is stored:
bash
# Data is in Docker volume (not on your computer)
docker volume inspect full-stack-docker-project_shared_uploads
# Shows: "Mountpoint": "/var/lib/docker/volumes/.../_data"

Useful for:
User avatars
Document uploads
Product images
Any file users upload

## Terminal logs:-
---------------
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose down -v
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] Running 9/9
 ✔ Container full-stack-docker-project-mongo-express-1  Removed                                                            0.6s 
 ✔ Container full-stack-docker-project-frontend-1       Removed                                                            1.4s 
 ✔ Container full-stack-docker-project-backend-1        Removed                                                            1.0s 
 ✔ Container full-stack-docker-project-mongo-1          Removed                                                            0.3s 
 ✔ Volume full-stack-docker-project_shared_uploads      Removed                                                            0.0s 
 ✔ Volume full-stack-docker-project_shared_logs         Removed                                                            0.0s 
 ✔ Volume full-stack-docker-project_mongo_data          Removed                                                            0.0s 
 ✔ Volume full-stack-docker-project_shared_config       Removed                                                            0.0s 
 ✔ Network full-stack-docker-project_default            Removed                                                            0.2s 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose up -d                                     
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] Running 9/9
 ✔ Network full-stack-docker-project_default            Created                                                            0.0s 
 ✔ Volume "full-stack-docker-project_shared_uploads"    Created                                                            0.0s 
 ✔ Volume "full-stack-docker-project_shared_logs"       Created                                                            0.0s 
 ✔ Volume "full-stack-docker-project_shared_config"     Created                                                            0.0s 
 ✔ Volume "full-stack-docker-project_mongo_data"        Created                                                            0.0s 
 ✔ Container full-stack-docker-project-mongo-1          Started                                                            3.8s 
 ✔ Container full-stack-docker-project-backend-1        Started                                                            3.9s 
 ✔ Container full-stack-docker-project-mongo-express-1  Started                                                            3.9s 
 ✔ Container full-stack-docker-project-frontend-1       Started                                                            3.3s 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend sh -c "echo 'Backend error: DB timeout' > /app/logs/error.log"

WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec frontend cat /app/logs/error.log
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
Backend error: DB timeout
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec frontend sh -c "echo 'Frontend: User clicked button' > /app/logs/frontend.log"
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend cat /app/logs/frontend.log
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
Frontend: User clicked button
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend ls -la /app/logs/
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
total 12
drwxr-xr-x  2 root root 4096 Jun  5 06:31 .
drwxr-xr-x 13 root root  416 Jun  5 05:52 ..
-rw-r--r--  1 root root   26 Jun  5 06:31 error.log
-rw-r--r--  1 root root   30 Jun  5 06:31 frontend.log
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % 

*above terminal output for this scenario*:
Example 2: Shared Logs (Backend + Frontend)
Why needed?
Both backend and frontend write logs. You want all logs in ONE place for debugging.

Real scenario:
javascript
// Backend code
app.use((req, res, next) => {
  fs.appendFileSync('/app/logs/backend.log', `${Date.now()}: ${req.url}\n`);
  next();
});

// Frontend code (if using Next.js or similar)
// Writes to /app/logs/frontend.log
How to test:
bash
# 1. Backend writes a log
docker compose exec backend sh -c "echo 'Backend error: DB timeout' > /app/logs/error.log"

# 2. Frontend reads the log
docker compose exec frontend cat /app/logs/error.log
# Output: Backend error: DB timeout ✅

# 3. Frontend writes its own log
docker compose exec frontend sh -c "echo 'Frontend: User clicked button' > /app/logs/frontend.log"

# 4. Backend reads frontend's log
docker compose exec backend cat /app/logs/frontend.log
# Output: Frontend: User clicked button ✅

# 5. View all logs
docker compose exec backend ls -la /app/logs/
Check log contents:
bash
# See real-time logs from both services
docker compose exec backend tail -f /app/logs/error.log

Useful for:
Centralized debugging
Tracking errors across services
Performance monitoring
User action auditing


## Terminal logs:-
---------------
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend sh -c 'echo "{\"app_name\":\"MyApp\",\"version\":\"1.0\"}" > /app/config/settings.json'
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec mongo-express cat /data/config/settings.json
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
{"app_name":"MyApp","version":"1.0"}
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec mongo-express sh -c 'echo "{\"app_name\":\"MyApp\",\"version\":\"2.0\"}" > /data/config/settings.json'
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend cat /app/config/settings.json
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
{"app_name":"MyApp","version":"2.0"}
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % docker compose exec backend ls -la /app/config/
WARN[0000] /Users/keerthana/Desktop/Full-stack-Docker-project/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
total 8
drwxr-xr-x  2 root root 4096 Jun  5 06:35 .
drwxr-xr-x 13 root root  416 Jun  5 05:52 ..
-rw-r--r--  1 root root   37 Jun  5 06:35 settings.json
keerthana@Keerthanas-MacBook-Air Full-stack-Docker-project % 

*above terminal output for this scenario*:
Example 3: Shared Config (Backend + mongo-express)
Why needed?
Both services need same configuration (API keys, settings, feature flags).

Real scenario:
yaml
# config.json (stored in shared volume)
{
  "api_rate_limit": 100,
  "feature_flags": {"new_ui": true},
  "theme": "dark"
}
How to test:
bash
# 1. Create config file from backend
docker compose exec backend sh -c 'echo "{\"app_name\":\"MyApp\",\"version\":\"1.0\"}" > /app/config/settings.json'

# 2. Read config from mongo-express
docker compose exec mongo-express cat /data/config/settings.json
# Output: {"app_name":"MyApp","version":"1.0"} ✅

# 3. Update config from mongo-express
docker compose exec mongo-express sh -c 'echo "{\"app_name\":\"MyApp\",\"version\":\"2.0\"}" > /data/config/settings.json'

# 4. Backend sees updated config
docker compose exec backend cat /app/config/settings.json
# Output: {"app_name":"MyApp","version":"2.0"} ✅

# 5. Check file permissions
docker compose exec backend ls -la /app/config/

Useful for:
Shared environment settings
Feature toggles
White-label configurations
Centralized API keys

*Visual Explanation: What Each Volume Does*
--------------------------------------------
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED UPLOADS VOLUME                         │
│                  (User files, images, documents)                 │
├─────────────────────────────────────────────────────────────────┤
│  backend writes → /app/uploads/photo.jpg                        │
│  mongo-express reads → /data/uploads/photo.jpg                  │
│  Result: mongo-express can display user photos in admin UI ✅    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SHARED LOGS VOLUME                          │
│                   (Error logs, access logs)                      │
├─────────────────────────────────────────────────────────────────┤
│  backend writes → /app/logs/error.log                           │
│  frontend reads → /app/logs/error.log                           │
│  Result: Frontend can show error dashboard to admin ✅           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     SHARED CONFIG VOLUME                         │
│                (Settings, feature flags, themes)                 │
├─────────────────────────────────────────────────────────────────┤
│  mongo-express writes → /data/config/settings.json              │
│  backend reads → /app/config/settings.json                      │
│  Result: Admin changes config in UI, backend applies it ✅       │
└─────────────────────────────────────────────────────────────────┘

*Common questions*:-
--------------------
1. Does build: . mean local Dockerfile?
YES - It looks for Dockerfile in the current directory (.)
app1:
  build: .  # Looks for ./Dockerfile

2. Without Dockerfile, can it run?
NO - build: . REQUIRES a Dockerfile. Without it, you get error:
ERROR: Cannot locate specified Dockerfile: Dockerfile

3. Do code changes auto-update?
NO - Dockerfile runs COPY . . only during docker build
Code change → Need to rebuild → docker compose build
What Happens When You Change Code?
bash
   1. You change app.js
   2. Docker containers still have OLD code
   3. You MUST rebuild:

docker compose build      # Rebuilds images with new code
docker compose up -d      # Restarts with new code

OR one command:
docker compose up -d --build
For Auto-Updates (Development Only)
Add volumes to auto-sync code:

app1:
  build: .
  volumes:
    - ./app.js:/app/app.js  # Live sync! No rebuild needed
  environment:
    - INSTANCE_NAME=app1
    - PORT=3001
With volumes: Code changes appear instantly without rebuild.

Summary Table
Question	                         Answer
build: . needs Dockerfile?	       ✅ YES
Without Dockerfile?	               ❌ Fails to run
Code changes auto-reflect?	       ❌ NO (need rebuild)
How to auto-refresh?	             Add volumes: or use --build
Command to rebuild	               docker compose up -d --build

One Command for Code Changes
# Every time you change code, run:
docker compose up -d --build

## Networks in yaml file explain:
1. Without specifying network - Docker creates a default network and ALL containers can talk to each other by name automatically.
2. With custom networks - Containers can ONLY talk to others on the SAME network.
3. Different networks = ISOLATED - Backend on "backend-net" cannot talk to MongoDB on "mongo-net" unless they share a network.
4. One container, multiple networks - A container can join several networks to act as a "bridge".
5. Default behavior - If you don't define networks, everything is on one default network and everything can access everything.


const express = require("express");
const Redis = require("redis");

const app = express();

const redisClient = Redis.createClient({
    url: "redis://redis:6379"
});

redisClient.connect();

// Run redis in local docker run -d --name redis-local -p 6379:6379 redis, 
// changed redis url to redis://localhost:6379, if you are running redis in docker compose then change url to redis://redis:6379

app.get("/", async (req, res) => {
    let count = await redisClient.incr("visits");
    res.send(`Visits : ${count}`);
});

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

app.listen(3000, () => {
    console.log("Backend Running");
});
// redisClient.js
const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL, // or pass as environment variable
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect().then(() => {
  console.log("Redis client connected");
});

module.exports = client;

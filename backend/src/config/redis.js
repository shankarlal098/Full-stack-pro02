const { createClient }  = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'spade-rhythm-laudable-21861.db.redis.io',
        port: 10478
    }
});

module.exports = redisClient;
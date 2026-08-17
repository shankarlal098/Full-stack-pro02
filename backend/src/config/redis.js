const { createClient }  = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
<<<<<<< HEAD
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
=======
        host: 'spade-rhythm-laudable-21861.db.redis.io',
        port: 10478
>>>>>>> d664cd2b47e8565e230c262a95866d10116d8cbd
    }
});

module.exports = redisClient;
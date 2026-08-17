const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

module.exports = client;
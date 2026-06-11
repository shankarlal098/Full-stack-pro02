const express = require('express');
const codeRouter =  express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const {saveCodeToRedis  , getCodeFromRedis} = require('../controllers/savecode');

codeRouter.post('/save', userMiddleware, saveCodeToRedis);
codeRouter.get('/get/:problemId', userMiddleware, getCodeFromRedis);
module.exports = codeRouter;
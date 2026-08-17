// controllers/codeController.js
const redisClient = require("../config/redis");
// 1. SAVE CODE TO REDIS (Debounced API)
const saveCodeToRedis = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    const userId = req.result._id; // Auth middleware se aaya hua user

    if (!problemId || !language) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const redisKey = `user_code:${userId}:${problemId}`;

    // Redis se existing data nikalo
    const existingData = await redisClient.get(redisKey);
    
    let codeData = { 
      languages: {}, 
      currentLanguage: language 
    };

    if (existingData) {
      codeData = JSON.parse(existingData);
    }

    // Us specific language ka code mapping update karo
    codeData.languages[language] = code;
    codeData.currentLanguage = language; // Last active language track karne ke liye

    // Redis me 6 ghante (21600 seconds) ke liye set karo
    await redisClient.set(redisKey, JSON.stringify(codeData), 'EX', 21600);

    return res.status(200).json({ success: true, message: "Code auto-saved successfully" });
  } catch (err) {
    console.error("Redis Save Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error: " + err.message });
  }
};

// 2. GET CODE FROM REDIS (Page Refresh/Load API)
const getCodeFromRedis = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.result._id;

    const redisKey = `user_code:${userId}:${problemId}`;

    const cachedData = await redisClient.get(redisKey);

    if (!cachedData) {
      // Agar cache khali hai toh 404 mat bhejo, success true ke sath empty state do taaki frontend crash na ho
      return res.status(200).json({ 
        success: false, 
        message: "No cached code found for this problem" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: JSON.parse(cachedData) 
    });
  } catch (err) {
    console.error("Redis Fetch Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error: " + err.message });
  }
};

module.exports = { saveCodeToRedis, getCodeFromRedis };
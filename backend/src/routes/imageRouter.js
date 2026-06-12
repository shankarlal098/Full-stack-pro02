const express = require('express');
const userMiddleware = require('../middleware/userMiddleware'); 
const imageRouter = express.Router();
const {
  generateUploadSignature,
  saveImageMetadata,
  deleteImage,
  updateImageMetadata
} = require("../controllers/imagesection");

imageRouter.get("/create", userMiddleware, generateUploadSignature);
imageRouter.post("/save", userMiddleware, saveImageMetadata);
imageRouter.delete("/delete", userMiddleware, deleteImage);
imageRouter.put("/update", userMiddleware, updateImageMetadata);

module.exports = imageRouter;
const cloudinary = require('cloudinary').v2;
const User = require("../models/user");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_IMAGE,
  api_key: process.env.CLOUDINARY_API_KEY_IMAGE,
  api_secret: process.env.CLOUDINARY_API_SECRET_IMAGE
});

// 1. GET SIGNATURE (CREATE)
const generateUploadSignature = async (req, res) => {
  try {
    const userId = req.result._id; // Tere middleware ki auth user ID
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folderName = 'profile_pics';

    const publicIdString = `${userId}_${timestamp}`;
    
    const uploadParams = {
      timestamp: timestamp,
      public_id: publicIdString,
      folder: folderName, 
    };

    console.log("done");
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET_IMAGE
    );

    res.json({
      signature,
      timestamp,
      folder: folderName, 
      public_id: publicIdString,
      api_key: process.env.CLOUDINARY_API_KEY_IMAGE,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME_IMAGE,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME_IMAGE}/image/upload`,
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({ error: 'Failed to generate upload credentials' });   
  }
};
const saveImageMetadata = async (req, res) => {
  try {
    const { cloudinaryPublicId , secureUrl, type } = req.body; 
    const userId = req.result._id;

    // 1. Validation Check
    if (!cloudinaryPublicId || !secureUrl) {
      return res.status(400).json({ error: 'Missing required upload fields (Id or Url)' });
    }

    if (type === 'avatar') {
      try {
        const cloudinaryResource = await cloudinary.api.resource(
          cloudinaryPublicId,
          { resource_type: 'image' }
        );

        if (!cloudinaryResource) {
          return res.status(400).json({ error: 'Fraud Alert! Image not found on Cloudinary server' });
        }
      } catch (cloudinaryError) {
         console.error('Cloudinary verification failed:', cloudinaryError.message);
        return res.status(400).json({ error: 'Invalid Cloudinary Public ID provided' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { profilePic: secureUrl } },
        { new: true }
      ).select("-password");

      return res.status(201).json({
        success: true,
        message: 'Avatar verified and saved successfully',
        user: updatedUser
      });
    }

    res.status(400).json({ error: 'Invalid upload type specified' });
  } catch (error) {
    console.error('Save Metadata Error:', error);
    res.status(500).json({ error: 'Failed to save image metadata' });
  }
};
const updateImageMetadata = async (req, res) => {
  try {
    const { secureUrl, cloudinaryPublicId , type } = req.body; 
    const userId = req.result._id;

    if (!secureUrl) {
      return res.status(400).json({ error: 'Missing secureUrl for update' });
    }

    if (type === 'avatar') {
      const currentUser = await User.findById(userId);
      
      // Step A: Purani wali image ko dhoond kar Cloudinary se udao
      if (currentUser && currentUser.profilePic) {
        const urlParts = currentUser.profilePic.split('/');
        const folderIndex = urlParts.indexOf('profile_pics');
        
        if (folderIndex !== -1) {
          // Public ID extract ki (e.g. profile_pics/user123_timestamp)
          const oldPublicId = urlParts.slice(folderIndex).join('/').split('.')[0];
          
          await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image', invalidate: true });
        }
      }

      // Step B: Database ke andar naye secureUrl ko overwrite kar do
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { profilePic: secureUrl } },
        { new: true }
      ).select("-password");

      return res.json({
        success: true,
        message: 'Avatar updated successfully',
        user: updatedUser
      });
    }

    res.status(400).json({ error: 'Invalid update type specified' });
  } catch (error) {
    console.error('Update Metadata Error:', error);
    res.status(500).json({ error: 'Failed to update image metadata' });
  }
};
const deleteImage = async (req, res) => {
  try {
    const { type } = req.body; 
    const userId = req.result._id;

    if (type === 'avatar') {
      const user = await User.findById(userId);
      if (!user || !user.profilePic) {
        return res.status(404).json({ error: 'No profile picture found to delete' });
      }

      // Default avatar ka link variable mein rakh liya
      const defaultAvatarUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

      // Check: Agar user ke paas pehle se hi default photo hai, toh Cloudinary par destroy chalane ki zaroorat nahi hai
      if (user.profilePic !== defaultAvatarUrl) {
        // URL parsing to get public_id
        const urlParts = user.profilePic.split('/');
        const folderIndex = urlParts.indexOf('profile_pics');
        
        if (folderIndex !== -1) {
          const cloudinaryPublicId = urlParts.slice(folderIndex).join('/').split('.')[0];
          // Cloudinary se user ki upload ki hui asli photo ko bilkul saaf kiya
          await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'image', invalidate: true });
        }
      }

      //  DATABASE UPDATE: Khali string ("") karne ki jagah wapas default avatar ka URL set kar diya
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { profilePic: defaultAvatarUrl } }, // Default URL dal diya wapas
        { new: true }
      ).select("-password");

      return res.json({ 
        success: true, 
        message: 'Profile picture removed and reset to default successfully', 
        user: updatedUser 
      });
    }

    res.status(400).json({ error: 'Invalid delete type specified' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

module.exports = { 
  generateUploadSignature, 
  saveImageMetadata, 
  updateImageMetadata, 
  deleteImage 
};


// =========================================================================
// 2. SAVE IMAGE METADATA (POST -> /save)
// =========================================================================
// Kaam: Ekdum Clean! Jab user PEHLI BAAR photo upload karega, toh Cloudinary se
// mile secureUrl ko seedhe database mein user profile par set kar dega.
// =========================================================================
// 3. UPDATE IMAGE METADATA (PUT -> /update)
// =========================================================================
// Kaam: Jab user photo BADLEGA (Update), tab frontend pahle naye token se cloud par
// image upload karega, fir naya url lekar yahan aayega. Yeh controller pahle cloud
// se PURANI image destroy karega aur fir DB me NAYA url overwirte karega.
// =========================================================================
// 4. DELETE IMAGE (DELETE -> /delete)
// =========================================================================
// Kaam: Jab user dropdown se "Remove Photo" click karega, toh ye controller cloud
// se bhi photo udayega aur DB me user ki profilePic ko empty string ("") kar dega.
const redisClient = require("../config/redis");
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission")
const crypto = require("crypto");
const transporter = require('../utils/nodemailer')
const client = require("../utils/googleClient");


const register = async (req, res) => {
    try {
        validate(req.body); 
        const { firstName, emailId, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            firstName,
            emailId,
            password: hashedPassword,
            role: 'user'
        });

        const token = jwt.sign(
            { _id: user._id, emailId: emailId, role: 'user' }, 
            process.env.JWT_KEY, 
            { expiresIn: '1h' }
        );

        // Cookies with cross-site support
        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: true,        // Production mein HTTPS ke liye
            sameSite: 'none'     // Cross-origin (Vercel to Render) ke liye zaroori
        });

        res.status(201).json({
            user: { firstName: user.firstName, emailId: user.emailId, _id: user._id, role: user.role },
            message: "Registered Successfully"
        });
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
};

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        console.log("done");

        if (!emailId || !password) throw new Error("Invalid Credentials");

        const user = await User.findOne({ emailId });
        if (!user) throw new Error("Invalid Credentials");

        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new Error("Invalid Credentials");

        const token = jwt.sign(
            { _id: user._id, emailId: emailId, role: user.role }, 
            process.env.JWT_KEY, 
            { expiresIn: '1h' }
        );

        // Cookies with cross-site support
        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        res.status(200).json({
            user: { firstName: user.firstName, emailId: user.emailId, _id: user._id, role: user.role },
            message: "Logged In Successfully"
        });
    } catch (err) {
        res.status(401).send("Error: " + err.message);
    }
};

const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....

    res.cookie("token",null,{expires: new Date(Date.now())});
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}

const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user =
      await User.findOne({
        emailId: email
      });

    //  console.log(user)
    // Don't reveal if user exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists, a reset link has been sent."
        });
    }

    // Generate raw token
    const resetToken =
      crypto.randomBytes(32).toString("hex");

    // Hash token before storing
    const hashedToken =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      console.log("call3"); 


    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires =
     Date.now() + 15 * 60 * 1000; 
     await user.save();
       

    const resetLink =
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const response = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.emailId,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>
          You requested a password reset.
        </p>
        <p>
          Click below:
        </p>
        <a href="${resetLink}">
          Reset Password
        </a>
        <p>
          This link expires in 15 minutes.
        </p>
        <p>
          Ignore this email if you didn't request it.
        </p>
      `
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account exists, a reset link has been sent."
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// SHA-256 (Secure Hash Algorithm 256-bit) is a cryptographic hashing function that 
// generates a unique, 
// fixed-length 256-bit (64-character hexadecimal) "fingerprint" from 
// any input data


const resetPassword = async (req, res) => {
  try {

    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password required"
      });
    }

    // hash incoming token
    const hashedToken =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: Date.now() // its means if greater then gt ??
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // token becomes single-use
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

const googleAuth = async (req, res) => {
   try {

      const { token } = req.body;

      const ticket = await client.verifyIdToken({
         idToken: token,
         audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();

      const { sub, email, name, picture } = payload;

      let user = await User.findOne({
         emailId: email
      });

      if (!user) {

         user = await User.create({
            firstName: name,
            emailId: email,
            googleId: sub,
            authProvider: "google",
            photoUrl: picture
         });

      }

      const jwtToken = jwt.sign(
         {
            _id: user._id,
            emailId: user.emailId,
            firstName: user.firstName
         },
         process.env.JWT_KEY,
         {
            expiresIn: "1h"
         }
      );

      res.cookie("token", jwtToken, {
         maxAge: 60 * 60 * 1000,
         httpOnly: true,//Browser JavaScript is cookie ko read nahi kar sakta. reducing XSS risk.
         sameSite: "none",//Ye cookie sharing control karta hai. ye batat hai Main cross-site request me cookie bheju ya nahi?
         secure: true // Cookie sirf HTTPS connection pe bhejna.
      });

      res.status(200).json({
         success: true,
         user: {
            _id: user._id,
            firstName: user.firstName,
            emailId: user.emailId
         },
         message: "Google Authentication Success"
      });

   }
   catch (error) {

      console.error(error);

      res.status(500).json({
         success: false,
         message: "Google Authentication Failed"
      });

   }
};


const updateProfileDetails = async (req, res) => {
  try {
    const userId = req.result._id; // Middleware se aayi hui logged-in user ki ID
    // GitHub aur LinkedIn ko bhi req.body se nikal liya
    const { bio, phone, location, gender, githubProfile, linkedinProfile } = req.body;

    // User ko dhoondho aur uski details update karo
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          bio: bio || "",
          phone: phone || "",
          location: location || "",
          gender: gender || "",
          githubProfile: githubProfile || "",   // GitHub save hone ke liye taiyar
          linkedinProfile: linkedinProfile || "" // LinkedIn save hone ke liye taiyar
        }
      },
      { new: true, runValidators: true } // new: true se updated data hi return hoga
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    res.status(200).json({
      success: true,
      message: "Profile ubdated!",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating profile details:", error);
    res.status(500).json({ success: false, message: "Server problem!" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.result._id; // Middleware se aayi hui logged-in user ki ID

    // User ko dhoondho aur password ko chhor kar baaki saari details nikal lo
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: "Bhai user nahi mila!" });
    }

    // Frontend ko data bhej do
    res.status(200).json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ success: false, message: "Server pe dikkat aayi user fetch karne me!" });
  }
};
module.exports = {register, login,logout,adminRegister,deleteProfile , resetPassword , forgotPassword, googleAuth , updateProfileDetails , getCurrentUser};
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20
    },
    lastName: {
        type: String,
        minLength: 3,
        maxLength: 20,
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        immutable: true,
    },
    age: {
        type: Number,
        min: 6,
        max: 80,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    problemSolved: {
        type: [Schema.Types.ObjectId],
        ref: 'problem',
        default: []
    },
    password: {
        type: String,
        required: true
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    googleId: {
        type: String,
        default: null
    },
    profilePic: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
    },
    
    // NEW DETAILS SECTION ADDED HERE
    bio: {
        type: String,
        maxLength: 160, // Standard professional bio limit
        default: ""
    },
    phone: {
        type: String,
        trim: true,
        default: "" // Frontend par validation check hum laga hi rahe hain regex se
    },
    location: {
        type: String,
        trim: true,
        default: ""
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', ''], // Khali string ('') shuruat ke liye valid rakhi hai
        default: ""
    },
    githubProfile: {
        type: String,
        trim: true,
        default: ""
    },
    linkedinProfile: {
        type: String,
        trim: true,
        default: ""
    }

}, {
    timestamps: true
});

// Middleware (Post hook) - User delete hote hi uski saari submissions saaf!
userSchema.post('findOneAndDelete', async function (userInfo) {
    if (userInfo) {
        await mongoose.model('submission').deleteMany({ userId: userInfo._id });
    }
});

const User = mongoose.model("user", userSchema);

module.exports = User;
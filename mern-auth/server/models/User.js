import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        password: {
            type: String,
            required: false, // Optional for Google OAuth users
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true, // Allows multiple documents without a googleId
        },

        profilePicture: {
            type: String,
        },
         token: {
        type: String,
    },
    tokenExpiration: {
        type: Date, 
    },
    forgotPasswordToken: {
        type: String,   
    },
    forgotPasswordTokenExpiration: {
        type: Date, 
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
},
    {
        timestamps: true,
    },

);

export default mongoose.model("User", userSchema);
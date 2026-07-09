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
            required: true,
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
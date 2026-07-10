import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const signup = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (!password || password.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Password is required",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullname,
            email,
            password: hashedPassword,
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user,
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            message: "Signed in successfully",
            token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const user = await User.findOne({ email });

        const genericMessage = "If an account with that email exists, a password reset link has been sent.";

        if (!user) {
            // Do not reveal that the email does not exist
            return res.status(200).json({
                success: true,
                message: genericMessage,
            });
        }

        // If the user registered via Google and has no local password
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account uses Google Sign-In. Please sign in with Google.",
            });
        }

        // Generate secure random reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash the token and save it to database
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

        await user.save();

        // Create reset link URL
        const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

        // Prepare email HTML and text contents
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333333; text-align: center;">Reset Your Password</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password. Click the button below to choose a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #0066cc;"><a href="${resetUrl}">${resetUrl}</a></p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666666;">This link is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
            </div>
        `;

        const emailText = `You have requested a password reset. Please click or open the following link to choose a new password: ${resetUrl}. This link is valid for 15 minutes.`;

        try {
            await sendEmail({
                to: user.email,
                subject: "Password Reset Request",
                html: emailHtml,
                text: emailText,
            });

            res.status(200).json({
                success: true,
                message: genericMessage,
            });
        } catch (mailError) {
            // Revert token database updates if sending email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            console.error("Email sending failed:", mailError);
            res.status(500).json({
                success: false,
                message: "Email could not be sent. Please try again later.",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "New password is required.",
            });
        }

        // Hash token from param to compare with the one stored in database
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset token.",
            });
        }

        // Hash new password using bcryptjs
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and invalidate reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password has been reset successfully. You can now log in.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: "Google ID Token is required.",
            });
        }

        // Verify Google ID Token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({
                success: false,
                message: "Invalid token payload.",
            });
        }

        const { email, name, sub: googleId, picture } = payload;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email not provided by Google account.",
            });
        }

        let user = await User.findOne({ email });

        if (user) {
            // Case 1: Email exists in DB. Check if googleId is set.
            if (!user.googleId) {
                // Account created via local login. Link Google account.
                user.googleId = googleId;
                if (picture && !user.profilePicture) {
                    user.profilePicture = picture;
                }
                await user.save();
            } else if (user.googleId !== googleId) {
                // In case googleId needs update/sync
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Case 2: Email does not exist. Create new Google OAuth user.
            user = await User.create({
                fullname: name,
                email,
                googleId,
                profilePicture: picture,
            });
        }

        // Generate application's JWT session token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            message: "Signed in successfully",
            token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                profilePicture: user.profilePicture,
            },
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Google token verification failed: " + error.message,
        });
    }
};
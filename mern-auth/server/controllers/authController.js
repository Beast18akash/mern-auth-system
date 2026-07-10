import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { setAuthCookie } from "../utils/cookie.js";
import { sendEmail } from "../utils/sendEmail.js";
import { handleGoogleLogin } from "../providers/googleProvider.js";
import { getGitHubAuthUrl, handleGitHubCallback } from "../providers/githubProvider.js";

// ---------------------------------------------------------------------------
// Local Authentication
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/signup
 *
 * Registers a new user with email and password (local auth).
 * Adds a "local" entry to the providers array so the system
 * knows this account has local authentication enabled.
 */
export const signup = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, and password are required.",
            });
        }

        if (password.trim().length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullname,
            email: normalizedEmail,
            password: hashedPassword,
            // Mark local as a linked provider so forgotPassword and
            // other checks can query providers[] consistently
            providers: [
                {
                    provider: "local",
                    providerId: null,
                    linkedAt: new Date(),
                },
            ],
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
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

/**
 * POST /api/auth/signin
 *
 * Authenticates a user with email and password.
 * Generates a JWT and sets it in an HTTP-only cookie.
 * Also returns the token in the response body for the existing
 * frontend that still sets the cookie client-side.
 */
export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.password) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = generateToken(user._id, user.email);

        // Set the cookie server-side (used by GitHub redirect flow
        // and future requests once the frontend is fully migrated)
        setAuthCookie(res, token);

        res.status(200).json({
            success: true,
            message: "Signed in successfully.",
            // Still returning token in body for the existing frontend
            // that reads it via response.data.token and sets the cookie
            // client-side. Both the cookie and the body token are identical.
            token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                profilePicture: user.profilePicture,
                providers: user.providers.map((p) => p.provider),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /api/auth/me
 *
 * Returns the authenticated user's profile.
 * Protected by the protect middleware — req.user is always set here.
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "-password -resetPasswordToken -resetPasswordExpires"
        );

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

/**
 * POST /api/auth/logout
 *
 * Clears the HTTP-only auth cookie.
 */
export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ---------------------------------------------------------------------------
// Forgot / Reset Password
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/forgot-password
 *
 * Sends a password reset email.
 * Only works when local authentication is enabled on the account.
 * If the user signed up via Google or GitHub only, they have no password
 * to reset — we return a clear message instead of silently doing nothing.
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // Generic message — never reveal whether an email exists in the system
        const genericMessage =
            "If an account with that email exists, a password reset link has been sent.";

        if (!user) {
            return res.status(200).json({ success: true, message: genericMessage });
        }

        // Use our schema method to check if local auth is enabled
        // Previously this was: if (!user.password)
        // Now it's clean and reads exactly like the business rule
        if (!user.hasProvider("local")) {
            return res.status(400).json({
                success: false,
                message:
                    "This account uses social login (Google or GitHub). " +
                    "Password reset is only available for accounts with a password.",
            });
        }

        // Generate a secure random reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash it before storing — never store raw tokens in the database
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

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

        try {
            await sendEmail({
                to: user.email,
                subject: "Password Reset Request",
                html: emailHtml,
                text: `Reset your password here: ${resetUrl} — valid for 15 minutes.`,
            });

            res.status(200).json({ success: true, message: genericMessage });
        } catch (mailError) {
            // Roll back the token if the email fails — don't leave a dangling token
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
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

/**
 * POST /api/auth/reset-password/:token
 *
 * Resets the user's password using the token from the email link.
 */
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

        if (password.trim().length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
        }

        // Hash the token from the URL to compare against the stored hash
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

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        // If this user previously only had social login and is now setting
        // a password for the first time, enable local auth for their account
        user.linkProvider("local", null);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password has been reset successfully. You can now sign in.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/google
 *
 * Receives the Google ID Token from the frontend (@react-oauth/google),
 * verifies it, finds or creates the user, and issues a session.
 *
 * The frontend flow does NOT change — it still sends { idToken } in the
 * request body and reads the token from the JSON response.
 */
export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        // Delegate all Google-specific logic to the provider
        const user = await handleGoogleLogin(idToken);

        const token = generateToken(user._id, user.email);

        // Set server-side cookie (consistent with GitHub flow)
        setAuthCookie(res, token);

        res.status(200).json({
            success: true,
            message: "Signed in with Google successfully.",
            token, // Still returned in body for existing frontend
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                profilePicture: user.profilePicture,
                providers: user.providers.map((p) => p.provider),
            },
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message ?? "Google authentication failed.",
        });
    }
};

// ---------------------------------------------------------------------------
// GitHub OAuth
// ---------------------------------------------------------------------------

/**
 * GET /api/auth/github
 *
 * Entry point for the GitHub OAuth flow.
 *
 * Generates a random state token for CSRF protection, stores it in a
 * short-lived cookie, then redirects the browser to GitHub's authorization page.
 *
 * The state cookie is httpOnly and has a 10-minute expiry — just long
 * enough for the user to complete the GitHub consent screen.
 */
export const githubRedirect = (req, res) => {
    try {
        // Generate a random state value for CSRF protection
        const state = crypto.randomBytes(16).toString("hex");

        // Store it in a short-lived httpOnly cookie so we can verify it
        // when GitHub sends the user back to the callback
        res.cookie("github_oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000, // 10 minutes
        });

        const authUrl = getGitHubAuthUrl(state);

        res.redirect(authUrl);
    } catch (error) {
        res.redirect(
            `${process.env.CLIENT_URL}/signin?error=github_redirect_failed`
        );
    }
};

/**
 * GET /api/auth/github/callback
 *
 * GitHub redirects the user here after they authenticate and grant permission.
 *
 * URL will look like:
 *   /api/auth/github/callback?code=XXXXXX&state=YYYYYY
 *
 * Steps:
 *   1. Validate the state parameter (CSRF check)
 *   2. Check for OAuth cancellation or errors from GitHub
 *   3. Exchange the code for an access token
 *   4. Fetch the GitHub profile
 *   5. Find or create the user
 *   6. Generate JWT, set cookie
 *   7. Redirect to the frontend dashboard
 */
export const githubCallback = async (req, res) => {
    try {
        const { code, state, error: oauthError } = req.query;

        // --- Step 1: CSRF state validation ---
        const storedState = req.cookies?.github_oauth_state;

        if (!storedState || storedState !== state) {
            return res.redirect(
                `${process.env.CLIENT_URL}/signin?error=invalid_state`
            );
        }

        // Clear the state cookie — it's single-use
        res.clearCookie("github_oauth_state");

        // --- Step 2: Handle OAuth errors (e.g. user clicked "Cancel") ---
        if (oauthError) {
            return res.redirect(
                `${process.env.CLIENT_URL}/signin?error=github_auth_cancelled`
            );
        }

        if (!code) {
            return res.redirect(
                `${process.env.CLIENT_URL}/signin?error=no_code`
            );
        }

        // --- Steps 3–5: Handled inside the provider ---
        const user = await handleGitHubCallback(code);

        // --- Step 6: Issue our own JWT session token ---
        const token = generateToken(user._id, user.email);

        // Set in an HTTP-only cookie — the ONLY way to persist the session
        // after a redirect flow (there is no JSON response the frontend can read)
        setAuthCookie(res, token);

        // --- Step 7: Redirect back to the frontend ---
        // The frontend dashboard reads the user from GET /api/auth/me using the cookie.
        // No token is passed in the URL — that would expose it in browser history and logs.
        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } catch (error) {
        console.error("GitHub callback error:", error.message);

        res.redirect(
            `${process.env.CLIENT_URL}/signin?error=github_auth_failed`
        );
    }
};

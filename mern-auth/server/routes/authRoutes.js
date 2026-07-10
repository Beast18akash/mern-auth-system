import express from "express";

import {
    signup,
    signin,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    googleLogin,
    githubRedirect,
    githubCallback,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Local Authentication
// ---------------------------------------------------------------------------
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
router.get("/me", protect, getMe);

// ---------------------------------------------------------------------------
// Password Recovery
// ---------------------------------------------------------------------------
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------
// POST — receives the Google ID Token from the frontend (@react-oauth/google)
// The frontend flow is unchanged: it sends { idToken } and reads back { token }
router.post("/google", googleLogin);

// ---------------------------------------------------------------------------
// GitHub OAuth
// ---------------------------------------------------------------------------

// Step 1 — Frontend links to or fetches this URL to start the flow.
// The server generates a state token and redirects to GitHub's auth page.
router.get("/github", githubRedirect);

// Step 2 — GitHub redirects back here with ?code=XXX&state=YYY
// The server validates state, exchanges the code, fetches the profile,
// finds or creates the user, sets the cookie, and redirects to /dashboard.
router.get("/github/callback", githubCallback);

export default router;

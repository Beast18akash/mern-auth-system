import { OAuth2Client } from "google-auth-library";
import { findOrCreateOAuthUser } from "../services/authService.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Handles the complete Google Sign-In flow.
 *
 * Google uses OpenID Connect (OIDC) on top of OAuth 2.0.
 * This means after the user authenticates on the frontend using
 * @react-oauth/google, Google returns an ID Token directly.
 *
 * An ID Token is a signed JWT that contains the user's identity
 * (email, name, Google ID, picture) right inside it.
 *
 * This is different from GitHub, where we get an Access Token first
 * and then have to make a separate API call to get the profile.
 *
 * Flow:
 *   Frontend: user clicks "Continue with Google"
 *   → @react-oauth/google handles the popup/redirect
 *   → Google returns an ID Token (credentialResponse.credential)
 *   → Frontend sends that ID Token to POST /api/auth/google
 *   → This function verifies the token and extracts the profile
 *   → Calls findOrCreateOAuthUser() to handle account linking
 *   → Returns the user document
 *
 * @param {string} idToken - The Google ID Token from the frontend
 * @returns {Promise<object>} - The Mongoose user document
 * @throws {Error} - If the token is invalid, expired, or missing required fields
 */
export const handleGoogleLogin = async (idToken) => {
    if (!idToken) {
        throw new Error("Google ID Token is required.");
    }

    // Verify the ID Token signature and audience with Google's public keys.
    // This ensures the token was genuinely issued by Google for our app
    // and has not been tampered with.
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
        throw new Error("Invalid Google token payload.");
    }

    const { email, name, sub: googleId, picture } = payload;

    // Email is required — we use it as the unique identifier across all providers.
    // In practice Google always provides it, but we validate defensively.
    if (!email) {
        throw new Error("Email not provided by Google account.");
    }

    // Normalize the profile into a consistent shape.
    // Every provider (Google, GitHub) produces this same shape before
    // calling the shared service. The service never knows which provider
    // produced the profile.
    const profile = {
        email,
        fullname: name,
        picture: picture ?? null,
    };

    // Hand off to the shared account linking service.
    // This handles find-or-create and provider linking — Google-specific
    // code ends here.
    const user = await findOrCreateOAuthUser("google", googleId, profile);

    return user;
};

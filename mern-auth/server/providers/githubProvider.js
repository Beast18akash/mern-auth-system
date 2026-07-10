import axios from "axios";
import { findOrCreateOAuthUser } from "../services/authService.js";

// ---------------------------------------------------------------------------
// Step 1 — Build the GitHub Authorization URL
// ---------------------------------------------------------------------------

/**
 * Builds the URL we redirect the user to at the start of the OAuth flow.
 *
 * Query parameters explained:
 *
 *   client_id    — Identifies your application to GitHub. Public — safe in the URL.
 *
 *   redirect_uri — Where GitHub sends the user after they authenticate.
 *                  Must exactly match what you registered in your GitHub OAuth App settings.
 *
 *   scope        — Permissions you are requesting.
 *                  "read:user" → access to the user's public profile (name, avatar, GitHub ID).
 *                  "user:email" → access to the user's email addresses, including private ones.
 *                  We need both because GitHub users can hide their email on their public profile.
 *
 *   state        — A random value YOU generate. GitHub echoes it back in the callback URL.
 *                  We compare the echoed value against the original to confirm the callback
 *                  is genuine and not a forged CSRF request from a third party.
 *
 * @param {string} state - A random CSRF token generated before the redirect
 * @returns {string}     - The full GitHub authorization URL
 */
export const getGitHubAuthUrl = (state) => {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
        scope: "read:user user:email",
        state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

// ---------------------------------------------------------------------------
// Step 2 — Exchange Authorization Code for Access Token
// ---------------------------------------------------------------------------

/**
 * Exchanges the short-lived authorization code for a GitHub access token.
 *
 * WHY server-side?
 *   The code alone is useless. GitHub only issues a token if the request
 *   also includes the client_secret. The client_secret must NEVER leave the server.
 *   This is the entire security model of the Authorization Code Flow —
 *   keeping the token exchange server-to-server.
 *
 * WHY is the code short-lived?
 *   GitHub's authorization codes expire after 10 minutes and can only be
 *   used once. This limits the damage if a code is intercepted.
 *
 * @param {string} code - The authorization code from GitHub's callback URL
 * @returns {Promise<string>} - The GitHub access token
 * @throws {Error} - If the exchange fails or GitHub returns an error
 */
const exchangeCodeForToken = async (code) => {
    const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GITHUB_CALLBACK_URL,
        },
        {
            headers: {
                Accept: "application/json", // Without this, GitHub returns URL-encoded text
            },
        }
    );

    const { access_token, error, error_description } = response.data;

    // GitHub returns HTTP 200 even for errors — the error is in the body
    if (error) {
        throw new Error(
            error_description ?? `GitHub token exchange failed: ${error}`
        );
    }

    if (!access_token) {
        throw new Error("No access token returned from GitHub.");
    }

    return access_token;
};

// ---------------------------------------------------------------------------
// Step 3 — Fetch GitHub Profile
// ---------------------------------------------------------------------------

/**
 * Fetches the authenticated user's profile from the GitHub API.
 *
 * Handles the private email edge case:
 *   GitHub users can set their email to private. When they do, the
 *   /user endpoint returns email: null. We detect this and make a
 *   second call to /user/emails to retrieve their verified primary email.
 *   Without this fallback, private-email users would fail to authenticate.
 *
 * @param {string} accessToken - The GitHub access token from exchangeCodeForToken()
 * @returns {Promise<object>}  - Normalized profile: { githubId, email, fullname, picture }
 * @throws {Error}             - If the profile cannot be fetched or email cannot be resolved
 */
const getGitHubProfile = async (accessToken) => {
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
    };

    // Primary profile call
    const { data: githubUser } = await axios.get(
        "https://api.github.com/user",
        { headers }
    );

    let email = githubUser.email ?? null;

    // Private email fallback — if email is null, fetch from /user/emails
    if (!email) {
        const { data: emails } = await axios.get(
            "https://api.github.com/user/emails",
            { headers }
        );

        // Find the email that is both verified and marked as primary
        const primaryEmail = emails.find(
            (e) => e.primary === true && e.verified === true
        );

        if (!primaryEmail) {
            throw new Error(
                "No verified primary email found on this GitHub account. " +
                "Please add and verify an email address on GitHub, then try again."
            );
        }

        email = primaryEmail.email;
    }

    return {
        githubId: String(githubUser.id), // GitHub IDs are integers — normalize to string
        email,
        fullname: githubUser.name ?? githubUser.login, // Some users have no display name — fall back to username
        picture: githubUser.avatar_url ?? null,
    };
};

// ---------------------------------------------------------------------------
// Step 4 — Orchestrate the Full Callback Flow
// ---------------------------------------------------------------------------

/**
 * Handles everything that happens after GitHub redirects back to our callback URL.
 *
 * This is the single function the controller calls. It:
 *   1. Exchanges the authorization code for an access token
 *   2. Fetches the GitHub user profile
 *   3. Hands the normalized profile to the shared authService
 *   4. Returns the user document — GitHub-specific code ends here
 *
 * The access token is intentionally NOT stored. It is used once to fetch
 * the profile and then discarded. Your application's JWT handles the session.
 *
 * @param {string} code - The authorization code from GitHub's callback URL
 * @returns {Promise<object>} - The Mongoose user document
 * @throws {Error} - If any step in the flow fails
 */
export const handleGitHubCallback = async (code) => {
    // Step 2 — exchange code → access token
    const accessToken = await exchangeCodeForToken(code);

    // Step 3 — access token → GitHub profile
    const { githubId, email, fullname, picture } = await getGitHubProfile(accessToken);

    // Normalize into the same profile shape every provider uses
    const profile = {
        email,
        fullname,
        picture,
    };

    // Step 4 — hand off to the shared account linking service
    // GitHub-specific knowledge ends here
    const user = await findOrCreateOAuthUser("github", githubId, profile);

    return user;
};

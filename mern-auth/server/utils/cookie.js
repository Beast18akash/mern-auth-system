/**
 * Cookie configuration.
 *
 * httpOnly: true
 *   The cookie cannot be read by JavaScript (document.cookie).
 *   This is the primary defense against XSS token theft.
 *   The browser sends it automatically with every request — your JS never needs to touch it.
 *
 * secure: true in production
 *   The cookie is only sent over HTTPS connections.
 *   In development (HTTP localhost) we set this to false so it still works.
 *
 * sameSite: "lax"
 *   The cookie is sent on same-site requests and on top-level cross-site navigations
 *   (like the redirect back from GitHub/Google). This is the correct setting for OAuth
 *   redirect flows. "strict" would block the callback redirect from carrying the cookie.
 *
 * maxAge: 7 days in milliseconds
 *   Matches the JWT expiry so the cookie and token expire together.
 */
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: "/",
};

/**
 * Sets the authentication JWT inside an HTTP-only cookie on the response.
 *
 * Why server-set cookies?
 * - The GitHub OAuth flow ends with a redirect — there is no JSON response
 *   for the frontend to read. The only way to persist the session is to
 *   set the cookie server-side before redirecting.
 * - httpOnly cookies cannot be stolen by XSS attacks.
 * - The browser sends them automatically — no Authorization header needed.
 *
 * @param {object} res   - Express response object
 * @param {string} token - Signed JWT from generateToken()
 */
export const setAuthCookie = (res, token) => {
    res.cookie("token", token, COOKIE_OPTIONS);
};

/**
 * Clears the authentication cookie.
 * Used by the logout endpoint.
 *
 * @param {object} res - Express response object
 */
export const clearAuthCookie = (res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
};

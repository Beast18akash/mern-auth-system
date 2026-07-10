import jwt from "jsonwebtoken";

/**
 * Generates the application's own JWT session token.
 *
 * IMPORTANT: This is NOT the Google ID Token or the GitHub Access Token.
 * Those are external tokens used temporarily to prove identity.
 * This is YOUR application's session token — the one that drives every
 * protected request after authentication succeeds.
 *
 * @param {string} userId  - MongoDB _id of the user
 * @param {string} email   - User's email address
 * @returns {string}       - Signed JWT string
 */
export const generateToken = (userId, email) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    return jwt.sign(
        { id: userId, email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws a JsonWebTokenError if the token is invalid or expired.
 *
 * @param {string} token - JWT string to verify
 * @returns {object}     - Decoded payload: { id, email, iat, exp }
 */
export const verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    return jwt.verify(token, process.env.JWT_SECRET);
};

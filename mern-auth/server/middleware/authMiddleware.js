import { verifyToken } from "../utils/jwt.js";

/**
 * Authentication middleware.
 *
 * Token lookup order:
 *   1. HTTP-only cookie (req.cookies.token)
 *      — Set by the server after any auth flow (local, Google, GitHub).
 *      — Cannot be read or modified by JavaScript. Most secure.
 *      — This is the primary method going forward.
 *
 *   2. Authorization header (Bearer <token>)
 *      — Kept for backward compatibility.
 *      — The existing frontend still sends the token this way for local
 *        and Google flows until the client is updated.
 *
 * On success: attaches decoded payload to req.user and calls next().
 * On failure: returns 401 — never calls next().
 */
export const protect = async (req, res, next) => {
    let token = null;

    // 1. Check HTTP-only cookie first (preferred — GitHub redirect flow sets this)
    if (req.cookies?.token) {
        token = req.cookies.token;
    }

    // 2. Fall back to Authorization header (backward compatibility)
    else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided.",
        });
    }

    try {
        // verifyToken throws if the token is invalid or expired
        const decoded = verifyToken(token);

        // Attach the decoded payload to the request object.
        // Every protected route handler can now access req.user.id and req.user.email.
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

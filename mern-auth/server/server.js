import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// ---------------------------------------------------------------------------
// CORS
//
// credentials: true
//   Tells the browser it is allowed to send cookies with cross-origin requests.
//   Without this, the browser strips the cookie from every request from the
//   frontend (localhost:5173) to the backend (localhost:5000).
//
// origin: CLIENT_URL
//   Must be an explicit origin string (not "*") when credentials: true is set.
//   The browser rejects "*" + credentials together as a security rule.
// ---------------------------------------------------------------------------
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

// ---------------------------------------------------------------------------
// Body Parser
// Parses incoming JSON request bodies into req.body
// ---------------------------------------------------------------------------
app.use(express.json());

// ---------------------------------------------------------------------------
// Cookie Parser
//
// Parses the Cookie header and populates req.cookies.
// Without this, req.cookies is undefined — the auth middleware cannot
// read the token cookie, and the GitHub state validation cannot work.
// ---------------------------------------------------------------------------
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
connectDB();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRoutes);

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

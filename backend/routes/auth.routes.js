const express = require("express");
const userService = require("../services/user.service");
const authMiddleware = require("../middleware/auth.middleware");
const { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } = require("../config/tokens");
const router = express.Router();

/**
 * Register a new organization and owner
 * Body: { name, email, password, organizationName }
 */
router.post("/register", async (req, res) => {
    try {
        const result = await userService.registerUser(req.body);

        // Set refresh token in secure httpOnly cookie
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(201).json({
            success: true,
            message: "Organization and owner registered successfully. Please verify your email.",
            data: {
                user: result.user,
                organization: result.organization,
                accessToken: result.accessToken
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * Verify Email Token
 * GET /api/auth/verify/:token
 */
router.get("/verify/:token", async (req, res) => {
    try {
        const result = await userService.verifyEmail(req.params.token);
        res.json({ success: true, message: result.message, email: result.email });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * Request Password Reset
 * POST /api/auth/forgot-password
 * Body: { email }
 */
router.post("/forgot-password", async (req, res) => {
    try {
        const result = await userService.requestPasswordReset(req.body.email);
        res.json({ success: true, message: result.message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * Reset Password with Token
 * POST /api/auth/reset-password/:token
 * Body: { password }
 */
router.post("/reset-password/:token", async (req, res) => {
    try {
        const result = await userService.resetPassword(req.params.token, req.body.password);
        res.json({ success: true, message: result.message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * Login existing user
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
    try {
        const result = await userService.loginUser(req.body);

        // Set refresh token in secure httpOnly cookie
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: result.user,
                accessToken: result.accessToken
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
});

/**
 * Issue a new access token using the refresh token from httpOnly cookie
 */
router.post("/refresh", async (req, res) => {
    try {
        const token = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!token) {
            return res.status(401).json({ success: false, message: "No refresh token provided" });
        }

        const result = await userService.refreshToken(token);

        // Rotate refresh token
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(200).json({
            success: true,
            message: "Token refreshed",
            data: {
                user: result.user,
                accessToken: result.accessToken
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
});

/**
 * Clear refresh token cookie on logout
 */
router.post("/logout", (req, res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
});

/**
 * Get current authenticated user profile
 */
router.get("/profile", authMiddleware, (req, res) => {
    res.json({ success: true, data: req.user });
});

/**
 * Delete account and trigger cascade cleanup
 * DELETE /api/auth/account
 */
router.delete("/account", authMiddleware, async (req, res) => {
    try {
        const result = await userService.deleteAccount(req.user.userId);
        res.clearCookie(REFRESH_COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });
        res.json({ success: true, message: result.message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

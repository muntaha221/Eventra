const mongoose = require("mongoose");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const Subscription = require("../models/subscription.model");
const Invite = require("../models/invite.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("./email.service");
const { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } = require("../config/tokens");

function generateSlug(name) {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    const suffix = crypto.randomBytes(3).toString("hex");
    return `${base || "org"}-${suffix}`;
}

function generateTokens(user) {
    const orgId = user.organization?._id
        ? user.organization._id.toString()
        : user.organization
        ? user.organization.toString()
        : null;

    const accessToken = jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: orgId
        },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh",
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
}

async function registerUser({ name, email, password, organizationName }) {
    if (!name) throw new Error("Name is required");
    if (!email) throw new Error("Email is required");
    if (!password) throw new Error("Password is required");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");
    if (!organizationName || !organizationName.trim()) {
        throw new Error("Organization name is required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) throw new Error("Email already registered");

    const userId = new mongoose.Types.ObjectId();
    const slug = generateSlug(organizationName);

    const organization = await Organization.create({
        name: organizationName.trim(),
        slug,
        planTier: "FREE",
        createdBy: userId
    });

    await Subscription.create({
        organization: organization._id,
        status: "active",
        planTier: "FREE"
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
        _id: userId,
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "ORG_OWNER",
        organization: organization._id,
        isEmailVerified: false,
        emailVerificationToken: verificationToken
    });

    // Send verification email & welcome email (fire-and-forget safely)
    try {
        emailService.sendVerificationEmail(user.email, user.name, verificationToken);
        emailService.sendWelcomeEmail(user.email, user.name);
    } catch (emailErr) {
        console.warn("Non-fatal email dispatch error:", emailErr.message);
    }

    // Enterprise Audit Log
    const { logAuditAction } = require("./audit.service");
    logAuditAction({
        actorId: user._id,
        actorEmail: user.email,
        action: "USER_REGISTER",
        targetId: user._id,
        metadata: {
            organizationId: organization._id,
            organizationName: organization.name
        }
    });

    const tokens = generateTokens({
        ...user.toObject(),
        organization: organization._id
    });

    return {
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            organization: {
                _id: organization._id,
                name: organization.name,
                slug: organization.slug,
                planTier: organization.planTier
            }
        },
        organization,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    };
}

async function verifyEmail(token) {
    if (!token) throw new Error("Verification token is required");

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) throw new Error("Invalid or expired verification token");

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    return { message: "Email verified successfully", email: user.email };
}

async function requestPasswordReset(email) {
    if (!email) throw new Error("Email is required");

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        // Do not disclose if user exists for security
        return { message: "If that email exists, a password reset link has been sent." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    return { message: "If that email exists, a password reset link has been sent." };
}

async function resetPassword(token, newPassword) {
    if (!token) throw new Error("Reset token is required");
    if (!newPassword || newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters");
    }

    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
        throw new Error("Invalid or expired password reset token");
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return { message: "Password has been successfully reset" };
}

async function loginUser({ email, password }) {
    if (!email) throw new Error("Email is required");
    if (!password) throw new Error("Password is required");

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate(
        "organization",
        "name slug planTier"
    );
    if (!user) throw new Error("Invalid email or password");

    const valid = await user.comparePassword(password);
    if (!valid) throw new Error("Invalid email or password");

    const tokens = generateTokens(user);

    return {
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            organization: user.organization || null
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    };
}

async function refreshToken(token) {
    if (!token) throw new Error("Refresh token required");

    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh";
    let decoded;
    try {
        decoded = jwt.verify(token, secret);
    } catch (err) {
        throw new Error("Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.userId).populate(
        "organization",
        "name slug planTier"
    );
    if (!user) throw new Error("User no longer exists");

    const tokens = generateTokens(user);

    return {
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            organization: user.organization || null
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    };
}

async function deleteAccount(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const Event = require("../models/event.model");
    const Ticket = require("../models/ticket.model");
    const Booking = require("../models/booking.model");
    const { logAuditAction } = require("./audit.service");

    const userEmail = user.email;
    const userRole = user.role;
    const orgId = user.organization;

    if (user.role === "ORG_OWNER" && orgId) {
        // Find all events belonging to this org
        const events = await Event.find({ organization: orgId }).select("_id");
        const eventIds = events.map(e => e._id);

        // Delete all Bookings, Tickets, Events for this organization
        await Booking.deleteMany({ organization: orgId });
        await Ticket.deleteMany({ event: { $in: eventIds } });
        await Event.deleteMany({ organization: orgId });

        // Downgrade all ORG_MEMBERs of this org to USER role
        await User.updateMany(
            { organization: orgId, _id: { $ne: userId } },
            { $set: { role: "USER", organization: null } }
        );

        // Delete Organization, Subscription, Invites
        await Organization.findByIdAndDelete(orgId);
        await Subscription.deleteMany({ organization: orgId });
        await Invite.deleteMany({ organization: orgId });
    } else {
        // Normal USER: only delete their bookings
        await Booking.deleteMany({ user: userId });
    }

    // Delete the user record
    await User.findByIdAndDelete(userId);

    // Audit log
    await logAuditAction({
        actorId: userId,
        actorEmail: userEmail,
        action: "ACCOUNT_DELETE",
        targetId: userId,
        metadata: { role: userRole, organizationId: orgId }
    });

    return { success: true, message: "Account and associated organization data deleted successfully." };
}

module.exports = {
    registerUser,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    loginUser,
    refreshToken,
    generateTokens,
    deleteAccount
};

const crypto = require("crypto");
const Invite = require("../models/invite.model");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const emailService = require("./email.service");
const userService = require("./user.service");

/**
 * Invite a new member to the Organization
 */
async function inviteMember(organizationId, inviterUser, { email, role }) {
    if (!email) throw new Error("Recipient email is required");

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already a member of this org
    const existingUser = await User.findOne({
        email: normalizedEmail,
        organization: organizationId
    });
    if (existingUser) {
        throw new Error("This user is already a member of your organization");
    }

    // Check if there is already an active pending invite
    const existingInvite = await Invite.findOne({
        email: normalizedEmail,
        organization: organizationId,
        status: "pending",
        expiresAt: { $gt: new Date() }
    });
    if (existingInvite) {
        throw new Error("An active invite has already been sent to this email address");
    }

    const org = await Organization.findById(organizationId);
    if (!org) throw new Error("Organization not found");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await Invite.create({
        email: normalizedEmail,
        organization: organizationId,
        role: "ORG_MEMBER",
        token,
        expiresAt,
        status: "pending",
        invitedBy: inviterUser.userId
    });

    // Send email invitation
    emailService.sendTeamInviteEmail(
        normalizedEmail,
        inviterUser.name,
        org.name,
        token
    );

    // Enterprise Audit Log
    const { logAuditAction } = require("./audit.service");
    logAuditAction({
        actorId: inviterUser.userId,
        actorEmail: inviterUser.email,
        action: "TEAM_INVITE",
        targetId: invite._id,
        metadata: { recipientEmail: normalizedEmail, orgName: org.name }
    });

    return {
        message: `Invitation successfully sent to ${normalizedEmail}`,
        invite: {
            _id: invite._id,
            email: invite.email,
            role: invite.role,
            expiresAt: invite.expiresAt,
            status: invite.status
        }
    };
}

/**
 * Get details of an invitation token (for the join page preview)
 */
async function getInviteByToken(token) {
    if (!token) throw new Error("Invite token is required");

    const invite = await Invite.findOne({
        token,
        status: "pending",
        expiresAt: { $gt: new Date() }
    }).populate("organization", "name slug planTier");

    if (!invite) {
        throw new Error("Invitation is invalid or has expired");
    }

    return invite;
}

/**
 * Accept invite and register as ORG_MEMBER directly (skips creating a new org)
 */
async function acceptInvite({ token, name, password }) {
    if (!token) throw new Error("Invite token is required");
    if (!name) throw new Error("Name is required");
    if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters");
    }

    const invite = await Invite.findOne({
        token,
        status: "pending",
        expiresAt: { $gt: new Date() }
    });

    if (!invite) {
        throw new Error("Invitation is invalid or has expired");
    }

    // Check if email already registered in system
    let user = await User.findOne({ email: invite.email });
    if (user) {
        if (user.organization) {
            throw new Error("User already belongs to an organization");
        }
        user.organization = invite.organization;
        user.role = "ORG_MEMBER";
        user.isEmailVerified = true;
        await user.save();
    } else {
        user = await User.create({
            name: name.trim(),
            email: invite.email,
            password,
            role: "ORG_MEMBER",
            organization: invite.organization,
            isEmailVerified: true
        });
    }

    invite.status = "accepted";
    await invite.save();

    const populatedUser = await User.findById(user._id).populate(
        "organization",
        "name slug planTier"
    );
    const tokens = userService.generateTokens(populatedUser);

    return {
        message: "Successfully joined the organization!",
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: populatedUser.organization
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    };
}

/**
 * List all invites for an organization
 */
async function getOrgInvites(organizationId) {
    return await Invite.find({ organization: organizationId })
        .populate("invitedBy", "name email")
        .sort({ createdAt: -1 });
}

module.exports = {
    inviteMember,
    getInviteByToken,
    acceptInvite,
    getOrgInvites
};


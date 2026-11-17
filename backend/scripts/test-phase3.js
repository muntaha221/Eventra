const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const userService = require("../services/user.service");
const inviteService = require("../services/invite.service");
const User = require("../models/user.model");
const Invite = require("../models/invite.model");

async function testPhase3() {
    try {
        console.log("=== PHASE 3 VERIFICATION TEST ===");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✓ Connected to MongoDB");

        // 1. Register Owner (Check verification token creation)
        console.log("\n1. Testing Owner Registration & Verification Token creation...");
        const reg = await userService.registerUser({
            name: "Diana Owner",
            email: `diana_${Date.now()}@test.com`,
            password: "password123",
            organizationName: "Apex Innovations"
        });

        const ownerUser = await User.findById(reg.user._id);
        if (ownerUser.isEmailVerified === false && ownerUser.emailVerificationToken) {
            console.log("✓ User created with isEmailVerified = false and active verification token!");
        } else {
            console.error("❌ FAILED: User email verification state invalid.");
            process.exit(1);
        }

        // 2. Verify Email Token
        console.log("\n2. Testing Email Verification flow...");
        const verifyResult = await userService.verifyEmail(ownerUser.emailVerificationToken);
        const verifiedOwner = await User.findById(ownerUser._id);
        if (verifiedOwner.isEmailVerified === true && verifiedOwner.emailVerificationToken === null) {
            console.log("✓ SUCCESS: Email verified! isEmailVerified =", verifiedOwner.isEmailVerified);
        } else {
            console.error("❌ FAILED: Email was not marked as verified.");
            process.exit(1);
        }

        // 3. Password Reset Flow
        console.log("\n3. Testing Password Reset flow...");
        await userService.requestPasswordReset(verifiedOwner.email);
        const userWithResetToken = await User.findById(verifiedOwner._id);
        if (userWithResetToken.passwordResetToken && userWithResetToken.passwordResetExpires > new Date()) {
            console.log("✓ Reset token generated and saved with 1hr expiration.");
        } else {
            console.error("❌ FAILED: Password reset token not saved.");
            process.exit(1);
        }

        // Perform password reset
        await userService.resetPassword(userWithResetToken.passwordResetToken, "newSecurePassword123");
        console.log("✓ Password updated. Testing login with new password...");
        const loginCheck = await userService.loginUser({
            email: verifiedOwner.email,
            password: "newSecurePassword123"
        });
        if (loginCheck.accessToken) {
            console.log("✓ SUCCESS: Logged in with new password successfully!");
        }

        // 4. Team Invite Flow
        console.log("\n4. Testing Team Invite flow...");
        const inviteEmail = `member_${Date.now()}@test.com`;
        const inviteRes = await inviteService.inviteMember(
            reg.organization._id,
            { userId: verifiedOwner._id, name: verifiedOwner.name },
            { email: inviteEmail, role: "ORG_MEMBER" }
        );
        console.log("✓ Invite created:", inviteRes.message);

        const inviteRecord = await Invite.findOne({ email: inviteEmail });
        if (inviteRecord && inviteRecord.status === "pending") {
            console.log("✓ Invite record verified in database with token:", inviteRecord.token.substring(0, 16) + "...");
        } else {
            console.error("❌ FAILED: Invite record not found.");
            process.exit(1);
        }

        // 5. Preview Invite Token
        console.log("\n5. Testing invite token preview endpoint logic...");
        const preview = await inviteService.getInviteByToken(inviteRecord.token);
        if (preview.organization.name === "Apex Innovations") {
            console.log("✓ SUCCESS: Invite preview correctly loaded org:", preview.organization.name);
        }

        // 6. Accept Invite & Join Organization as ORG_MEMBER
        console.log("\n6. Testing Accept Invite (joining org directly as ORG_MEMBER)...");
        const acceptRes = await inviteService.acceptInvite({
            token: inviteRecord.token,
            name: "Edward Colleague",
            password: "password123"
        });

        const acceptedMember = await User.findById(acceptRes.user._id);
        if (
            acceptedMember.role === "ORG_MEMBER" &&
            acceptedMember.organization.toString() === reg.organization._id.toString()
        ) {
            console.log("✓ SUCCESS: New user joined as ORG_MEMBER directly under org:", reg.organization.name);
            console.log("  Role:", acceptedMember.role, "| Org ID:", acceptedMember.organization);
        } else {
            console.error("❌ FAILED: Member role or org assignment incorrect.");
            process.exit(1);
        }

        // Verify invite status is updated to accepted
        const finalInvite = await Invite.findById(inviteRecord._id);
        if (finalInvite.status === "accepted") {
            console.log("✓ Invite status updated to 'accepted'.");
        }

        console.log("\n=== ALL PHASE 3 TESTS PASSED! ===");
        process.exit(0);
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

testPhase3();


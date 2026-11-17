const nodemailer = require("nodemailer");
const templateService = require("./template.service");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error) => {
    if (error) console.error("Email configuration error:", error.message);
    else console.log("Transactional email server ready");
});

async function sendWelcomeEmail(userEmail, userName) {
    try {
        const html = templateService.renderTemplate("welcome.html", {
            name: userName,
            appName: process.env.APP_NAME || "Eventra"
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: `Welcome to ${process.env.APP_NAME || "Eventra"}`,
            html
        });
    } catch (error) {
        console.error("Welcome email failed:", error.message);
    }
}

async function sendVerificationEmail(userEmail, userName, verificationToken) {
    try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

        const html = templateService.renderTemplate("verify-email.html", {
            name: userName,
            verifyUrl,
            appName: process.env.APP_NAME || "Eventra"
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: `Verify your email for ${process.env.APP_NAME || "Eventra"}`,
            html
        });
    } catch (error) {
        console.error("Verification email failed:", error.message);
    }
}

async function sendPasswordResetEmail(userEmail, userName, resetToken) {
    try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        const html = templateService.renderTemplate("reset-password.html", {
            name: userName,
            resetUrl,
            appName: process.env.APP_NAME || "Eventra"
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: `Reset your password for ${process.env.APP_NAME || "Eventra"}`,
            html
        });
    } catch (error) {
        console.error("Password reset email failed:", error.message);
    }
}

async function sendTeamInviteEmail(recipientEmail, inviterName, orgName, inviteToken) {
    try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const inviteUrl = `${frontendUrl}/join-team?token=${inviteToken}`;

        const html = templateService.renderTemplate("team-invite.html", {
            inviterName,
            orgName,
            inviteUrl,
            appName: process.env.APP_NAME || "Eventra"
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: recipientEmail,
            subject: `You are invited to join ${orgName} on ${process.env.APP_NAME || "Eventra"}`,
            html
        });
    } catch (error) {
        console.error("Team invite email failed:", error.message);
    }
}

async function sendBookingConfirmationEmail(user, booking, event, ticket) {
    try {
        const html = templateService.renderTemplate("booking-confirmation.html", {
            name: user.name,
            eventTitle: event.title,
            eventDate: new Date(event.date).toDateString(),
            eventLocation: event.location || "Online / TBD",
            ticketType: ticket.type,
            quantity: booking.quantity,
            totalPrice: booking.totalPrice,
            bookingReference: booking.bookingReference,
            qrCode: booking.qrCode,
            appName: process.env.APP_NAME || "Eventra"
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: `Booking Confirmed [${booking.bookingReference}] — ${event.title}`,
            html
        });
    } catch (error) {
        console.error("Booking confirmation email error:", error.message);
    }
}

module.exports = {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendTeamInviteEmail,
    sendBookingConfirmationEmail
};

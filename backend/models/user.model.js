const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["USER", "ORG_OWNER", "ORG_MEMBER", "SUPER_ADMIN"],
            default: "USER"
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            default: null
        },
        isEmailVerified: { type: Boolean, default: false },
        emailVerificationToken: { type: String, default: null },
        passwordResetToken: { type: String, default: null },
        passwordResetExpires: { type: Date, default: null }
    },
    { timestamps: true }
);

// Database Indexing (ESR Rule)
userSchema.index({ organization: 1 });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

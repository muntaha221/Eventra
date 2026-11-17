const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ success: false, message: "Invalid token format" });
        }

        const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("email name role organization");
        if (!user) {
            return res.status(401).json({ success: false, message: "User no longer exists" });
        }

        req.user = {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organization ? user.organization.toString() : null
        };

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

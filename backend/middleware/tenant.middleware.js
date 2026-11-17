function attachTenant(req, res, next) {
    const { role, organizationId } = req.user;

    if (role === "USER" || role === "SUPER_ADMIN") {
        return next();
    }

    if (!organizationId) {
        return res.status(403).json({ success: false, message: "No organization associated" });
    }

    req.organizationId = organizationId;
    next();
}

module.exports = { attachTenant };

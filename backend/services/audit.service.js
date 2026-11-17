const AuditLog = require("../models/audit-log.model");

/**
 * Reusable helper to record enterprise audit logs.
 */
async function logAuditAction({
    actorId = null,
    actorEmail = "system",
    action,
    targetId = null,
    metadata = {}
}) {
    try {
        const log = await AuditLog.create({
            actorId,
            actorEmail,
            action,
            targetId: targetId ? targetId.toString() : null,
            metadata,
            timestamp: new Date()
        });
        return log;
    } catch (err) {
        console.error("Audit log error:", err.message);
        return null;
    }
}

/**
 * Fetch paginated audit logs (SUPER_ADMIN only)
 */
async function getAuditLogs(queryParams = {}) {
    let page = parseInt(queryParams.page) || 1;
    let limit = parseInt(queryParams.limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const filter = {};
    if (queryParams.action) filter.action = queryParams.action;
    if (queryParams.actorEmail) filter.actorEmail = new RegExp(queryParams.actorEmail, "i");

    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
        AuditLog.countDocuments(filter),
        AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
    ]);

    return {
        data: logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

module.exports = {
    logAuditAction,
    getAuditLogs
};

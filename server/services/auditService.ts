const AuditLog = require("../models/AuditLog");

const addAuditLog = async ({ userId, capsuleId, action, result, reason }) => {
    try {
        await AuditLog.create({
            userId,
            capsuleId,
            action,
            result,
            reason,
        });
    } catch (error) {
        console.error("Error writing audit log:", error.message);
    }
};

module.exports = { addAuditLog };
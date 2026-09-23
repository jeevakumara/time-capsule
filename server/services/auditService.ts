const AuditLog = require("../models/AuditLog");

interface AuditLogParams {
    userId: any;
    capsuleId: any;
    action: string;
    result: string;
    reason: string;
}

const addAuditLog = async ({ userId, capsuleId, action, result, reason }: AuditLogParams) => {
    try {
        await AuditLog.create({
            userId,
            capsuleId,
            action,
            result,
            reason,
        });
    } catch (error: any) {
        console.error("Error writing audit log:", error.message);
    }
};

module.exports = { addAuditLog };
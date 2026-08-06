const AuditLog = require("../models/AuditLog");

const getRecentLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("userId", "name email role")
            .populate("capsuleId", "title");
        res.status(200).json({ success: true, logs });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs",
            error: error.message,
        });
    }
};

module.exports = { getRecentLogs };

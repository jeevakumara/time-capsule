const USER_ROLES = {
    ADMIN: 'admin',
    HR: 'hr',
    INTERVIEWER: 'interviewer'
};

const USER_STATUS = {
    ACTIVE: 'active',
    DISABLED: 'disabled'
};

const CAPSULE_STATUS = {
    PENDING: 'pending',
    UNLOCKED: 'unlocked',
    EXPIRED: 'expired'
};

const AUDIT_ACTIONS = {
    CREATE: 'CREATE_CAPSULE',
    UNLOCK: 'UNLOCK_ATTEMPT',
    DELETE: 'DELETE_CAPSULE',
    LOGIN: 'LOGIN_ATTEMPT'
};

module.exports = {
    USER_ROLES,
    USER_STATUS,
    CAPSULE_STATUS,
    AUDIT_ACTIONS
};

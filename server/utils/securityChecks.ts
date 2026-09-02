/**
 * Validates the time lock constraints of a capsule.
 * 
 * @param {Date|string} unlockTime - The time the capsule unlocks
 * @param {Date|string|undefined} expiryTime - The optional time the capsule expires
 * @returns {[boolean, string]} A tuple representing [isValid, errorMessage]
 */
function validateTimeLock(unlockTime, expiryTime) {
    const now = new Date();
    const unlock = new Date(unlockTime);

    if (now < unlock) {
        return [false, "Capsule unlock time has not arrived yet."];
    }

    if (expiryTime) {
        const expiry = new Date(expiryTime);
        if (now > expiry) {
            return [false, "Capsule has expired."];
        }
    }

    return [true, "Time lock is valid."];
}

module.exports = {
    validateTimeLock
};

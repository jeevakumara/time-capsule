/**
 * Phase 8: Time-lock validation — timezone-agnostic UTC handling.
 *
 * JavaScript Date objects are always stored as UTC epoch milliseconds
 * internally, so comparisons between `new Date()` and MongoDB Date fields
 * (which are also UTC) are inherently timezone-agnostic.
 *
 * We use Date.now() (returns UTC ms) rather than `new Date()` to make the
 * UTC intent explicit and avoid any confusion with display-timezone offsets.
 */

/**
 * Validates the time-lock constraints of a capsule.
 *
 * @param unlockTime - The UTC datetime the capsule becomes accessible
 * @param expiryTime - The optional UTC datetime after which the capsule expires
 * @returns [isValid: boolean, errorMessage: string]
 */
function validateTimeLock(unlockTime: Date | string, expiryTime?: Date | string): [boolean, string] {
    const nowMs = Date.now(); // UTC epoch ms — server time, not client time

    const unlock = new Date(unlockTime);
    if (isNaN(unlock.getTime())) {
        return [false, "Capsule has an invalid unlock time configuration."];
    }

    if (nowMs < unlock.getTime()) {
        const diff = Math.ceil((unlock.getTime() - nowMs) / 60000);
        return [false, `Capsule unlock time has not arrived yet. Available in ~${diff} minute(s).`];
    }

    if (expiryTime) {
        const expiry = new Date(expiryTime);
        if (isNaN(expiry.getTime())) {
            return [false, "Capsule has an invalid expiry time configuration."];
        }
        if (nowMs > expiry.getTime()) {
            return [false, "Capsule has expired."];
        }
    }

    return [true, "Time lock is valid."];
}

/**
 * Phase 7: Validate that GPS coordinates are within physically possible ranges.
 *
 * @param lat - Latitude from the client (-90 to 90)
 * @param lng - Longitude from the client (-180 to 180)
 * @returns [isValid: boolean, errorMessage: string]
 */
function validateGpsCoordinates(lat: number, lng: number): [boolean, string] {
    if (typeof lat !== "number" || typeof lng !== "number") {
        return [false, "Latitude and longitude must be numbers."];
    }
    if (!isFinite(lat) || !isFinite(lng)) {
        return [false, "Latitude and longitude must be finite numbers."];
    }
    if (lat < -90 || lat > 90) {
        return [false, `Latitude ${lat} is out of valid range (-90 to 90).`];
    }
    if (lng < -180 || lng > 180) {
        return [false, `Longitude ${lng} is out of valid range (-180 to 180).`];
    }
    return [true, "Coordinates are valid."];
}

module.exports = { validateTimeLock, validateGpsCoordinates };

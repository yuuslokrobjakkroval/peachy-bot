// javascript
const config = require('../config');
const UserCommunity = require('../schemas/userCommunity');

const LEVELS = {
    EVERYONE: 0,
    PLAYER: 1,
    STAFF: 2,
    PARTNER: 3,
    DEV: 4,
    OWNER: 5,
};

const CACHE_TTL = 30_000; // 30s
const cache = new Map(); // userId -> { level, expiresAt }

function _setCache(userId, level) {
    cache.set(userId, { level, expiresAt: Date.now() + CACHE_TTL });
}

function _getCache(userId) {
    const entry = cache.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(userId);
        return null;
    }
    return entry.level;
}

/**
 * Resolve numeric permission level for a user.
 * Order:
 *  - explicit owners/devs in config
 *  - guild role ids from config (staff/partner)
 *  - userCommunity document role field
 *  - default: PLAYER if in guild else EVERYONE
 */
async function getPermissionLevel(member, userId, guild) {
    const cached = _getCache(userId);
    if (cached !== null) return cached;

    // config explicit ids
    if (Array.isArray(config.owners) && config.owners.includes(userId)) {
        _setCache(userId, LEVELS.OWNER);
        return LEVELS.OWNER;
    }
    if (Array.isArray(config.devs) && config.devs.includes(userId)) {
        _setCache(userId, LEVELS.DEV);
        return LEVELS.DEV;
    }

    // guild roles (member may be null in DM)
    if (member && member.roles && member.roles.cache) {
        if (Array.isArray(config.staffRoleIds) && member.roles.cache.some(r => config.staffRoleIds.includes(r.id))) {
            _setCache(userId, LEVELS.STAFF);
            return LEVELS.STAFF;
        }
        if (Array.isArray(config.partnerRoleIds) && member.roles.cache.some(r => config.partnerRoleIds.includes(r.id))) {
            _setCache(userId, LEVELS.PARTNER);
            return LEVELS.PARTNER;
        }
    }

    // DB fallback: userCommunity schema
    try {
        const doc = await UserCommunity.findOne({ userId }).lean();
        if (doc && doc.role) {
            let level = LEVELS.PLAYER;
            const role = String(doc.role).toLowerCase();
            if (role === 'owner') level = LEVELS.OWNER;
            else if (role === 'developer' || role === 'dev') level = LEVELS.DEV;
            else if (role === 'staff') level = LEVELS.STAFF;
            else if (role === 'partner' || role === 'partnership') level = LEVELS.PARTNER;
            _setCache(userId, level);
            return level;
        }
    } catch (err) {
        // swallow DB errors; caller may log if needed
    }

    const defaultLevel = member ? LEVELS.PLAYER : LEVELS.EVERYONE;
    _setCache(userId, defaultLevel);
    return defaultLevel;
}

/**
 * returns true if user's resolved level >= requiredLevel
 */
async function hasPermission(member, userId, requiredLevel, guild) {
    const level = await getPermissionLevel(member, userId, guild);
    return level >= (requiredLevel ?? LEVELS.EVERYONE);
}

module.exports = {
    LEVELS,
    getPermissionLevel,
    hasPermission,
};

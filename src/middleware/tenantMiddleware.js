const Tenant = require('../models/Tenant');
const User = require('../models/User');

const resolveTenant = async (req, res, next) => {
    try {
        // 1. Check if user is logged in (from authMiddleware)
        if (req.user && req.user.tenantId) {
            req.tenantId = req.user.tenantId;
            return next();
        }

        // 2. Check for x-tenant-id header (for public APIs or pre-login)
        const tenantSlug = req.headers['x-tenant-slug'];
        if (tenantSlug) {
            const tenant = await Tenant.findOne({ slug: tenantSlug });
            if (tenant) {
                req.tenantId = tenant._id;
            }
        }

        next();
    } catch (error) {
        console.error('Tenant resolution error:', error);
        next();
    }
};

module.exports = { resolveTenant };

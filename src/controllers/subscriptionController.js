const asyncHandler = require('../utils/asyncHandler');
const Subscription = require('../models/Subscription');

// @desc    Get my subscription
// @route   GET /api/subscriptions/me
// @access  Private
const getMySubscription = asyncHandler(async (req, res) => {
    let subscription = await Subscription.findOne({ user: req.user._id, isActive: true });

    if (!subscription) {
        // Create default free subscription
        subscription = await Subscription.create({
            user: req.user._id,
            plan: 'free',
            tenantId: req.user.tenantId,
        });
    }

    res.json(subscription);
});

// @desc    Upgrade subscription (Mock)
// @route   POST /api/subscriptions/upgrade
// @access  Private
const upgradeSubscription = asyncHandler(async (req, res) => {
    const { plan } = req.body; // 'pro' or 'premium'

    if (!['pro', 'premium'].includes(plan)) {
        res.status(400);
        throw new Error('Invalid plan');
    }

    // Mock Payment Logic would go here

    // Deactivate old subscription
    await Subscription.updateMany(
        { user: req.user._id, isActive: true },
        { isActive: false, endDate: Date.now() }
    );

    // Create new subscription
    const subscription = await Subscription.create({
        user: req.user._id,
        plan,
        isActive: true,
        startDate: Date.now(),
        tenantId: req.user.tenantId,
        // endDate: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json(subscription);
});

module.exports = {
    getMySubscription,
    upgradeSubscription,
};

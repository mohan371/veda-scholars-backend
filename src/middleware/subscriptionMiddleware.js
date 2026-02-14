const Subscription = require('../models/Subscription');

const checkSubscription = (requiredPlan = 'free') => {
    return async (req, res, next) => {
        try {
            // Free plan always allowed
            if (requiredPlan === 'free') {
                return next();
            }

            const subscription = await Subscription.findOne({
                user: req.user._id,
                isActive: true,
                endDate: { $gt: Date.now() },
            });

            if (!subscription) {
                // Check if user is on trial or has admin override?
                // For now, strict check
                res.status(403);
                throw new Error(`This feature requires a ${requiredPlan} subscription.`);
            }

            const plans = ['free', 'pro', 'premium'];
            const userPlanIndex = plans.indexOf(subscription.plan);
            const requiredPlanIndex = plans.indexOf(requiredPlan);

            if (userPlanIndex < requiredPlanIndex) {
                res.status(403);
                throw new Error(`Upgrade to ${requiredPlan} to access this feature.`);
            }

            req.subscription = subscription;
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = { checkSubscription };

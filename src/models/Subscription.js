const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
        },
        plan: {
            type: String, // free, pro, premium
            required: true,
            enum: ['free', 'pro', 'premium'],
            default: 'free',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        paymentId: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Check if subscription is valid
subscriptionSchema.methods.isValid = function () {
    return this.isActive && (!this.endDate || this.endDate > Date.now());
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;

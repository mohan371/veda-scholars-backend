const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        university: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'University',
            required: true,
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
        },
        status: {
            type: String,
            enum: [
                'pending',
                'approved', // Partner approved to move forward
                'rejected',
                'in_review',
                'offer_received',
                'visa_process',
                'completed'
            ],
            default: 'pending',
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
applicationSchema.index({ student: 1, status: 1 });
applicationSchema.index({ university: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);

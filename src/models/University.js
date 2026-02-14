const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            unique: true,
            trim: true,
        },
        country: {
            type: String,
            required: [true, 'Please add a country'],
        },
        city: {
            type: String,
        },
        description: {
            type: String,
        },
        tuitionFee: {
            type: Number,
        },
        courses: {
            type: [String],
        },
        intakeMonths: {
            type: [String],
        },
        ranking: {
            type: Number,
        },
        logoUrl: {
            type: String,
        },
        backgroundImageUrl: {
            type: String,
        },
        partner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
universitySchema.index({ name: 'text', country: 'text', city: 'text' });
universitySchema.index({ country: 1, tuitionFee: 1 });
universitySchema.index({ ranking: 1 });

module.exports = mongoose.model('University', universitySchema);

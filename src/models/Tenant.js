const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a tenant name'],
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            required: [true, 'Please add a slug'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        adminEmail: {
            type: String,
            required: [true, 'Please add an admin email'],
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        plan: {
            type: String,
            enum: ['free', 'pro', 'enterprise'],
            default: 'free'
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Tenant', tenantSchema);

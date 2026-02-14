const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['student', 'partner', 'admin'],
            required: true,
        },
        isApproved: {
            type: Boolean,
            default: function () {
                return this.role !== 'partner';
            },
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
        },
        fcmTokens: [{
            type: String
        }],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);

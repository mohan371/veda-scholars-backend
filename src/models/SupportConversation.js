const mongoose = require('mongoose');

const supportConversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userType: {
        type: String,
        enum: ['student', 'industry', 'university'],
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
        index: true
    },
    priority: {
        type: String,
        enum: ['normal', 'high', 'urgent'],
        default: 'normal'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    closedAt: Date,
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for efficient queries
supportConversationSchema.index({ status: 1, lastMessageAt: -1 });
supportConversationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('SupportConversation', supportConversationSchema);

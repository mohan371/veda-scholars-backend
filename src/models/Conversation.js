const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        content: String,
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: Date,
        type: {
            type: String,
            enum: ['text', 'file'],
            default: 'text'
        }
    },
    unreadCounts: {
        type: Map,
        of: Number, // userId -> count
        default: {}
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'blocked'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index for fetching user's conversations efficiently
conversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

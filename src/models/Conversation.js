const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Ensure one conversation per user
    },
    role: {
        type: String,
        enum: ['student', 'partner'],
        required: true
    },
    lastMessage: {
        type: String,
        default: null
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    unreadByAdmin: {
        type: Number,
        default: 0
    },
    unreadByUser: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for performance
conversationSchema.index({ user: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ unreadByAdmin: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);

const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'admin'], // Normalized roles for message sender
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Indexes for performance
supportMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);

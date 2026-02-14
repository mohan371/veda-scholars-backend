const express = require('express');
const router = express.Router();
const SupportConversation = require('../models/SupportConversation');
const SupportMessage = require('../models/SupportMessage');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/admin/support/conversations
// @desc    Get all support conversations (with filters)
// @access  Private (Admin)
router.get('/conversations', protect, admin, async (req, res) => {
    try {
        const { userType, status, priority } = req.query;

        const filter = {};
        if (userType) filter.userType = userType;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const conversations = await SupportConversation.find(filter)
            .populate('userId', 'name email role')
            .populate('closedBy', 'name email')
            .sort({ lastMessageAt: -1 });

        res.json({ conversations });
    } catch (error) {
        console.error('Error fetching support conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/support/:id/messages
// @desc    Get messages for a specific conversation
// @access  Private (Admin)
router.get('/:id/messages', protect, admin, async (req, res) => {
    try {
        const conversationId = req.params.id;

        const conversation = await SupportConversation.findById(conversationId)
            .populate('userId', 'name email role');

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const messages = await SupportMessage.find({ conversationId })
            .populate('senderId', 'name email role')
            .sort({ createdAt: 1 });

        res.json({ conversation, messages });
    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/support/reply
// @desc    Admin reply to support conversation
// @access  Private (Admin)
router.post('/reply', protect, admin, async (req, res) => {
    try {
        const { conversationId, message } = req.body;
        const adminId = req.user._id;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const conversation = await SupportConversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Create admin message
        const supportMessage = await SupportMessage.create({
            conversationId,
            senderId: adminId,
            senderRole: 'admin',
            message: message.trim()
        });

        // Update conversation lastMessageAt
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Populate sender info
        await supportMessage.populate('senderId', 'name email role');

        res.status(201).json({ message: supportMessage });
    } catch (error) {
        console.error('Error sending admin reply:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/support/:id/close
// @desc    Close a support conversation
// @access  Private (Admin)
router.put('/:id/close', protect, admin, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const adminId = req.user._id;

        const conversation = await SupportConversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        conversation.status = 'closed';
        conversation.closedAt = new Date();
        conversation.closedBy = adminId;
        await conversation.save();

        res.json({ conversation });
    } catch (error) {
        console.error('Error closing conversation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/support/:id/priority
// @desc    Update conversation priority
// @access  Private (Admin)
router.put('/:id/priority', protect, admin, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { priority } = req.body;

        if (!['normal', 'high', 'urgent'].includes(priority)) {
            return res.status(400).json({ message: 'Invalid priority' });
        }

        const conversation = await SupportConversation.findByIdAndUpdate(
            conversationId,
            { priority },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.json({ conversation });
    } catch (error) {
        console.error('Error updating priority:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

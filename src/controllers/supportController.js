const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');
const { getIo } = require('../services/socketService');

// @desc    User sends message (Create/Update Conversation)
// @route   POST /api/support/message
// @access  Private (User/Partner)
const sendUserMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role; // strict: 'student' or 'partner'

    if (!message) {
        res.status(400);
        throw new Error("Message required");
    }

    // 1. Find or Create Conversation
    let conversation = await Conversation.findOne({ user: userId });

    if (!conversation) {
        conversation = await Conversation.create({
            user: userId,
            role: userRole,
            lastMessage: message,
            lastMessageAt: Date.now(),
            unreadByAdmin: 1, // Start with 1 unread
            unreadByUser: 0
        });
    } else {
        // Update existing
        conversation.lastMessage = message;
        conversation.lastMessageAt = Date.now();
        conversation.unreadByAdmin += 1; // Increment
        await conversation.save();
    }

    // 2. Create Message
    const newMessage = await SupportMessage.create({
        conversationId: conversation._id,
        sender: userId,
        senderRole: 'user', // Normalized to 'user' for frontend simplicity
        message
    });

    await newMessage.populate('sender', 'name avatar');

    // 3. Socket Emit
    const io = getIo();
    if (io) {
        const payload = {
            message: newMessage,
            conversationId: conversation._id
        };
        // Emit to Admin Room
        io.to('admin_room').emit('receive_support_message', payload);
        // Also emit to user's own room just in case multiple devices
        io.to(userId.toString()).emit('receive_support_message', payload);
    }

    res.status(201).json(newMessage);
});

// @desc    Get Current User's Conversation
// @route   GET /api/support/my-conversation
// @access  Private
const getMyConversation = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find conversation
    const conversation = await Conversation.findOne({ user: userId })
        .populate('user', 'name email avatar');

    if (!conversation) {
        return res.json({ conversation: null, messages: [] });
    }

    // Reset unreadByUser since user is viewing it
    if (conversation.unreadByUser > 0) {
        conversation.unreadByUser = 0;
        await conversation.save();
    }

    // Fetch messages
    const messages = await SupportMessage.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 })
        .populate('sender', 'name avatar');

    res.json({ conversation, messages });
});

// @desc    Admin: Get All Conversations
// @route   GET /api/support/admin/conversations
// @access  Private (Admin)
const getAllConversations = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({})
        .populate('user', 'name email avatar')
        .sort({ lastMessageAt: -1 }); // Newest first

    res.json(conversations);
});

// @desc    Admin: Get Specific Conversation Messages
// @route   GET /api/support/admin/:conversationId
// @access  Private (Admin)
const getAdminConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
        .populate('user', 'name email avatar');

    if (!conversation) {
        res.status(404);
        throw new Error("Conversation not found");
    }

    // Reset unreadByAdmin
    if (conversation.unreadByAdmin > 0) {
        conversation.unreadByAdmin = 0;
        await conversation.save();
    }

    const messages = await SupportMessage.find({ conversationId })
        .sort({ createdAt: 1 })
        .populate('sender', 'name avatar');

    res.json({ conversation, messages });
});

// @desc    Admin: Reply to User
// @route   POST /api/support/admin/reply
// @access  Private (Admin)
const adminReply = asyncHandler(async (req, res) => {
    const { conversationId, message } = req.body;
    const adminId = req.user._id;

    if (!message || !conversationId) {
        res.status(400);
        throw new Error("Message and Conversation ID required");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        res.status(404);
        throw new Error("Conversation not found");
    }

    // Update Conversation
    conversation.lastMessage = message;
    conversation.lastMessageAt = Date.now();
    conversation.unreadByUser += 1; // Increment user unread
    await conversation.save();

    // Create Message
    const newMessage = await SupportMessage.create({
        conversationId: conversation._id,
        sender: adminId,
        senderRole: 'admin',
        message
    });

    await newMessage.populate('sender', 'name avatar');

    // Socket Emit
    const io = getIo();
    if (io) {
        const payload = {
            message: newMessage,
            conversationId: conversation._id
        };
        // Emit to User (target is conversation.user)
        io.to(conversation.user.toString()).emit('receive_support_message', payload);
        // Emit to Admin Room (so other admins see it)
        io.to('admin_room').emit('receive_support_message', payload);
    }

    res.status(201).json(newMessage);
});

module.exports = {
    sendUserMessage,
    getMyConversation,
    getAllConversations,
    getAdminConversation,
    adminReply
};

const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { getIo } = require('../services/socketService');

// @desc    Get all conversations for a user (or all if admin)
// @route   GET /api/support/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    let query = {};
    if (!isAdmin) {
        query = { participants: userId };
    }

    const conversations = await Conversation.find(query)
        .populate('participants', 'name email role')
        .populate('lastMessage.sender', 'name')
        .sort({ updatedAt: -1 });

    res.json(conversations);
});

// @desc    Get messages for a conversation
// @route   GET /api/support/messages/:conversationId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify access
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    const isAdmin = req.user.role === 'admin';
    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());

    if (!isAdmin && !isParticipant) {
        res.status(403);
        throw new Error('Not authorized to view this conversation');
    }

    const messages = await Message.find({ conversationId })
        .populate('sender', 'name role')
        .sort({ createdAt: 1 });

    res.json(messages);
});

// @desc    Send a message
// @route   POST /api/support/send
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { content, type, fileUrl, conversationId } = req.body;
    const senderId = req.user._id;

    if (!content && type === 'text') {
        res.status(400);
        throw new Error('Message content is required');
    }

    let conversation;

    // If conversationId is provided, check existence
    if (conversationId) {
        conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            res.status(404);
            throw new Error('Conversation not found');
        }
    } else {
        // If no conversationId, check if one exists between user and admin
        // For simplicity in this support system, we assume a single conversation per user for now
        // OR create a new one. Let's find active conversation for this user.
        conversation = await Conversation.findOne({
            participants: senderId,
            status: 'active'
        });

        if (!conversation) {
            // Create new conversation with all admins? Or just leave open?
            // Usually, support chat is User <-> Support Team.
            // We'll add the user to participants. Admins can view all.
            // We might need to auto-assign an admin or just have it open.
            // For now, list the user as participant. Admins can join explicitly or implicitly.
            conversation = await Conversation.create({
                participants: [senderId],
                unreadCounts: { [senderId]: 0 } // Initialize
            });
        }
    }

    const message = await Message.create({
        conversationId: conversation._id,
        sender: senderId,
        content: content || (type === 'file' ? 'Sent a file' : ''),
        type: type || 'text',
        fileUrl: fileUrl || null,
        status: 'sent'
    });

    // Update conversation
    conversation.lastMessage = {
        content: message.content,
        sender: senderId,
        createdAt: message.createdAt,
        type: message.type
    };

    // Increment unread counts for others
    conversation.participants.forEach(pId => {
        if (pId.toString() !== senderId.toString()) {
            const current = conversation.unreadCounts.get(pId.toString()) || 0;
            conversation.unreadCounts.set(pId.toString(), current + 1);
        }
    });

    // If admin is NOT in participants (e.g. new chat), they see it via "All Conversations"
    // Ideally admin should be notified.

    await conversation.save();

    // Socket.IO - Emit to conversation room (and specific user room)
    const io = getIo();
    io.to(conversation._id.toString()).emit('new_message', {
        message: await message.populate('sender', 'name role')
    });

    // Also emit 'conversation_updated' to all participants (and admins)
    // For simplicity, we can emit to user's personal room
    conversation.participants.forEach(userId => {
        io.to(userId.toString()).emit('conversation_updated', conversation);
    });
    // Emit to admin room
    io.to('admin_room').emit('conversation_updated', conversation);

    // Send Push Notification
    const { sendPushNotification } = require('../services/pushNotificationService');

    // Notify all participants except sender
    conversation.participants.forEach(pId => {
        if (pId.toString() !== senderId.toString()) {
            sendPushNotification(
                pId,
                'New Support Message',
                type === 'text' ? content : 'New attachment',
                { conversationId: conversation._id.toString() }
            );
        }
    });

    res.status(201).json(message);
});

// @desc    Start a new conversation
// @route   POST /api/support/start
// @access  Private
const startConversation = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Check if active conversation exists
    let conversation = await Conversation.findOne({
        participants: userId,
        status: 'active'
    });

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [userId],
            unreadCounts: {},
            updatedAt: new Date()
        });

        // Notify admin
        getIo().to('admin_room').emit('conversation_updated', conversation);
    }

    res.status(200).json(conversation);
});

// @desc    Mark messages as seen
// @route   PATCH /api/support/seen
// @access  Private
const markSeen = asyncHandler(async (req, res) => {
    const { conversationId } = req.body;
    const userId = req.user._id;

    await Message.updateMany(
        { conversationId, seenBy: { $ne: userId } },
        {
            $addToSet: { seenBy: userId },
            $set: { status: 'seen' }
        }
    );

    // Reset unread count
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
        if (conversation.unreadCounts.has(userId.toString())) {
            conversation.unreadCounts.set(userId.toString(), 0);
            await conversation.save();
        }
    }

    // Emit 'messages_seen' event to conversation room so participants update UI
    const io = getIo();
    io.to(conversationId).emit('messages_seen', {
        conversationId,
        seenBy: userId
    });

    res.json({ success: true });
});

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    startConversation,
    markSeen
};

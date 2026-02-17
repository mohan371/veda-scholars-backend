const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    sendUserMessage,
    getMyConversation,
    getAllConversations,
    getAdminConversation,
    adminReply
} = require('../controllers/supportController');

// User Routes
router.post('/message', protect, sendUserMessage);
router.get('/my-conversation', protect, getMyConversation);

// Admin Routes
router.get('/admin/conversations', protect, admin, getAllConversations);
router.get('/admin/:conversationId', protect, admin, getAdminConversation);
router.post('/admin/reply', protect, admin, adminReply);

module.exports = router;

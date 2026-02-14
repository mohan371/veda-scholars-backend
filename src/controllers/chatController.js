const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');

// @desc    Get chat history with a specific user
// @route   GET /api/chat/:userId
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
        $or: [
            { sender: myId, receiver: userId },
            { sender: userId, receiver: myId },
        ],
    }).sort({ createdAt: 1 });

    res.json(messages);
});

module.exports = {
    getChatHistory,
};

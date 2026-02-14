const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 });
    res.json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    if (notification.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
});

// Helper to create notification internally
const createNotification = async (userId, title, message, type = 'info') => {
    try {
        const User = require('../models/User');
        const user = await User.findById(userId);

        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            tenantId: user ? user.tenantId : null
        });

        // Real-time emit
        try {
            const { getIo } = require('../services/socketService');
            const io = getIo();
            io.to(userId.toString()).emit('notification', notification);
        } catch (e) {
            console.log('Socket not initialized or user not connected');
        }

    } catch (error) {
        console.error('Notification creation failed:', error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    createNotification
};

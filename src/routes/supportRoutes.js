const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getConversations,
    getMessages,
    sendMessage,
    startConversation,
    markSeen
} = require('../controllers/supportController');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return the file URL relative to server root
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
});

router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/send', sendMessage);
router.post('/start', startConversation);
router.patch('/seen', markSeen);

module.exports = router;

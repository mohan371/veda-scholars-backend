const express = require('express');
const router = express.Router();
const { getChatHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:userId', getChatHistory);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getMySubscription, upgradeSubscription } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/me', getMySubscription);
router.post('/upgrade', upgradeSubscription);

module.exports = router;

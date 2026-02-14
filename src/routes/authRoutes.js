const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getUsers, approvePartner } = require('../controllers/authController');
const { getSystemStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/approve/:id', protect, authorize('admin'), approvePartner);
router.get('/admin/stats', protect, authorize('admin'), getSystemStats);

module.exports = router;

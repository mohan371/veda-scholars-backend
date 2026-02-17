const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { registerUser, loginUser, getMe, getUsers, approvePartner } = require('../controllers/authController');
const { getSystemStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
], validate, registerUser);

router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], validate, loginUser);

router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin', 'system_admin'), getUsers); // Added system_admin just in case
router.put('/approve/:id', protect, authorize('admin'), approvePartner);
router.get('/admin/stats', protect, authorize('admin'), getSystemStats);

module.exports = router;

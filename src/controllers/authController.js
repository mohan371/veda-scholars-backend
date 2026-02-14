const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        tenantId: req.body.tenantId, // Optional manual assignment
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    console.log("==== LOGIN START ====");
    console.log("Body received:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        console.log("Missing fields");
        res.status(400);
        throw new Error('Email and password required');
    }

    const user = await User.findOne({ email });
    console.log("User query finished");

    if (!user) {
        console.log("User not found");
        res.status(400);
        throw new Error('User not found');
    }

    console.log("Comparing password...");
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        console.log("Password mismatch");
        res.status(400);
        throw new Error('Invalid credentials');
    }

    console.log("Login success");

    // TEMP: Auto approve for development
    if (user.role === 'partner' && !user.isApproved) {
        console.log("Auto-approving partner account for development...");
        user.isApproved = true;
        await user.save();
    }

    // Check approval for partners
    if (user.role === 'partner' && !user.isApproved) {
        res.status(403);
        throw new Error('Account not approved yet');
    }

    res.json({
        message: "Login successful",
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        token: generateToken(user._id, user.role),
    });
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private (Admin)
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

// @desc    Approve partner
// @route   PUT /api/auth/approve/:id
// @access  Private (Admin)
const approvePartner = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.isApproved = true;
        const updatedUser = await user.save();

        // Notification Trigger
        await createNotification(
            user._id,
            'Account Approved',
            'Your partner account has been approved. You can now add universities.',
            'success'
        );

        res.json(updatedUser);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    getUsers,
    approvePartner,
};

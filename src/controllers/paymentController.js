const asyncHandler = require('../utils/asyncHandler');
const Payment = require('../models/Payment');
const Application = require('../models/Application');
const { createNotification } = require('./notificationController');

// @desc    Process a mock payment
// @route   POST /api/payments
// @access  Private
const processPayment = asyncHandler(async (req, res) => {
    const { applicationId, amount } = req.body;

    const application = await Application.findById(applicationId);

    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }

    if (application.student.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized to pay for this application');
    }

    // Mock Payment Processing
    const isSuccess = Math.random() > 0.1; // 90% success rate

    if (isSuccess) {
        const transactionId = 'txn_' + Math.random().toString(36).substr(2, 9);

        const payment = await Payment.create({
            student: req.user.id,
            application: applicationId,
            amount,
            status: 'completed',
            transactionId,
            tenantId: req.tenantId, // Attach Tenant
        });

        // Update application status if needed? 
        // For now, just notify.
        await createNotification(
            req.user.id,
            'Payment Successful',
            `Payment of $${amount} for application to ${application.university.name} was successful.`,
            'success'
        );

        res.json(payment);
    } else {
        res.status(400);
        throw new Error('Payment failed. Please try again.');
    }
});

// @desc    Get my payments
// @route   GET /api/payments/my
// @access  Private
const getMyPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find({ student: req.user.id }).sort({ createdAt: -1 });
    res.json(payments);
});

module.exports = {
    processPayment,
    getMyPayments
};

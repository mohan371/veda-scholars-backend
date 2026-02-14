const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const University = require('../models/University');
const Application = require('../models/Application');

// @desc    Get system wide statistics
// @route   GET /api/auth/admin/stats
// @access  Private/Admin
const getSystemStats = asyncHandler(async (req, res) => {
    // 1. Counts
    const totalUsers = await User.countDocuments({});
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalPartners = await User.countDocuments({ role: 'partner' });
    const totalUniversities = await University.countDocuments({});
    const totalApplications = await Application.countDocuments({});

    // 2. Application Status Distribution
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const approvedApplications = await Application.countDocuments({ status: 'offer_received' }); // Assuming 'offer_received' is 'approved'
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });
    const completedApplications = await Application.countDocuments({ status: 'completed' });

    // 3. Monthly Growth (Applications by Month) - Last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyApplications = await Application.aggregate([
        {
            $match: {
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({
        overview: {
            totalUsers,
            totalStudents,
            totalPartners,
            totalUniversities,
            totalApplications
        },
        applications: {
            pending: pendingApplications,
            approved: approvedApplications,
            rejected: rejectedApplications,
            completed: completedApplications,
            total: totalApplications
        },
        growth: monthlyApplications.map(item => ({
            month: item._id.month,
            year: item._id.year,
            count: item.count
        }))
    });
});

module.exports = {
    getSystemStats
};

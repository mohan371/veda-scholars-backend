const asyncHandler = require('../utils/asyncHandler');
const Application = require('../models/Application');
const University = require('../models/University');
const { createNotification } = require('./notificationController');

// @desc    Apply to a university
// @route   POST /api/applications
// @access  Private (Student)
const applyToUniversity = asyncHandler(async (req, res) => {
    const { universityId, notes } = req.body;

    const applicationExists = await Application.findOne({
        student: req.user.id,
        university: universityId,
    });

    const university = await University.findById(universityId);
    if (university && university.partner.toString() === req.user.id) {
        res.status(400);
        throw new Error('Partners cannot apply to their own universities');
    }

    if (applicationExists) {
        res.status(400);
        throw new Error('You have already applied to this university');
    }

    const application = await Application.create({
        student: req.user.id,
        university: universityId,
        notes,
        tenantId: req.tenantId, // Attach Tenant
    });

    res.status(201).json(application);
});

// @desc    Get my applications
// @route   GET /api/applications/my
// @access  Private (Student)
const getMyApplications = asyncHandler(async (req, res) => {
    const applications = await Application.find({ student: req.user.id })
        .populate('university', 'name country city ranking tuitionFee')
        .sort('-createdAt');

    res.json(applications);
});

// @desc    Get all applications (Partner/Admin)
// @route   GET /api/applications
// @access  Private (Partner/Admin)
const getAllApplications = asyncHandler(async (req, res) => {
    let query = {};

    // Filter by Tenant
    if (req.tenantId) {
        query.tenantId = req.tenantId;
    }

    // If partner, only show applications for their universities
    if (req.user.role === 'partner') {
        const universities = await University.find({ partner: req.user.id });
        const universityIds = universities.map((uni) => uni._id);
        query = { ...query, university: { $in: universityIds } };
    }

    const applications = await Application.find(query)
        .populate('student', 'name email')
        .populate('university', 'name country')
        .sort('-createdAt');

    res.json(applications);
});

// @desc    Update application status
// @route   PUT /api/applications/:id
// @access  Private (Partner/Admin)
const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { status, notes } = req.body;

    const application = await Application.findById(req.params.id).populate(
        'university'
    );

    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }

    // Check ownership for partners
    if (
        req.user.role === 'partner' &&
        application.university.partner.toString() !== req.user.id
    ) {
        res.status(401);
        throw new Error('Not authorized to update this application');
    }

    application.status = status;
    if (notes) application.notes = notes;

    const updatedApplication = await application.save();

    // Notification Trigger
    await createNotification(
        application.student,
        'Application Status Update',
        `Your application to ${application.university.name} has been updated to: ${status}`,
        status === 'offer_received' ? 'success' : status === 'rejected' ? 'error' : 'info'
    );

    // Real-time emit for Application Update
    try {
        const { getIo } = require('../services/socketService');
        const io = getIo();
        io.to(application.student.toString()).emit('application_updated', updatedApplication);

        // Also emit to tenant room for admins/partners
        if (application.tenantId) {
            io.to(application.tenantId.toString()).emit('application_updated', updatedApplication);
        }
    } catch (e) {
        console.log('Socket emit failed:', e.message);
    }

    res.json(updatedApplication);
});

module.exports = {
    applyToUniversity,
    getMyApplications,
    getAllApplications,
    updateApplicationStatus,
};

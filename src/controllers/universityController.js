const asyncHandler = require('../utils/asyncHandler');
const University = require('../models/University');

// @desc    Get all universities
// @route   GET /api/universities
// @access  Public
const getUniversities = asyncHandler(async (req, res) => {
    const keyword = req.query.keyword
        ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i',
            },
        }
        : {};

    let query = { ...keyword, isActive: true };

    // Partner filter
    if (req.query.partner) {
        query.partner = req.query.partner;
    }

    // Tenant filter
    if (req.tenantId) {
        query.tenantId = req.tenantId;
    }

    const universities = await University.find(query);

    res.json(universities);
});

// @desc    Get university by ID
// @route   GET /api/universities/:id
// @access  Public
const getUniversity = asyncHandler(async (req, res) => {
    const university = await University.findById(req.params.id);

    if (university) {
        res.json(university);
    } else {
        res.status(404);
        throw new Error('University not found');
    }
});

// @desc    Create a university
// @route   POST /api/universities
// @access  Private (Partner/Admin)
const createUniversity = asyncHandler(async (req, res) => {
    const {
        name,
        country,
        city,
        description,
        tuitionFee,
        courses,
        intakeMonths,
        ranking,
    } = req.body;

    const university = new University({
        name,
        country,
        city,
        description,
        tuitionFee,
        courses,
        intakeMonths,
        ranking,
        partner: req.user.id,
        tenantId: req.tenantId, // Attach Tenant
    });

    const createdUniversity = await university.save();
    res.status(201).json(createdUniversity);
});

// @desc    Update a university
// @route   PUT /api/universities/:id
// @access  Private (Partner/Admin)
const updateUniversity = asyncHandler(async (req, res) => {
    const {
        name,
        country,
        city,
        description,
        tuitionFee,
        courses,
        intakeMonths,
        ranking,
        isActive,
    } = req.body;

    const university = await University.findById(req.params.id);

    if (university) {
        // Check ownership (unless admin)
        if (
            university.partner.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            res.status(401);
            throw new Error('Not authorized to update this university');
        }

        university.name = name || university.name;
        university.country = country || university.country;
        university.city = city || university.city;
        university.description = description || university.description;
        university.tuitionFee = tuitionFee || university.tuitionFee;
        university.courses = courses || university.courses;
        university.intakeMonths = intakeMonths || university.intakeMonths;
        university.ranking = ranking || university.ranking;
        if (isActive !== undefined) university.isActive = isActive;

        const updatedUniversity = await university.save();
        res.json(updatedUniversity);
    } else {
        res.status(404);
        throw new Error('University not found');
    }
});

// @desc    Delete a university
// @route   DELETE /api/universities/:id
// @access  Private (Partner/Admin)
const deleteUniversity = asyncHandler(async (req, res) => {
    const university = await University.findById(req.params.id);

    if (university) {
        // Check ownership (unless admin)
        if (
            university.partner.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            res.status(401);
            throw new Error('Not authorized to delete this university');
        }

        await university.deleteOne();
        res.json({ message: 'University removed' });
    } else {
        res.status(404);
        throw new Error('University not found');
    }
});

module.exports = {
    getUniversities,
    getUniversity,
    createUniversity,
    updateUniversity,
    deleteUniversity,
};

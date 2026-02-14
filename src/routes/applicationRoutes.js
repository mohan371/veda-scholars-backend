const express = require('express');
const router = express.Router();
const {
    applyToUniversity,
    getMyApplications,
    getAllApplications,
    updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('student'), applyToUniversity);
router.get('/my', protect, authorize('student'), getMyApplications);
router.get('/', protect, authorize('partner', 'admin'), getAllApplications);
router.put('/:id', protect, authorize('partner', 'admin'), updateApplicationStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    getUniversities,
    createUniversity,
    updateUniversity,
    deleteUniversity,
    getUniversity
} = require('../controllers/universityController');
const { getRecommendations } = require('../controllers/recommendationController'); // Import
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
    .get(getUniversities)
    .post(protect, authorize('partner', 'admin'), createUniversity);

router.get('/recommend', getRecommendations); // Add Recommend Route (before /:id)

router.route('/:id')
    .get(getUniversity)
    .put(protect, authorize('partner', 'admin'), updateUniversity)
    .delete(protect, authorize('partner', 'admin'), deleteUniversity);

module.exports = router;

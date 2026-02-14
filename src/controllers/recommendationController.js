const asyncHandler = require('../utils/asyncHandler');
const University = require('../models/University');

// @desc    Get AI-recommended universities
// @route   GET /api/universities/recommend
// @access  Public (or Private)
const getRecommendations = asyncHandler(async (req, res) => {
    const { country, budget, rankingWeight } = req.query;

    // 1. Fetch all active universities
    const universities = await University.find({ isActive: true });

    // 2. Fetch Popularity Metrics (Application Counts)
    const Application = require('../models/Application');
    const popularityStats = await Application.aggregate([
        { $group: { _id: "$university", count: { $sum: 1 } } }
    ]);
    const popularityMap = {};
    let maxApplications = 0;
    popularityStats.forEach(stat => {
        popularityMap[stat._id.toString()] = stat.count;
        if (stat.count > maxApplications) maxApplications = stat.count;
    });

    // 3. Scoring Algorithm
    const scoredUniversities = universities.map(uni => {
        let score = 0;
        const reasons = [];

        // Criteria 1: Budget Match (30%)
        if (budget) {
            const budgetVal = parseFloat(budget);
            if (uni.tuitionFee <= budgetVal) {
                score += 30;
                reasons.push('Fits your budget');
            } else if (uni.tuitionFee <= budgetVal * 1.15) {
                score += 15; // Within 15% range
                reasons.push('Slightly above budget');
            }
        } else {
            score += 15; // Neutral if no budget specified
        }

        // Criteria 2: Country Match (25%)
        if (country && uni.country.toLowerCase() === country.toLowerCase()) {
            score += 25;
            reasons.push('Location match');
        }

        // Criteria 3: Ranking (20%)
        // Normalized: (1 - rank/1000) * 20. Capped at rank 1000.
        const rank = uni.ranking || 1000;
        const rankScore = Math.max(0, (1 - rank / 1000) * 20);
        score += rankScore;
        if (rank <= 100) reasons.push('Top 100 University');

        // Criteria 4: Popularity (15%)
        const appCount = popularityMap[uni._id.toString()] || 0;
        const popularityScore = maxApplications > 0 ? (appCount / maxApplications) * 15 : 0;
        score += popularityScore;
        if (popularityScore > 10) reasons.push('High student interest');

        // Criteria 5: Probability/Success (10%)
        // Mocked logic: Lower ranking + High acceptance rate (simulated)
        const acceptanceRate = 0.7; // Mock
        score += acceptanceRate * 10;

        return {
            ...uni.toObject(),
            matchScore: Math.round(score), // Integer 0-100
            matchReasons: reasons
        };
    });

    // 4. Sort by Score (Descending)
    scoredUniversities.sort((a, b) => b.matchScore - a.matchScore);

    // Return top matches
    res.json(scoredUniversities.slice(0, 10));
});

module.exports = {
    getRecommendations
};

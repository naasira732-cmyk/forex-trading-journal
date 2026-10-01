const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/overview', analyticsController.getOverview);
router.get('/pairs', analyticsController.getPerformanceByPair);
router.get('/strategies', analyticsController.getPerformanceByStrategy);
router.get('/sessions', analyticsController.getPerformanceBySession);
router.get('/timeframes', analyticsController.getPerformanceByTimeframe);
router.get('/calendar', analyticsController.getCalendar);

module.exports = router;

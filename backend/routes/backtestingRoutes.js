const express = require('express');
const router = express.Router();
const backtestingController = require('../controllers/backtestingController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', backtestingController.getBacktestingSessions);
router.get('/:id', backtestingController.getBacktestingSessionById);
router.post('/', backtestingController.createBacktestingSession);
router.put('/:id', backtestingController.updateBacktestingSession);
router.delete('/:id', backtestingController.deleteBacktestingSession);

module.exports = router;

const express = require('express');
const router = express.Router();
const strategyController = require('../controllers/strategyController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', strategyController.getStrategies);
router.get('/:id', strategyController.getStrategyById);
router.post('/', strategyController.createStrategy);
router.put('/:id', strategyController.updateStrategy);
router.delete('/:id', strategyController.deleteStrategy);

module.exports = router;

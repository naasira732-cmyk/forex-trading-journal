const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all trade endpoints
router.use(authMiddleware);

router.get('/', tradeController.getTrades);
router.get('/:id', tradeController.getTradeById);
router.post('/', tradeController.createTrade);
router.put('/:id', tradeController.updateTrade);
router.delete('/:id', tradeController.deleteTrade);

module.exports = router;

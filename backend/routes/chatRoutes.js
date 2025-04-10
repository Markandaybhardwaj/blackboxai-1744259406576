const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getChatHistory,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes in this router
router.use(protect);

// Chat routes
router.post('/', sendMessage);
router.get('/history', getChatHistory);

module.exports = router;

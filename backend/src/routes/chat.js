const express = require('express');
const router = express.Router();
const ChatService = require('../services/chatService');
const { v4: uuidv4 } = require('uuid');

router.post('/message', async (req, res, next) => {
  try {
    const { sessionToken, message } = req.body;

    console.log('CHAT REQUEST:', req.body);

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'A valid message is required'
      });
    }

    // Assign a new session token if none exists
    const token = sessionToken || uuidv4();

    // Log the user's message
    await ChatService.logMessage(token, 'user', message);

    // Process and get response
    const botResponse = await ChatService.processMessage(token, message);

    // Log the bot's response
    await ChatService.logMessage(token, 'bot', botResponse.text, botResponse.confidence, botResponse.source);

    res.json({
      sessionToken: token,
      reply: botResponse.text,
      confidence: botResponse.confidence,
      source: botResponse.source
    });
  } catch (error) {
    next(error);
  }
});

const { authenticateAdmin } = require('../middlewares/auth');
router.get('/unanswered', authenticateAdmin, async (req, res, next) => {
  try {
    const db = require('../config/database');

    const query = `
      SELECT
        user_msg.id,
        user_msg.message AS user_message,
        user_msg.created_at AS timestamp,
        fallback_msg.confidence_score,
        fallback_msg.response_source
      FROM messages AS fallback_msg
      JOIN LATERAL (
        SELECT
          m.id,
          m.message,
          m.created_at
        FROM messages AS m
        WHERE
          m.conversation_id = fallback_msg.conversation_id
          AND m.sender = 'user'
          AND m.created_at < fallback_msg.created_at
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS user_msg ON true
      WHERE
        fallback_msg.sender = 'bot'
        AND fallback_msg.response_source = 'FALLBACK'
      ORDER BY user_msg.created_at DESC;
    `;

    const result = await db.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch unanswered queries:', error);
    next(error);
  }
});

module.exports = router;

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
    const result = await db.query(`
      SELECT m.id, m.message, m.created_at AS timestamp, c.session_id
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.source = 'FALLBACK' AND m.sender = 'bot'
      ORDER BY m.created_at DESC
    `);
    // Wait, the FALLBACK is on the bot's response. The user's question is the previous message in the same conversation.
    // Let's get messages where the bot answered with FALLBACK, and join the preceding user message.
    // A simpler way: when we log FALLBACK, it's the bot. The unanswered query is the user's message right before it.
    // Let's just do a simpler query: select the user message right before the fallback.
    const query = `
      SELECT m1.content as user_message, m1.timestamp, m2.confidence_score
      FROM messages m1
      JOIN messages m2 ON m1.conversation_id = m2.conversation_id AND m1.id = m2.id - 1
      WHERE m2.source = 'FALLBACK' AND m1.sender = 'user'
      ORDER BY m1.timestamp DESC
    `;
    const fallbackResults = await db.query(query);
    res.json(fallbackResults.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

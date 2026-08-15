const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateAdmin } = require('../middlewares/auth');

// ============================================================
// ADMIN LOGIN
// ============================================================

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
      {
        expiresIn: '24h'
      }
    );

    res.json({
      token,
      username: user.username
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ANALYTICS
// ============================================================

router.get('/analytics', authenticateAdmin, async (req, res, next) => {
  try {
    const totalLeads = await db.query(
      'SELECT COUNT(*) FROM leads'
    );

    const totalConversations = await db.query(
      'SELECT COUNT(*) FROM conversations'
    );

    // Low-confidence bot messages
    const lowConfidence = await db.query(`
      SELECT *
      FROM messages
      WHERE sender = 'bot'
        AND confidence_score < 0.5
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json({
      stats: {
        leads: parseInt(totalLeads.rows[0].count),
        conversations: parseInt(totalConversations.rows[0].count)
      },
      lowConfidence: lowConfidence.rows
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// CONVERSATION HISTORY — LIST
// ============================================================

router.get(
  '/conversations',
  authenticateAdmin,
  async (req, res, next) => {
    try {
      const result = await db.query(`
        SELECT
          c.id,
          c.session_id,
          c.lead_id,
          c.status,
          c.created_at,
          c.updated_at,
          COUNT(m.id)::int AS message_count
        FROM conversations c
        LEFT JOIN messages m
          ON m.conversation_id = c.id
        GROUP BY
          c.id,
          c.session_id,
          c.lead_id,
          c.status,
          c.created_at,
          c.updated_at
        ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// CONVERSATION HISTORY — SINGLE CONVERSATION
// ============================================================

router.get(
  '/conversations/:id',
  authenticateAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const conversationResult = await db.query(
        `
        SELECT
          id,
          session_id,
          lead_id,
          status,
          created_at,
          updated_at,
          state,
          context
        FROM conversations
        WHERE id = $1
        `,
        [id]
      );

      if (conversationResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Conversation not found'
        });
      }

      const messagesResult = await db.query(
        `
        SELECT
          id,
          conversation_id,
          sender,
          message,
          confidence_score,
          response_source,
          created_at,
          intent,
          knowledge_entry_id
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
        `,
        [id]
      );

      res.json({
        conversation: conversationResult.rows[0],
        messages: messagesResult.rows
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// DELETE CONVERSATION
// ============================================================

// ============================================================
// DELETE CONVERSATION
// ============================================================

router.delete(
  '/conversations/:id',
  authenticateAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Verify that the conversation exists
      const conversationResult = await db.query(
        'SELECT id FROM conversations WHERE id = $1',
        [id]
      );

      if (conversationResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Conversation not found'
        });
      }

      // Delete all messages belonging to the conversation
      await db.query(
        'DELETE FROM messages WHERE conversation_id = $1',
        [id]
      );

      // Delete the conversation itself.
      // The associated lead is intentionally preserved.
      await db.query(
        'DELETE FROM conversations WHERE id = $1',
        [id]
      );

      return res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      console.error('Conversation deletion error:', error);
      next(error);
    }
  }
);

module.exports = router;
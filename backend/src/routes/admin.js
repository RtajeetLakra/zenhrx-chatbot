const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateAdmin } = require('../middlewares/auth');

// Admin Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
      { expiresIn: '24h' }
    );

    res.json({ token, username: user.username });
  } catch (error) {
    next(error);
  }
});

// Get Analytics (Conversations and low confidence)
router.get('/analytics', authenticateAdmin, async (req, res, next) => {
  try {
    const totalLeads = await db.query('SELECT COUNT(*) FROM leads');
    const totalConversations = await db.query('SELECT COUNT(*) FROM conversations');
    
    // Low confidence messages to improve knowledge base
    const lowConfidence = await db.query(`
      SELECT * FROM messages 
      WHERE sender = 'bot' AND confidence_score < 0.5 
      ORDER BY timestamp DESC LIMIT 20
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

module.exports = router;

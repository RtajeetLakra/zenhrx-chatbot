const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateAdmin } = require('../middlewares/auth');

// Get all leads (Admin only)
router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Update lead status (Admin only)
router.put('/:id/status', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await db.query(
      'UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete lead (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const LeadService = require('../services/leadService');
    await LeadService.deleteLead(id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

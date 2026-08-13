const express = require('express');
const router = express.Router();
const KnowledgeService = require('../services/knowledgeService');
const { authenticateAdmin } = require('../middlewares/auth');
const db = require('../config/database');

// Get all categories
router.get('/categories', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Search
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
    
    const result = await KnowledgeService.search(q);
    res.json(result || { message: 'No matches found' });
  } catch (error) {
    next(error);
  }
});

// Admin ONLY: Add a question
router.post('/questions', authenticateAdmin, async (req, res, next) => {
  try {
    const { categoryId, canonicalQuestion, answerText } = req.body;
    const result = await KnowledgeService.addQuestion(categoryId, canonicalQuestion, answerText);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Admin ONLY: Get all questions
router.get('/questions', authenticateAdmin, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT q.id, q.canonical_question, q.is_active, c.name as category, a.answer_text 
      FROM questions q
      LEFT JOIN categories c ON q.category_id = c.id
      LEFT JOIN answers a ON q.id = a.question_id
      ORDER BY q.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Admin ONLY: Update a question
router.put('/questions/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoryId, canonicalQuestion, answerText } = req.body;
    const result = await KnowledgeService.updateQuestion(id, categoryId, canonicalQuestion, answerText);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Admin ONLY: Delete a question
router.delete('/questions/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await KnowledgeService.deleteQuestion(id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

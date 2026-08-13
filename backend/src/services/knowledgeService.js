const db = require('../config/database');

class KnowledgeService {
  /**
   * Search the knowledge base for a matching question
   * Utilizes PostgreSQL full-text search
   */
  static async search(query) {
    // Simple exact match first
    const exactMatchQuery = `
      SELECT a.answer_text, q.canonical_question, 1.0 as confidence
      FROM questions q
      JOIN answers a ON q.id = a.question_id
      WHERE q.canonical_question ILIKE $1 AND q.is_active = true
      LIMIT 1;
    `;
    const exactMatch = await db.query(exactMatchQuery, [`%${query}%`]);
    
    if (exactMatch.rows.length > 0) {
      return exactMatch.rows[0];
    }

    // Full text search using pg_trgm (or plain ts_vector if pg_trgm not enabled)
    const ftsQuery = `
      SELECT a.answer_text, q.canonical_question,
      ts_rank(q.search_vector, plainto_tsquery('english', $1)) as confidence
      FROM questions q
      JOIN answers a ON q.id = a.question_id
      WHERE q.search_vector @@ plainto_tsquery('english', $1) AND q.is_active = true
      ORDER BY confidence DESC
      LIMIT 1;
    `;
    const ftsMatch = await db.query(ftsQuery, [query]);
    
    if (ftsMatch.rows.length > 0) {
      return ftsMatch.rows[0];
    }

    return null; // No match found
  }

  static async addQuestion(categoryId, canonicalQuestion, answerText) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const insertQuestion = await client.query(
        'INSERT INTO questions (category_id, canonical_question) VALUES ($1, $2) RETURNING id',
        [categoryId, canonicalQuestion]
      );
      const questionId = insertQuestion.rows[0].id;
      
      await client.query(
        'INSERT INTO answers (question_id, answer_text) VALUES ($1, $2)',
        [questionId, answerText]
      );
      await client.query('COMMIT');
      return { id: questionId, categoryId, canonicalQuestion, answerText };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  static async updateQuestion(id, categoryId, canonicalQuestion, answerText) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE questions SET category_id = $1, canonical_question = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [categoryId, canonicalQuestion, id]
      );
      await client.query(
        'UPDATE answers SET answer_text = $1, updated_at = CURRENT_TIMESTAMP WHERE question_id = $2',
        [answerText, id]
      );
      await client.query('COMMIT');
      return { id, categoryId, canonicalQuestion, answerText };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async deleteQuestion(id) {
    // The answers table has ON DELETE CASCADE for question_id
    const query = 'DELETE FROM questions WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = KnowledgeService;

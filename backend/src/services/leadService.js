const db = require('../config/database');

class LeadService {
  static async createLead(data) {
    const { name, company, email, mobile, employeeCount, requirement, preferredDemoTime } = data;
    const query = `
      INSERT INTO leads (name, company, email, mobile, employee_count, requirement, preferred_demo_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [name, company, email, mobile, employeeCount, requirement, preferredDemoTime];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async updateLead(id, data) {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;

    const setString = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = keys.map(key => data[key]);
    
    const query = `
      UPDATE leads
      SET ${setString}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }
  static async deleteLead(id) {
    const query = 'DELETE FROM leads WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = LeadService;

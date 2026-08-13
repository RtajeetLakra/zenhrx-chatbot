import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KnowledgeManager = ({ token }) => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newQ, setNewQ] = useState({ categoryId: '', canonicalQuestion: '', answerText: '' });
  const [editId, setEditId] = useState(null);
  const [unanswered, setUnanswered] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [qRes, cRes, uRes] = await Promise.all([
        axios.get('http://localhost:5000/api/knowledge/questions', { headers }),
        axios.get('http://localhost:5000/api/knowledge/categories', { headers }),
        axios.get('http://localhost:5000/api/chat/unanswered', { headers }).catch(() => ({ data: [] }))
      ]);
      setQuestions(qRes.data);
      setCategories(cRes.data);
      setUnanswered(uRes.data);
      if (cRes.data.length > 0 && !editId) {
        setNewQ(prev => ({ ...prev, categoryId: cRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch knowledge base data');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/knowledge/questions/${editId}`, newQ, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEditId(null);
      } else {
        await axios.post('http://localhost:5000/api/knowledge/questions', newQ, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setNewQ({ categoryId: categories[0]?.id || '', canonicalQuestion: '', answerText: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save question');
    }
  };

  const handleEdit = (q) => {
    setEditId(q.id);
    setNewQ({
      categoryId: q.category_id || (categories.find(c => c.name === q.category)?.id) || '',
      canonicalQuestion: q.canonical_question,
      answerText: q.answer_text || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/knowledge/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete question');
    }
  };

  const handleAddFromUnanswered = (msg) => {
    setEditId(null);
    setNewQ({ categoryId: categories[0]?.id || '', canonicalQuestion: msg.user_message, answerText: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Knowledge Base Management</h2>
      
      <div style={{ background: 'var(--bubble-bot)', padding: '24px', borderRadius: '12px', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
        <h3>{editId ? 'Edit Question' : 'Add New Question'}</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <select 
            value={newQ.categoryId} 
            onChange={e => setNewQ({...newQ, categoryId: e.target.value})}
            className="chat-input"
            required
          >
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="Question (e.g., How do I reset my password?)" 
            value={newQ.canonicalQuestion} 
            onChange={e => setNewQ({...newQ, canonicalQuestion: e.target.value})}
            className="chat-input"
            required
          />
          <textarea 
            placeholder="Answer" 
            value={newQ.answerText} 
            onChange={e => setNewQ({...newQ, answerText: e.target.value})}
            className="chat-input"
            rows={4}
            required
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="chat-send-btn" style={{ width: '120px', borderRadius: '8px' }}>
              {editId ? 'Update Entry' : 'Add Entry'}
            </button>
            {editId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditId(null);
                  setNewQ({ categoryId: categories[0]?.id || '', canonicalQuestion: '', answerText: '' });
                }}
                style={{ width: '120px', borderRadius: '8px', padding: '8px 16px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ background: 'var(--bubble-bot)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
        <h3>Existing Entries</h3>
        <table style={{ width: '100%', textAlign: 'left', marginTop: '16px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-color)' }}>
              <th style={{ padding: '12px' }}>Question</th>
              <th style={{ padding: '12px' }}>Category</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id} style={{ borderBottom: '1px solid var(--bg-color)' }}>
                <td style={{ padding: '12px' }}>{q.canonical_question}</td>
                <td style={{ padding: '12px' }}>{q.category}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', background: q.is_active ? '#dcfce7' : '#fee2e2', color: q.is_active ? '#166534' : '#991b1b', fontSize: '0.85rem' }}>
                    {q.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(q)} style={{ padding: '4px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', border: 'none', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(q.id)} style={{ padding: '4px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'var(--bubble-bot)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', marginTop: '32px' }}>
        <h3>Unanswered Queries</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>Questions asked by users that the bot could not answer.</p>
        <table style={{ width: '100%', textAlign: 'left', marginTop: '16px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-color)' }}>
              <th style={{ padding: '12px' }}>Time</th>
              <th style={{ padding: '12px' }}>User Message</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {unanswered.map((u, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--bg-color)' }}>
                <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {new Date(u.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '12px' }}>{u.user_message}</td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => handleAddFromUnanswered(u)} style={{ padding: '4px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', border: 'none', cursor: 'pointer' }}>Add Answer</button>
                </td>
              </tr>
            ))}
            {unanswered.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No unanswered queries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KnowledgeManager;

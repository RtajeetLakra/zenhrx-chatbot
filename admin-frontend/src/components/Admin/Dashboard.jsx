import React, { useState, useEffect } from 'react';
import axios from 'axios';
import KnowledgeManager from './KnowledgeManager';
import LeadTracker from './LeadTracker';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('knowledge');
  const [stats, setStats] = useState({ leads: 0, conversations: 0 });
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', { username, password });
      setToken(res.data.token);
      localStorage.setItem('adminToken', res.data.token);
    } catch (err) {
      alert('Login failed');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.stats);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setToken('');
        localStorage.removeItem('adminToken');
      }
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <form onSubmit={handleLogin} style={{ background: 'var(--bubble-bot)', padding: '32px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
          <h2>Admin Login</h2>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="chat-input" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="chat-input" />
          <button type="submit" className="chat-send-btn" style={{ width: '100%', borderRadius: '8px' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '32px' }}>HRMS Admin</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Leads</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.leads}</div>
        </div>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Conversations</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.conversations}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('knowledge')}
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'knowledge' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'knowledge' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Knowledge Base
          </button>
          <button 
            onClick={() => setActiveTab('leads')}
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'leads' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'leads' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Lead Management
          </button>
          <button 
            onClick={() => { setToken(''); localStorage.removeItem('adminToken'); }}
            style={{ padding: '12px', textAlign: 'left', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', marginTop: 'auto' }}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        {activeTab === 'knowledge' && <KnowledgeManager token={token} />}
        {activeTab === 'leads' && <LeadTracker token={token} />}
      </div>
    </div>
  );
};

export default Dashboard;

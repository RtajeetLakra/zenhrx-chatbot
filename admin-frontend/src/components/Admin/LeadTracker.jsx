import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeadTracker = ({ token }) => {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/leads/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLeads();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/leads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLeads();
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Lead Management</h2>
      
      <div style={{ background: 'var(--bubble-bot)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-color)' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Company</th>
              <th style={{ padding: '12px' }}>Contact</th>
              <th style={{ padding: '12px' }}>Employees</th>
              <th style={{ padding: '12px' }}>Time</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} style={{ borderBottom: '1px solid var(--bg-color)' }}>
                <td style={{ padding: '12px' }}>{lead.name}</td>
                <td style={{ padding: '12px' }}>{lead.company}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.9rem' }}>{lead.email}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lead.mobile}</div>
                </td>
                <td style={{ padding: '12px' }}>{lead.employee_count}</td>
                <td style={{ padding: '12px' }}>{lead.preferred_demo_time}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem',
                    background: lead.status === 'NEW' ? '#dbeafe' : lead.status === 'CONTACTED' ? '#fef3c7' : '#dcfce7',
                    color: lead.status === 'NEW' ? '#1e40af' : lead.status === 'CONTACTED' ? '#92400e' : '#166534'
                  }}>
                    {lead.status}
                  </span>
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  <select 
                    value={lead.status} 
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <button onClick={() => handleDelete(lead.id)} style={{ padding: '4px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTracker;

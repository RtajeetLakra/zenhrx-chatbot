import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/admin';

const ConversationManager = ({ token }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await axios.get(
        `${API_BASE}/conversations`,
        authHeaders
      );

      setConversations(res.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);

      setError(
        err.response?.data?.error ||
        'Unable to load conversations.'
      );
    } finally {
      setLoading(false);
    }
  };

  const viewConversation = async (id) => {
    try {
      setLoadingDetails(true);
      setError('');

      const res = await axios.get(
        `${API_BASE}/conversations/${id}`,
        authHeaders
      );

      setSelectedConversation(res.data);
    } catch (err) {
      console.error('Failed to load conversation:', err);

      setError(
        err.response?.data?.error ||
        'Unable to load this conversation.'
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const deleteConversation = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this conversation?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE}/conversations/${id}`,
        authHeaders
      );

      setConversations((prev) =>
        prev.filter((conversation) => conversation.id !== id)
      );

      if (selectedConversation?.conversation?.id === id) {
        setSelectedConversation(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);

      alert(
        err.response?.data?.error ||
        'Unable to delete the conversation.'
      );
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  if (loading) {
    return (
      <div className="admin-section">
        <h2>Conversation History</h2>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Conversation History</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review conversations between visitors and the chatbot.
          </p>
        </div>

        <button
          onClick={fetchConversations}
          className="chat-send-btn"
          style={{ borderRadius: '8px', padding: '10px 16px' }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#991b1b'
          }}
        >
          {error}
        </div>
      )}

      {!selectedConversation && (
        <>
          {conversations.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                background: 'var(--bubble-bot)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h3>No conversations yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Conversations will appear here after visitors interact
                with the chatbot.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bubble-bot)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}
              >
                <thead>
                  <tr>
                    <th style={headerStyle}>ID</th>
                    <th style={headerStyle}>Status</th>
                    <th style={headerStyle}>Messages</th>
                    <th style={headerStyle}>Created</th>
                    <th style={headerStyle}>Updated</th>
                    <th style={headerStyle}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {conversations.map((conversation) => (
                    <tr key={conversation.id}>
                      <td style={cellStyle}>
                        #{conversation.id}
                      </td>

                      <td style={cellStyle}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '999px',
                            background:
                              conversation.status === 'ACTIVE'
                                ? '#dcfce7'
                                : '#e5e7eb',
                            color:
                              conversation.status === 'ACTIVE'
                                ? '#166534'
                                : '#374151',
                            fontSize: '0.85rem'
                          }}
                        >
                          {conversation.status}
                        </span>
                      </td>

                      <td style={cellStyle}>
                        {conversation.message_count}
                      </td>

                      <td style={cellStyle}>
                        {formatDate(conversation.created_at)}
                      </td>

                      <td style={cellStyle}>
                        {formatDate(conversation.updated_at)}
                      </td>

                      <td style={cellStyle}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px'
                          }}
                        >
                          <button
                            onClick={() =>
                              viewConversation(conversation.id)
                            }
                            style={actionButtonStyle}
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              deleteConversation(conversation.id)
                            }
                            style={{
                              ...actionButtonStyle,
                              background: '#ef4444'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedConversation && (
        <div>
          <button
            onClick={() => setSelectedConversation(null)}
            style={{
              marginBottom: '20px',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              background: '#e5e7eb',
              cursor: 'pointer'
            }}
          >
            ← Back to Conversations
          </button>

          {loadingDetails ? (
            <p>Loading conversation...</p>
          ) : (
            <>
              <div
                style={{
                  background: 'var(--bubble-bot)',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <h2>
                  Conversation #{selectedConversation.conversation.id}
                </h2>

                <p>
                  <strong>Status:</strong>{' '}
                  {selectedConversation.conversation.status}
                </p>

                <p>
                  <strong>Started:</strong>{' '}
                  {formatDate(
                    selectedConversation.conversation.created_at
                  )}
                </p>

                <p>
                  <strong>Last Updated:</strong>{' '}
                  {formatDate(
                    selectedConversation.conversation.updated_at
                  )}
                </p>
              </div>

              <div
                style={{
                  background: 'var(--bg-color)',
                  padding: '20px',
                  borderRadius: '12px'
                }}
              >
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent:
                        msg.sender === 'user'
                          ? 'flex-end'
                          : 'flex-start',
                      marginBottom: '12px'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background:
                          msg.sender === 'user'
                            ? 'var(--primary-color)'
                            : 'var(--bubble-bot)',
                        color:
                          msg.sender === 'user'
                            ? 'white'
                            : 'inherit',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          opacity: 0.7,
                          marginBottom: '4px'
                        }}
                      >
                        {msg.sender === 'user' ? 'Visitor' : 'Bot'}
                      </div>

                      <div>{msg.message}</div>

                      <div
                        style={{
                          fontSize: '0.7rem',
                          opacity: 0.6,
                          marginTop: '6px'
                        }}
                      >
                        {formatDate(msg.created_at)}

                        {msg.response_source && (
                          <> · {msg.response_source}</>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
};

const headerStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '0.85rem'
};

const cellStyle = {
  padding: '14px 16px',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '0.9rem'
};

const actionButtonStyle = {
  padding: '7px 12px',
  border: 'none',
  borderRadius: '6px',
  background: 'var(--primary-color)',
  color: 'white',
  cursor: 'pointer'
};

export default ConversationManager;
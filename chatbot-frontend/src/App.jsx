import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ChatLauncher from './components/Chatbot/ChatLauncher';
import ChatWindow from './components/Chatbot/ChatWindow';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

const Home = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div>
      {/* Sample SaaS Landing Page */}
      <header style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', background: 'white' }}>
        <h1 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.5rem' }}>HRMS AI</h1>
        <nav>
          {/* Admin link removed */}
        </nav>
      </header>

      <main style={{ padding: '80px 48px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '24px', color: '#111827' }}>
          Intelligent HR Management, <br />
          <span style={{ color: 'var(--primary-color)' }}>Powered by AI.</span>
        </h2>
        <p style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
          Automate your HR workflows, capture employee feedback, and streamline recruitment with our state-of-the-art conversational platform.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button style={{ padding: '12px 24px', fontSize: '1.1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            Start Free Trial
          </button>
          <button style={{ padding: '12px 24px', fontSize: '1.1rem', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            View Pricing
          </button>
        </div>
      </main>

      {/* Chatbot Integration */}
      <div className="chatbot-container">
        {isChatOpen && <ChatWindow onClose={() => setIsChatOpen(false)} />}
        <ChatLauncher isOpen={isChatOpen} toggleChat={() => setIsChatOpen(!isChatOpen)} />
      </div>
    </div>
  );
};

export default App;

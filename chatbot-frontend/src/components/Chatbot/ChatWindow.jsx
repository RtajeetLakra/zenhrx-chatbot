import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Minus } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { text: "Hi there! 👋 How can I help you today? You can ask me questions or just say 'I want a demo'.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat/message', {
        message: userMsg,
        sessionToken: sessionToken
      });

      if (response.data.sessionToken) {
        setSessionToken(response.data.sessionToken);
      }

      setMessages(prev => [...prev, { 
        text: response.data.reply, 
        sender: 'bot',
        confidence: response.data.confidence
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting to the server. Please try again later.", 
        sender: 'bot' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>Chat Support</div>
        <button onClick={onClose}><Minus size={20} /></button>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit" className="chat-send-btn" disabled={!input.trim() || isTyping}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;

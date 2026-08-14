import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Minus } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      text: "Hi there! 👋 How can I help you today? You can ask me questions or just say 'I want a demo'.",
      sender: 'bot'
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Create or reuse a session token for this browser session
  const [sessionToken, setSessionToken] = useState(() => {
    const existingToken = sessionStorage.getItem('chat_session_id');

    if (existingToken) {
      return existingToken;
    }

    const newToken = crypto.randomUUID();
    sessionStorage.setItem('chat_session_id', newToken);

    return newToken;
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!input.trim() || isTyping) {
      return;
    }

    const userMsg = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        text: userMsg,
        sender: 'user'
      }
    ]);

    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/chat/message',
        {
          message: userMsg,
          sessionToken: sessionToken
        }
      );

      // Save the session token returned by the backend
      if (response.data.sessionToken) {
        setSessionToken(response.data.sessionToken);
        sessionStorage.setItem(
          'chat_session_id',
          response.data.sessionToken
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          text: response.data.reply,
          sender: 'bot',
          confidence: response.data.confidence
        }
      ]);
    } catch (error) {
      console.error('CHAT ERROR:', error);
      console.error('STATUS:', error.response?.status);
      console.error('RESPONSE:', error.response?.data);
      console.error('REQUEST:', error.config?.url);

      setMessages((prev) => [
        ...prev,
        {
          text:
            error.response?.data?.message ||
            'Sorry, I encountered an error. Please try again.',
          sender: 'bot'
        }
      ]);
    } finally {
      setIsTyping(false);

      // Keep the cursor in the input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>Chat Support</div>

        <button onClick={onClose}>
          <Minus size={20} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <form
        className="chat-input-area"
        onSubmit={handleSend}
      >
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isTyping}
        />

        <button
          type="submit"
          className="chat-send-btn"
          disabled={!input.trim() || isTyping}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
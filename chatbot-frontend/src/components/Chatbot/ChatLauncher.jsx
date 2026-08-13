import React from 'react';
import { MessageSquare, X } from 'lucide-react';

const ChatLauncher = ({ isOpen, toggleChat }) => {
  return (
    <button className="chat-launcher" onClick={toggleChat}>
      {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
    </button>
  );
};

export default ChatLauncher;

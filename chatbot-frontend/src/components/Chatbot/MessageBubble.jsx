import React from 'react';

const MessageBubble = ({ message }) => {
  const isBot = message.sender === 'bot' || message.sender === 'SYSTEM' || message.sender === 'LOCAL_DB';
  const bubbleClass = isBot ? 'message-bot' : 'message-user';

  return (
    <div className={`message-bubble ${bubbleClass}`}>
      {message.text}
    </div>
  );
};

export default MessageBubble;

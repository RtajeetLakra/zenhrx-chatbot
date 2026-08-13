const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const knowledgeRoutes = require('./routes/knowledge');
const leadRoutes = require('./routes/leads');

const app = express();

// Middlewares
app.use(helmet());
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['*'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/leads', leadRoutes);

// Base route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Chatbot API is running' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;

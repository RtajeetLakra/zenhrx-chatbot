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
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    }
  })
);
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

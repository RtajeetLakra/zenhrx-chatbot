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

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(helmet());

// Allow the local React frontends to communicate with the API.
// This handles normal requests as well as browser OPTIONS
// preflight requests.
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);



app.use(express.json());
app.use(morgan('dev'));

// ============================================================
// ROUTES
// ============================================================

app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/leads', leadRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Chatbot API is running'
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(errorHandler);

module.exports = app;
# Intelligent HRMS/SaaS Chatbot

A production-ready full-stack application featuring an intelligent, state-driven chatbot that captures leads and answers questions from a local PostgreSQL knowledge base.

## Folder Structure

```text
project-root/
│
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # Database config
│   │   ├── controllers/      # Route controllers (abstracted in routes for now)
│   │   ├── middlewares/      # Error handler, Admin Auth
│   │   ├── routes/           # API Endpoints (Admin, Chat, Knowledge, Leads)
│   │   └── services/         # Core logic (Chat State Machine, Knowledge FTS)
│   ├── .env.example          # Environment variables template
│   └── package.json
│
├── chatbot-frontend/         # Chatbot React Application
│   ├── src/
│   │   ├── components/
│   │   │   └── Chatbot/      # Chat Window, Bubbles, Typing Indicators
│   │   ├── styles/           # Vanilla CSS (index.css)
│   │   ├── App.jsx           # Main routing and Landing Page
│   │   └── main.jsx
│   └── package.json
│
├── admin-frontend/           # Admin Dashboard React Application
│   ├── src/
│   │   ├── components/
│   │   │   └── Admin/        # Dashboard, Lead Tracking, Knowledge Management
│   │   ├── styles/           # Vanilla CSS (index.css)
│   │   ├── App.jsx           # Admin Routing
│   │   └── main.jsx
│   └── package.json
│
├── database/
│   └── init.sql              # Database schema and seed data
│
└── docs/                     # Additional project documentation
```

## Setup Instructions

### 1. Database Setup (PostgreSQL)

1. Ensure PostgreSQL is installed and running on your machine.
2. Create a new database named `hrms_chatbot`.
3. Run the SQL script located at `database/init.sql` to generate the schema and seed data.
   ```bash
   psql -U postgres -d hrms_chatbot -f database/init.sql
   ```
*Note: The default admin credentials created by the seed script are username: `admin` and password: `admin123`.*

### 2. Backend Setup

1. Navigate to the `backend` directory.
   ```bash
   cd backend
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. Copy the `.env.example` to `.env` and update your PostgreSQL credentials if necessary.
   ```bash
   cp .env.example .env
   ```
4. Start the server (development mode).
   ```bash
   npm start
   # or with nodemon if installed globally
   nodemon src/index.js
   ```
   The backend API will run on `http://localhost:5000`.

### 3. Chatbot Frontend Setup

1. Navigate to the `chatbot-frontend` directory.
   ```bash
   cd chatbot-frontend
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. Start the Vite development server.
   ```bash
   npm run dev
   ```
   The chatbot frontend will run on `http://localhost:5173`.

### 4. Admin Frontend Setup

1. Navigate to the `admin-frontend` directory.
   ```bash
   cd admin-frontend
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. Start the Vite development server.
   ```bash
   npm run dev
   ```
   The admin frontend will run on `http://localhost:5174`.

---

## Adding Chatbot Knowledge

You can manage the chatbot's knowledge base via the Admin Dashboard.
1. Navigate to `http://localhost:5174/admin` (or `http://localhost:5174`).
2. Log in using `admin` / `admin123`.
3. In the "Knowledge Base" tab, you can add new questions and their corresponding answers.
4. The chatbot uses PostgreSQL's Full-Text Search (FTS) to intelligently match variations of the canonical questions you enter.

## Adding New Conversation Flows (Lead Capture)

The Chatbot uses a State Machine pattern inside `backend/src/services/chatService.js`.
To add new conversational flows (like asking for an address or scheduling a meeting):
1. Add a new state to `ChatService.STATES`.
2. Add a new `case` block in the `handleLeadCaptureState` method.
3. Update the temporary `context` JSON object in the database with the new information.

## Future AI Integration (OpenAI, Gemini)

The application architecture is modular. To switch from local Knowledge Base search to a generative AI model:
1. Open `backend/src/services/chatService.js`.
2. Locate the fallback mechanism inside `processMessage`:
   ```javascript
   // Currently:
   const kbResult = await KnowledgeService.search(userMessage);
   if (kbResult) { ... }
   ```
3. Instead of (or in addition to) the local search, you can inject an AI Service call here:
   ```javascript
   const aiResponse = await OpenAIService.generateResponse(userMessage, context);
   ```
4. The frontend UI requires zero changes, as it simply expects `{ reply, confidence, source }`.

## API Documentation

### POST `/api/chat/message`
- **Body**: `{ sessionToken: string (optional), message: string }`
- **Response**: `{ sessionToken, reply, confidence, source }`

### GET `/api/admin/analytics`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Dashboard statistics and low-confidence logs.

### GET/PUT `/api/leads`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of leads, ability to update lead status.

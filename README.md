# Intelligent HRMS/SaaS Chatbot

A full-stack HRMS/SaaS website chatbot built with React, Node.js/Express, and PostgreSQL.

The chatbot answers visitor questions from a locally managed PostgreSQL knowledge base, guides users through lead/demo flows, stores conversation history, and provides an admin panel for managing knowledge, leads, unanswered queries, and conversations.

## Project Structure

```text
zenhrx-chatbot/
│
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # PostgreSQL configuration
│   │   ├── middlewares/      # Authentication and error handling
│   │   ├── routes/           # Chat, admin, knowledge and lead APIs
│   │   └── services/         # Chat and knowledge-base logic
│   ├── .env.example          # Environment variable template
│   └── package.json
│
├── chatbot-frontend/         # Public React chatbot
│   ├── src/
│   │   └── components/
│   │       └── Chatbot/       # Chat window, messages, launcher, typing state
│   └── package.json
│
├── admin-frontend/            # React admin dashboard
│   ├── src/
│   │   └── components/
│   │       └── Admin/
│   │           ├── Dashboard.jsx
│   │           ├── KnowledgeManager.jsx
│   │           ├── LeadTracker.jsx
│   │           └── ConversationManager.jsx
│   └── package.json
│
├── database/
│   └── init.sql              # PostgreSQL schema and seed data
│
├── .gitignore
└── README.md
```

## Main Features

### Chatbot

- Modern React chatbot interface
- User and bot messages
- Typing/loading state
- Conversation state and context
- Persistent session ID during a browser session
- Automatic input focus after sending a message
- Demo/lead capture flow
- Cancel/stop handling
- Safe fallback when verified knowledge is unavailable

### Knowledge Base

Chatbot knowledge is stored in PostgreSQL instead of being hardcoded in the frontend.

The admin can:

- Add questions and answers
- Edit existing knowledge
- Delete knowledge entries
- Organize questions by category
- Review unanswered queries and add better answers

The chatbot uses the stored knowledge and matching logic to handle variations of user questions rather than requiring exact wording.

### Lead Management

The chatbot can capture demo requests and store lead details in PostgreSQL.

The admin panel can:

- View leads
- Review lead information
- Update lead status
- Delete leads

### Conversation History

Every chatbot conversation is stored in PostgreSQL.

The system stores:

- Conversation/session information
- Every user message
- Every bot response
- Confidence score when available
- Intent when available
- Response source
- Knowledge entry used when available
- Timestamps

The admin panel provides a **Conversation History** section where administrators can:

- View all conversations
- Open a conversation and review the complete message history
- See conversation status and timestamps
- Review response sources and confidence information when available
- Delete conversations

Deleting a conversation removes its messages but does not automatically delete an associated lead.

### Unanswered Queries

When the chatbot falls back because it cannot confidently answer a question, the interaction can be surfaced in the admin panel as an unanswered query.

This allows the company to review knowledge gaps and improve the knowledge base over time.

## Technology Stack

### Frontend
- React
- Vite
- Axios
- Lucide React

### Backend
- Node.js
- Express
- PostgreSQL (`pg`)
- JWT authentication
- bcrypt
- Helmet
- CORS
- Morgan

### Database
- PostgreSQL

## Setup

### 1. PostgreSQL

Install PostgreSQL and make sure the PostgreSQL service is running.

Create a database named:

```text
hrms_chatbot
```

Run:

```bash
psql -U postgres -d hrms_chatbot -f database/init.sql
```

The exact PostgreSQL port is configurable through the backend environment variables. The development setup used during testing ran PostgreSQL on port `5433`.

If your PostgreSQL installation uses another port, change `DB_PORT` in the backend `.env` file.

> The seed data includes an admin account. Change the password before using the application outside local development.

### 2. Backend

Go to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```text
Copy .env.example to .env
```

Then update the values for your local PostgreSQL installation.

Example:

```env
PORT=5000
NODE_ENV=development

FRONTEND_URL=http://localhost:5173,http://localhost:5174

DB_HOST=localhost
DB_PORT=5433
DB_NAME=hrms_chatbot
DB_USER=postgres
DB_PASSWORD=your_postgresql_password

JWT_SECRET=replace_with_a_secure_secret
```

Start the backend:

```bash
npm start
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 3. Chatbot Frontend

Open a new terminal:

```bash
cd chatbot-frontend
npm install
npm run dev
```

Chatbot:

```text
http://localhost:5173
```

### 4. Admin Frontend

Open another terminal:

```bash
cd admin-frontend
npm install
npm run dev
```

Admin panel:

```text
http://localhost:5174
```

You must have the backend running before using either frontend.

## Admin Panel

Log in using the administrator account configured in the database.

The dashboard contains:

```text
Knowledge Base
Lead Management
Conversation History
Logout
```

### Knowledge Base

Manage the questions, answers and categories used by the chatbot.

### Lead Management

Review captured demo/contact leads.

### Conversation History

Review stored conversations and their complete message history.

## Conversation Flow

A typical chatbot request follows this flow:

```text
Visitor
   ↓
React Chatbot
   ↓
POST /api/chat/message
   ↓
Node.js / Express
   ↓
Conversation/session lookup
   ↓
Knowledge / intent / flow processing
   ↓
Bot response
   ↓
PostgreSQL
   ├── conversation record
   └── user + bot messages
```

The same session ID is reused during the active browser session so multiple messages belong to the same conversation.

## Important Database Tables

### `conversations`

Stores the overall chat session.

Key fields include:

- `id`
- `session_id`
- `lead_id`
- `status`
- `created_at`
- `updated_at`
- `state`
- `context`

### `messages`

Stores individual user and bot messages.

Key fields include:

- `id`
- `conversation_id`
- `sender`
- `message`
- `confidence_score`
- `response_source`
- `created_at`
- `intent`
- `knowledge_entry_id`

## Main API Endpoints

### Chat

```text
POST /api/chat/message
```

Accepts a user message and optional session token/ID, processes the request, and returns the chatbot response.

### Unanswered Queries

```text
GET /api/chat/unanswered
```

Returns fallback/unanswered interactions for admin review.

### Admin Login

```text
POST /api/admin/login
```

Returns an admin JWT token.

### Analytics

```text
GET /api/admin/analytics
```

Returns dashboard statistics and low-confidence information.

### Conversations

```text
GET /api/admin/conversations
GET /api/admin/conversations/:id
DELETE /api/admin/conversations/:id
```

These endpoints are used by the admin Conversation History section.

### Knowledge Base

The knowledge API supports creating, updating, listing and deleting knowledge entries and categories.

### Leads

The lead API supports viewing and managing captured leads.

All protected admin endpoints use:

```text
Authorization: Bearer <token>
```

## Adding Knowledge

1. Start the backend and both frontends.
2. Open `http://localhost:5174`.
3. Log in to the admin panel.
4. Open **Knowledge Base**.
5. Select a category.
6. Enter the question and verified answer.
7. Save the entry.
8. Test the new question through the chatbot.

Knowledge should contain verified company information. If the chatbot does not have a reliable answer, it should fall back instead of inventing company-specific facts.

## Testing Conversation History

1. Open the chatbot.
2. Send several messages.
3. Confirm the chatbot responds normally.
4. Open the admin panel.
5. Open **Conversation History**.
6. Find the new conversation.
7. Click **View** to see the full message history.
8. Test **Delete** on a conversation if needed.
9. Refresh the admin panel and confirm the deleted conversation remains deleted.
10. Restart the backend and verify previously stored conversations still exist.

## Future Extensions

The project is structured so additional integrations can be added later, including:

- OpenAI, Gemini or other AI providers
- CRM systems
- WhatsApp
- Ticketing systems
- HRMS modules
- More advanced semantic search

The current chatbot remains PostgreSQL-driven so company knowledge can be controlled through the admin panel.

## Security Notes

- Do not commit `.env` files.
- Use `.env.example` as the configuration template.
- Change default admin credentials before production use.
- Use a strong `JWT_SECRET`.
- Use a production PostgreSQL password.
- Restrict CORS to trusted production domains when deploying.

## Local Development Ports

```text
PostgreSQL  → 5433 (development setup used during testing)
Backend     → 5000
Chatbot     → 5173
Admin       → 5174
```

The ports can be changed through the project configuration and environment variables where supported.

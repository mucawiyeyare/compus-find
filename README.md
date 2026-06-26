# 🎓 Smart Campus Connect

> A full-stack university ecosystem platform connecting students, mentors, and administrators — powered by AI, real-time communication, and gamification.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
  - [Docker (Database only)](#docker-database-only)
- [API Reference](#-api-reference)
- [Data Models](#-data-models)
- [Gamification System](#-gamification-system)
- [AI Features](#-ai-features)
- [Real-Time Features](#-real-time-features)
- [Admin Panel](#-admin-panel)
- [Security](#-security)
- [Scripts](#-scripts)

---

## 🌐 Overview

**Smart Campus Connect** is a comprehensive MERN-stack (MongoDB, Express, React, Node.js) platform designed to digitise and enhance the university campus experience. It provides a unified ecosystem for students to report lost & found items with AI-powered matching, share academic resources, find mentors, collaborate in study groups, and stay updated on campus events — all with a gamified points and badges system.

---

## ✨ Features

| Module | Description |
|---|---|
| 🔐 **Authentication** | JWT-based register/login, Google OAuth, profile management |
| 🔍 **Lost & Found** | Report lost/found items, AI-powered matching, secure claim verification codes |
| 📚 **Books Exchange** | Share and discover academic books with borrow/return flow |
| 📝 **Notes Sharing** | Upload and browse study notes by subject/department |
| 👨‍🏫 **Mentorship** | Find mentors, request sessions, auto-generated Google Meet links |
| 👥 **Study Groups** | Create/join groups, share resources, assign tasks |
| 📅 **Campus Events** | Post and browse workshops, seminars, conferences, deadlines |
| 🤖 **AI Assistant** | Concept explainer, quiz generator, study plan creator, resume analyser |
| 🏆 **Leaderboard** | Real-time ranking of top contributors by points |
| 📊 **Analytics Dashboard** | Platform-wide stats and engagement metrics |
| 🛡️ **Admin Panel** | User management, audit logs, system settings, content moderation |
| 💬 **Real-Time Chat** | Socket.io powered study group messaging |
| 📁 **File Upload** | Multer + Cloudinary integration for images and documents |

---

## 🛠 Tech Stack

### Frontend (Client)

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **TailwindCSS** | Styling |
| **Framer Motion** | Animations |
| **Recharts** | Charts & analytics |
| **Zustand** | Global state management |
| **Axios** | HTTP client |
| **Socket.io-client** | Real-time communication |
| **Lucide React** | Icon library |
| **React Router v6** | Client-side routing |

### Backend (Server)

| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **TypeScript** | Type safety |
| **MongoDB + Mongoose** | Database & ODM |
| **Socket.io** | WebSocket real-time events |
| **JWT + bcryptjs** | Authentication & password hashing |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API rate limiting |
| **Multer** | File uploads |
| **Cloudinary** | Cloud media storage |
| **Redis** | Caching layer |
| **Nodemailer** | Email notifications |
| **Zod** | Request validation |
| **Google Generative AI** | Gemini AI integration |
| **Swagger** | API documentation |

---

## 📁 Project Structure

```
compus_find/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx                # Main app with all pages & routing
│   │   ├── components/
│   │   │   └── Upload/            # File upload components
│   │   ├── store/                 # Zustand state management
│   │   ├── index.css              # Global styles
│   │   └── main.tsx               # React entry point
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                        # Express + Node.js backend
│   ├── src/
│   │   ├── server.ts              # Entry point (HTTP + Socket.io + MongoDB)
│   │   ├── app.ts                 # Express app, middleware, route mounting
│   │   ├── config/                # DB & service configuration
│   │   ├── controllers/
│   │   │   ├── admin.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   └── upload.controller.ts
│   │   ├── middlewares/
│   │   │   └── auth.ts            # JWT protect middleware
│   │   ├── models/                # Mongoose schemas (15 models)
│   │   │   ├── User.ts
│   │   │   ├── LostItem.ts
│   │   │   ├── FoundItem.ts
│   │   │   ├── Book.ts
│   │   │   ├── Note.ts
│   │   │   ├── Mentor.ts
│   │   │   ├── Session.ts
│   │   │   ├── StudyGroup.ts
│   │   │   ├── Event.ts
│   │   │   ├── Message.ts
│   │   │   ├── Notification.ts
│   │   │   ├── AuditLog.ts
│   │   │   ├── ContactMessage.ts
│   │   │   ├── Media.ts
│   │   │   └── SystemSetting.ts
│   │   ├── repositories/          # Data access layer
│   │   ├── routes/                # 10 route files
│   │   │   ├── auth.routes.ts
│   │   │   ├── lostfound.routes.ts
│   │   │   ├── mentorship.routes.ts
│   │   │   ├── books.routes.ts
│   │   │   ├── notes.routes.ts
│   │   │   ├── studygroup.routes.ts
│   │   │   ├── campus.routes.ts
│   │   │   ├── upload.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── services/
│   │   │   └── ai.service.ts      # Gemini AI integrations
│   │   ├── sockets/
│   │   │   └── socket.handler.ts  # Socket.io event handlers
│   │   └── validations/           # Zod request schemas
│   ├── uploads/                   # Local file upload storage
│   ├── .env                       # Environment variables
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml             # MongoDB + Redis containers
├── package.json                   # Monorepo root scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB** (local install or Docker)
- **Redis** (optional — or use Docker)

---

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd compus_find

# 2. Install root dependencies
npm install

# 3. Install server dependencies
cd server && npm install

# 4. Install client dependencies
cd ../client && npm install
```

---

### Environment Variables

Create/edit the `.env` file inside the `server/` directory:

```env
# Server
PORT=5001

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/campus_connect

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini AI  (required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary (for image/file uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Redis
REDIS_URL=redis://127.0.0.1:6379
```

---

### Running the App

**Development (both frontend + backend together):**

```bash
# From the project root
npm run dev
```

| Service | URL |
|---|---|
| Backend API | http://localhost:5001 |
| Frontend | http://localhost:5173 |

**Run individually:**

```bash
npm run dev:server   # Backend only
npm run dev:client   # Frontend only
```

**Production build:**

```bash
npm run build
npm start
```

---

### Docker (Database only)

Start MongoDB and Redis with a single command:

```bash
docker-compose up -d
```

| Container | Port |
|---|---|
| MongoDB | 27017 |
| Redis | 6379 |

Data is persisted in the `mongo_data` Docker volume.

```bash
docker-compose down   # Stop containers
```

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Rate limited to **200 requests / 15 min** per IP.

### Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register a new user | ❌ |
| POST | `/login` | Login, receive JWT token | ❌ |
| GET | `/me` | Get current user profile | ✅ |
| PUT | `/profile` | Update avatar | ✅ |
| POST | `/award-points` | Award gamification points | ✅ |

### Lost & Found — `/api/lostfound`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/lost` | Report lost item (triggers AI matching) | ✅ |
| GET | `/lost` | Browse lost items (filter by category/search) | ❌ |
| POST | `/found` | Report found item (generates claim code) | ✅ |
| GET | `/found` | Browse found items | ❌ |
| POST | `/verify-claim` | Verify claim code and hand off item | ✅ |
| POST | `/contact-admin` | Send a message to admin | ✅ |

### Mentorship — `/api/mentorship`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/profile` | Create or update mentor profile | ✅ |
| GET | `/mentors` | List mentors (filter: dept/subject) | ❌ |
| POST | `/request-session` | Request a mentoring session | ✅ |
| GET | `/sessions` | Get own sessions (as student + mentor) | ✅ |
| PUT | `/session/:id` | Update session status (accept/complete/cancel) | ✅ |

### Campus & AI — `/api/campus`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/ai/explain` | AI concept explanation | ✅ |
| POST | `/ai/quiz` | AI quiz generation | ✅ |
| POST | `/ai/study-plan` | AI study plan | ✅ |
| POST | `/ai/analyze-resume` | AI resume review | ✅ |
| POST | `/events` | Create a campus event | ✅ |
| GET | `/events` | List all events | ❌ |
| GET | `/leaderboard` | Top 10 users by points | ❌ |
| GET | `/stats` | Platform-wide analytics & metrics | ❌ |

### Books — `/api/books`
| Study Groups — `/api/studygroup`
| Notes — `/api/notes`
| Upload — `/api/upload`
| Admin — `/api/admin`
| Dashboard — `/api/dashboard`

> Full Swagger API docs available at `http://localhost:5001/api-docs` when the server is running.

---

## 🗄 Data Models

### User
| Field | Type | Notes |
|---|---|---|
| name | String | Required |
| email | String | Unique, lowercase |
| password | String (hashed) | bcryptjs |
| role | Enum | `student` / `mentor` / `admin` |
| points | Number | Default 0 |
| badges | String[] | Auto-awarded |
| department | String | Optional |
| isVerified | Boolean | Default true (demo) |

### LostItem / FoundItem
| Field | Type | Notes |
|---|---|---|
| reporter | ObjectId → User | Required |
| title / description | String | Required |
| category / location | String | Required |
| status | Enum | pending / lost / found / resolved / cancelled |
| aiMatches | Array | `{foundItem, score}` pairs |
| claimVerificationCode | String | Auto-generated 6-char code |

### Mentor
| Field | Type | Notes |
|---|---|---|
| user | ObjectId → User | One-to-one |
| subjects / skills | String[] | Required |
| availability | Array | `{day, slots[]}` |
| rating | Number | Default 5.0 |

### StudyGroup
| Field | Type | Notes |
|---|---|---|
| creator | ObjectId → User | Required |
| members | ObjectId[] → User | Populated |
| resources | Array | `{title, url, addedBy}` |
| tasks | Array | `{title, status, assignedTo}` |

---

## 🏆 Gamification System

| Badge | Threshold | Description |
|---|---|---|
| 🥉 Beginner Helper | 100 pts | Early contributor |
| 🥈 Active Contributor | 300 pts | Consistent engagement |
| 🥇 Campus Hero | 600 pts | Top community member |
| 🏅 Elite Mentor | 300 pts | Rewarded after completing sessions |

### Points Earned

| Action | Points |
|---|---|
| Claiming a found item (verified) | +50 |
| Completing a mentoring session | +30 |
| Custom admin award | configurable |

---

## 🤖 AI Features

Powered by **Google Gemini** (`@google/generative-ai`):

| Feature | How to Trigger |
|---|---|
| **Concept Explainer** | POST `/api/campus/ai/explain` with `{ concept }` |
| **Quiz Generator** | POST `/api/campus/ai/quiz` with `{ subject }` |
| **Study Plan Creator** | POST `/api/campus/ai/study-plan` with `{ goal, hours }` |
| **Resume Analyser** | POST `/api/campus/ai/analyze-resume` with `{ resumeText }` |
| **Lost & Found Matcher** | Automatically runs when a lost item is reported — scores descriptions of existing found items; surfaces matches ≥ 40% similarity |

> Set `GEMINI_API_KEY` in `server/.env` to activate all AI features.

---

## ⚡ Real-Time Features

Powered by **Socket.io** running on the same HTTP server:

- **Study Group Chat** — live in-group messaging
- **Notifications** — push events to connected clients for session updates and item match alerts
- Supports all origins in development mode (`origin: '*'`)

---

## 🛡️ Admin Panel

Requires `admin` role JWT token. Accessible at `/api/admin`:

| Capability | Details |
|---|---|
| User Management | List, promote to mentor/admin, suspend, delete users |
| Content Moderation | Review and remove reported items or resources |
| Audit Logs | Every admin action recorded with timestamp and target |
| System Settings | Configure key-value platform settings |
| Contact Messages | Inbox for messages sent to admin via Lost & Found |

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| HTTP Headers | **Helmet** (CSP disabled for dev flexibility) |
| Rate Limiting | **express-rate-limit** — 200 req / 15 min / IP |
| Auth | **JWT** — 7-day tokens, verified via `protect` middleware |
| Passwords | **bcryptjs** — salt rounds: 10 |
| CORS | Open in dev; restrict `origin` in production |
| Validation | **Zod** schemas on request bodies |
| Static Files | `/uploads` served statically; restrict access in production |

---

## 📜 Scripts

### Root `/`

| Command | Description |
|---|---|
| `npm run dev` | Run frontend + backend concurrently |
| `npm run dev:server` | Backend only |
| `npm run dev:client` | Frontend only |
| `npm run build` | Compile server TS + build Vite client |
| `npm start` | Start compiled production server |

### Server `/server`

| Command | Description |
|---|---|
| `npm run dev` | ts-node-dev with hot reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run `dist/server.js` |
| `npm test` | Run Jest test suite |

### Client `/client`

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production bundle |
| `npm run lint` | ESLint check |

---

## 📄 License

This project is built for educational and university use.

---

> Built with ❤️ for the campus community.

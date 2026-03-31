# SmartClass — AI-Powered Learning Management System

A full-stack LMS platform with real-time features, multi-role dashboards, and an integrated Claude AI agent for students and teachers.

**Stack:** React 19 · Express 5 · MongoDB · Socket.IO · FastAPI · TailwindCSS · Recharts

---

## Project Structure

```
SmartClass/
├── client/          # React 19 + Vite frontend
├── server/          # Express 5 + MongoDB backend
└── agents/          # FastAPI + Claude AI agent service
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.10+
- MongoDB (local or Atlas)
- Anthropic API key

### 1. Backend (Express + MongoDB)

```bash
cd server
npm install
```

Create `server/.env`:
```env
MONGO_URI=mongodb://localhost:27017/smartclass
JWT_SECRET=your_jwt_secret
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

```bash
npm run dev        # Development (nodemon)
npm start          # Production
```

Server runs at **http://localhost:5000**

---

### 2. Frontend (React + Vite)

```bash
cd client
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

### 3. AI Agent (FastAPI + Claude)

```bash
cd agents
python -m venv env
source env/bin/activate   # Linux/macOS
env\Scripts\activate      # Windows
pip install -r requirements.txt
```

Create `agents/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

```bash
python app.py
# or
uvicorn app:app --reload --port 8000
```

Agent API at **http://localhost:8000** · Interactive docs at **http://localhost:8000/docs**

---

## Authentication

- Email + password registration with **6-digit OTP verification** (5-min expiry, resend support)
- **Google OAuth** sign-in
- Role-based registration — **Student** or **Teacher**
- JWT session management (7-day expiry, HttpOnly secure cookies)
- BCrypt password hashing (10 salt rounds)

---

## Student Features

### Dashboard
- Stats cards: enrolled courses · pending assignments · completed quizzes · upcoming live classes
- **Performance Trend** — line chart of quiz score history
- **Course Progress** — bar chart of completion % per course
- **Time Spent by Course** — pie chart of study hours distribution
- Real-time dashboard refresh via WebSocket

### Course Discovery & Enrollment
- Browse all available courses with student count, material count, quiz count
- One-click enroll / unenroll (with confirmation dialog)
- My Learning tab and Explore More tab split view

### Learning Materials
- Access materials per course: **Document, Video, Link, Image, Other**
- Video embed, document link open, image display per type
- **Mark material complete/incomplete** — tracked per student
- Ordered sequence display with metadata (uploader, date, type)

### Assignments
- View all assignments with due date, max score, description
- **Submit text or file-based responses**
- Track submission status: submitted · late · graded
- View teacher **score + written feedback** per submission

### Quizzes
- **Timed quiz-taking interface** — one question at a time with progress bar
- Multiple-choice (4 options per question)
- Submit all answers, view instant score + pass/fail
- **Detailed review** — see correct answers highlighted per question
- Full history of all past attempts with scores

### Live Classes
- View scheduled / live / ended classes with status badges
- **Join live class** via integrated meeting link or in-platform room
- **Attendance auto-recorded** on join
- **Live comments** — send real-time messages during class
- **Q&A system** — submit questions; see when teacher marks them answered

### AI Learning Assistant (Claude-powered)
- **AI Chat** — multi-turn educational chat with optional course context
- **Concept Explanation** — explain any topic at Beginner / Intermediate / Advanced level
- **Assignment Feedback** — AI reviews submission and suggests score with justification
- **Study Plan Generator** — input weak areas + weekly hours → personalized schedule
- **Performance Analysis** — AI analyzes quiz and assignment history, gives actionable steps
- **Content Summarization** — summarize materials in 4 styles

---

## Teacher Features

### Dashboard
- Stats cards: total courses · enrolled students · materials · quizzes · pending submissions · upcoming live classes
- **Enrollment Analytics** — bar chart of students per course
- **Submission Status** — pie chart of submitted / pending / graded breakdown
- **Content Distribution** — breakdown by material, assignment, quiz count

### Course Management
- Create / edit / delete courses (title, description, subject)
- View all enrolled students per course
- Tabbed course view: **Materials · Assignments · Quizzes · Live Classes · Students**
- Each tab has its own URL (`/course/:id/materials`, `/course/:id/quizzes`, etc.)

### Assignment Management
- Create assignments with title, description, **due date**, and **max score**
- **View all student submissions** — filter by submitted / late / graded
- **Grade submissions** — assign score + write detailed feedback
- Late submission auto-detection

### Quiz Management
- Create quizzes: title, description, time limit, difficulty level
- Add questions with 4 options each; mark correct answer; set point value
- **AI Quiz Generation** — enter topic or paste content → Claude generates MCQ questions

### Live Class Management
- Schedule classes with title, description, date/time, meeting link
- Update status: **Scheduled → Live → Ended**
- Add recording URL after session
- Monitor live **comments and Q&A** in real-time; mark questions answered

### AI Content Tools (Claude-powered)
- **Course Outline Generator** — specify subject, duration, level, objectives → week-by-week breakdown
- **Agentic workflow** — chain multiple tools in one request

---

## Real-Time System (Socket.IO)

| Event | Who receives |
|---|---|
| New course created | Enrolled students |
| Live class scheduled / goes live / ends | Enrolled students |
| Student enrolls | Teacher |
| Assignment submitted | Teacher |
| Assignment graded | Student |
| Live comments & Q&A | All in the live class room |

---

## Notifications

- In-app notification panel with **unread badge count**
- Time-relative timestamps ("5m ago", "2h ago")
- Mark individual or **all as read**
- Persisted in database; loaded on login

---

## Themes

**Light · Dark · Cosmic** — switchable via navbar, persisted to `localStorage`

---

## Data Models

`User` · `Course` · `Material` · `Assignment` · `Submission` · `Quiz` · `QuizResult` · `LiveClass` · `Enrollment` · `CompletedMaterial` · `Notification` · `ClassComment` · `ClassQuestion`

---

## Testing

### Backend (Vitest + Supertest)

```bash
cd server
npm test               # Run all tests once
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

Test files in `server/tests/`:

| File | Coverage |
|---|---|
| `auth.test.js` | Register, OTP verify, login, logout, resend OTP |
| `courses.test.js` | Create, list, get, update, enroll, delete |
| `assignments.test.js` | CRUD, submit, grade, submissions view |
| `quizzes.test.js` | CRUD, submit with auto-grading |
| `enrollments.test.js` | Enroll, unenroll, progress, duplicate prevention |
| `liveClass.test.js` | CRUD, join, status transitions, comments, Q&A |

Uses an in-memory MongoDB instance — no external database needed.

### AI Agent (pytest)

```bash
cd agents
source env/bin/activate
python -m pytest tests/ -v
```

Test files in `agents/tests/`:

| File | Coverage |
|---|---|
| `test_info.py` | `GET /`, `GET /health` |
| `test_student.py` | `/chat`, `/summarize`, `/explain`, `/feedback`, `/study-plan`, `/analyze-performance` |
| `test_teacher.py` | `/generate-quiz`, `/course-outline` |
| `test_agent.py` | Agentic loop: direct answer, single-tool, multi-tool chain, error handling, max iterations |

All LLM calls are mocked — no Anthropic API key needed to run tests.

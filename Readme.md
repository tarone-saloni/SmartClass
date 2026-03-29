# SmartClass — AI-Powered Learning Management System

A full-stack LMS platform with real-time features, multi-role dashboards, and an integrated Claude AI agent for students and teachers.

**Stack:** React 19 · Express 5 · MongoDB · Socket.IO · FastAPI · Claude Sonnet 4.6 · TailwindCSS · Recharts

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
- Expandable submission detail view

### Quizzes
- View all quizzes with question count, time limit, difficulty
- **Timed quiz-taking interface** — one question at a time with progress bar
- Multiple-choice (4 options per question)
- Submit all answers, view instant score + pass/fail
- **Detailed review** — see correct answers highlighted per question
- Full history of all past attempts with scores

### Live Classes
- View scheduled / live / ended classes with status badges
- **Join live class** via integrated meeting link (Zoom, Google Meet, etc.)
- **Attendance auto-recorded** on join
- **Live comments** — send real-time messages during class
- **Q&A system** — submit questions; see when teacher marks them answered
- Access **session recordings** after class ends

### AI Learning Assistant (Claude-powered)
- **AI Chat** — multi-turn educational chat with optional course context
- **Concept Explanation** — explain any topic at Beginner / Intermediate / Advanced level
- **Assignment Feedback** — AI reviews submission text and suggests score with justification
- **Study Plan Generator** — input weak areas + weekly hours → personalized schedule
- **Performance Analysis** — AI analyzes quiz and assignment history, gives actionable steps
- **Content Summarization** — summarize materials in Concise / Detailed / Bullet-points / Key-concepts style

---

## Teacher Features

### Dashboard
- Stats cards: total courses · total enrolled students · total materials · total quizzes · pending submissions · upcoming live classes
- **Enrollment Analytics** — bar chart of students per course
- **Submission Status** — pie chart of submitted / pending / graded breakdown
- **Content Distribution** — breakdown by material, assignment, quiz count

### Course Management
- Create / edit / delete courses (title, description, subject)
- View all enrolled students per course
- Full tabbed course view: Materials · Assignments · Quizzes · Live Classes · Students

### Material Management
- Add materials with title, description, URL, type (Document / Video / Link / Image / Other)
- Edit and delete materials
- Set display order within course

### Assignment Management
- Create assignments with title, description, **due date**, and **max score**
- Edit and delete assignments
- **View all student submissions** — filter by submitted / late / graded
- **Grade submissions** — assign score + write detailed feedback
- Late submission auto-detection (flagged by due date comparison)

### Quiz Management
- Create quizzes: title, description, time limit (or unlimited), difficulty level
- Add questions with 4 options each; mark correct answer; set point value
- Edit and delete quizzes; toggle active/inactive status
- **AI Quiz Generation** — enter topic or paste content → Claude generates MCQ questions at Easy / Medium / Hard difficulty, exportable as JSON

### Live Class Management
- Schedule classes with title, description, date/time, meeting link
- Update status: **Scheduled → Live → Ended**
- Add **recording URL** after session
- View attendee list and timestamps
- Monitor live **comments and Q&A** in real-time; mark questions answered

### AI Content Tools (Claude-powered)
- **Course Outline Generator** — specify subject, duration, level, objectives → Claude returns week-by-week breakdown with learning outcomes, assessment schedule, and teaching tips
- **Agentic workflow** — chain multiple tools in one request (e.g., generate quiz AND study plan simultaneously)

---

## Real-Time System (Socket.IO)

| Event | Who receives |
|---|---|
| New course created | Enrolled students |
| Live class scheduled | Enrolled students |
| Live class goes live / ends | Enrolled students |
| Student enrolls | Teacher |
| Assignment submitted | Teacher |
| Assignment graded | Student |
| Live comments & Q&A | All in the live class room |

---

## Notifications

- In-app notification panel in navbar with **unread badge count**
- Time-relative timestamps ("5m ago", "2h ago")
- Mark individual or **all as read**
- Persisted in database; loaded on login

---

## Themes

- **Light** · **Dark** · **Cosmic** — switchable via navbar
- Persisted to `localStorage`
- CSS custom properties with animated gradient backgrounds, glassmorphism cards, shimmer loading states

---

## Data Models

`User` · `Course` · `Material` · `Assignment` · `Submission` · `Quiz` · `QuizResult` · `LiveClass` · `Enrollment` · `CompletedMaterial` · `Notification` · `ClassComment` · `ClassQuestion`

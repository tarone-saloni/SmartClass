import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ThemeContext } from "../context/ThemeContext";

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */

const AI_TOOLS = [
  "generateQuiz",
  "summarizeMaterial",
  "explainConcept",
  "gradeAndFeedback",
  "createStudySchedule",
  "analyzePerformance",
  "generateCourseOutline",
];

const FLOW_STEPS = [
  {
    num: "Step 1 — Client Request",
    title: "React SPA sends HTTP/WS request",
    desc: "Browser makes REST call (axios/fetch) with httpOnly cookie or sends Socket.IO event. Google OAuth sends ID token for social login.",
  },
  {
    num: "Step 2 — Middleware Pipeline",
    title: "CORS → Body Parser → Cookie Parser → JWT Auth",
    desc: "Request passes through Express middleware chain. CORS validates origin, body is parsed to JSON, cookie is extracted, JWT is verified and user is attached to req.user.",
  },
  {
    num: "Step 3 — Route Matching",
    title: "Express Router dispatches to Controller",
    desc: "Matched route (e.g., POST /api/courses/:courseId/quizzes) calls the corresponding controller function. Nested routes use mergeParams for :courseId inheritance.",
  },
  {
    num: "Step 4 — AI Processing (if /api/ai/*)",
    title: "Agent Loop or Direct LLM Call",
    desc: "For AI routes: either a direct llm.js function call (quiz, summarize, explain) or the agentic loop in agent.js where Claude autonomously selects and chains tools across multiple iterations.",
  },
  {
    num: "Step 5 — Database Operations",
    title: "Mongoose Models → MongoDB Atlas",
    desc: "Controller performs CRUD via Mongoose models. Relationships maintained through ObjectId refs. Unique compound indexes prevent duplicate enrollments, submissions, and quiz results.",
  },
  {
    num: "Step 6 — Real-time Broadcast",
    title: "Socket.IO emits to rooms & users",
    desc: "After DB mutation, socketService.js emits events to relevant Socket.IO rooms: course:{id} for all course members, user:{id} for personal notifications, liveclass:{id} for live class participants.",
  },
  {
    num: "Step 7 — Response",
    title: "JSON response sent to client",
    desc: "Formatted response object returned. Auth routes set httpOnly secure cookies. File uploads return Cloudinary URLs. Error responses include descriptive error messages with appropriate HTTP status codes.",
  },
];

const STEP_COLORS = [
  "#5b9cf6",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#22d3ee",
  "#f472b6",
  "#5b9cf6",
];

const SOCKET_EVENTS = [
  {
    name: "join-course / leave-course",
    desc: "Student joins/leaves course room for live updates",
  },
  {
    name: "broadcaster / viewer",
    desc: "WebRTC signaling: teacher broadcasts, students view",
  },
  {
    name: "offer / answer / ice-candidate",
    desc: "WebRTC peer connection negotiation",
  },
  {
    name: "new-comment / new-reply",
    desc: "Live class chat with threaded replies",
  },
  {
    name: "raise-hand / lower-hand",
    desc: "Student participation in live class",
  },
  { name: "send-reaction", desc: "Emoji reactions during live class" },
  {
    name: "assignment:new / quiz:new",
    desc: "Real-time content creation notifications",
  },
  { name: "material:progress", desc: "Live progress % update to student" },
  {
    name: "recording-available",
    desc: "Notify students when recording is uploaded",
  },
  { name: "live-class-status", desc: "Broadcast: scheduled → live → ended" },
  {
    name: "screen-share-started/stopped",
    desc: "Teacher screen sharing state",
  },
  { name: "class-ended", desc: "Notify all participants class has ended" },
];

/* ─────────────────────────────────────────────────────────
   ARCH LAYERS (data)
───────────────────────────────────────────────────────── */
const LAYERS = [
  {
    id: "client",
    label: "① Client Layer",
    accent: "#5b9cf6",
    nodes: [
      {
        text: "React SPA",
        sub: "Vite · CORS: localhost:5173",
        color: "#5b9cf6",
      },
      {
        text: "Socket.IO Client",
        sub: "Real-time events & WebRTC",
        color: "#5b9cf6",
      },
      {
        text: "Google OAuth UI",
        sub: "ID Token / Access Token flow",
        color: "#5b9cf6",
      },
    ],
  },
  {
    id: "middleware",
    label: "② Middleware Layer — Express 5",
    accent: "#a78bfa",
    arrow: "HTTP REST + WebSocket",
    nodes: [
      { text: "CORS", sub: "Origin whitelist", color: "#a78bfa" },
      { text: "Body Parser", sub: "express.json()", color: "#a78bfa" },
      { text: "Cookie Parser", sub: "httpOnly cookies", color: "#a78bfa" },
      { text: "JWT Auth", sub: "requireAuth middleware", color: "#a78bfa" },
      { text: "Multer", sub: "Memory + Disk storage", color: "#a78bfa" },
      { text: "Socket.IO", sub: "WebRTC signaling server", color: "#a78bfa" },
      { text: "Static Files", sub: "/uploads directory", color: "#a78bfa" },
    ],
  },
  {
    id: "routes",
    label: "③ Routes & Controllers",
    accent: "#34d399",
    arrow: "Route matching → Controller",
    nodes: [
      {
        text: "/api/auth",
        sub: "Register · OTP · Login · Google · Logout",
        color: "#34d399",
      },
      {
        text: "/api/courses",
        sub: "CRUD · Enroll · Unenroll · Students",
        color: "#34d399",
      },
      {
        text: "/api/assignments",
        sub: "CRUD · Submit · Grade",
        color: "#34d399",
      },
      {
        text: "/api/quizzes",
        sub: "CRUD · Submit · Results",
        color: "#34d399",
      },
      {
        text: "/api/live-classes",
        sub: "Schedule · Join · Comments · Q&A · Recording",
        color: "#34d399",
      },
      {
        text: "/api/enrollments",
        sub: "Enroll · Unenroll · Progress tracking",
        color: "#34d399",
      },
      {
        text: "/api/notifications",
        sub: "List · Mark all read",
        color: "#34d399",
      },
      {
        text: "/api/dashboard",
        sub: "Teacher & Student dashboards",
        color: "#34d399",
      },
      {
        text: "/api/ai/*",
        sub: "Chat · Quiz · Summarize · Agent · Feedback",
        color: "#fbbf24",
      },
    ],
  },
  {
    id: "data",
    label: "⑤ Data Layer — MongoDB + Mongoose",
    accent: "#22d3ee",
    arrow: "Mongoose queries",
    nodes: [
      {
        text: "User",
        sub: "name · email · password · role · googleId",
        color: "#22d3ee",
      },
      {
        text: "Course",
        sub: "title · teacher · enrolledStudents[]",
        color: "#22d3ee",
      },
      {
        text: "Assignment",
        sub: "title · dueDate · maxScore · course",
        color: "#22d3ee",
      },
      {
        text: "Submission",
        sub: "content · score · feedback · status",
        color: "#22d3ee",
      },
      {
        text: "Quiz",
        sub: "questions[] · timeLimit · isActive",
        color: "#22d3ee",
      },
      {
        text: "QuizResult",
        sub: "answers[] · score · totalPoints",
        color: "#22d3ee",
      },
      {
        text: "LiveClass",
        sub: "type: meetLink|platform · status · attendees",
        color: "#22d3ee",
      },
      {
        text: "Material",
        sub: "fileUrl · cloudinaryPublicId · order",
        color: "#22d3ee",
      },
      {
        text: "Enrollment",
        sub: "progress · status · completedAt",
        color: "#22d3ee",
      },
      { text: "Notification", sub: "message · type · read", color: "#22d3ee" },
      {
        text: "AIStudyPlan",
        sub: "student · content · courses[]",
        color: "#22d3ee",
      },
      {
        text: "AICourseOutline",
        sub: "teacher · content · subject",
        color: "#22d3ee",
      },
    ],
  },
  {
    id: "external",
    label: "⑥ External Services",
    accent: "#f472b6",
    arrow: "External API calls",
    nodes: [
      {
        text: "MongoDB Atlas",
        sub: "Cloud database · retryWrites",
        color: "#f472b6",
      },
      {
        text: "Anthropic API",
        sub: "Claude claude-sonnet-4-6 · Tool use",
        color: "#f472b6",
      },
      {
        text: "Cloudinary",
        sub: "Video · Image · PDF uploads",
        color: "#f472b6",
      },
      {
        text: "Gmail SMTP",
        sub: "OTP emails · Course notifications",
        color: "#f472b6",
      },
      { text: "Google OAuth", sub: "ID token verification", color: "#f472b6" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────────────────── */

function FlowArrow({ label }) {
  return (
    <div className="flex justify-center items-center h-9 relative my-1">
      <div className="w-px h-full bg-[var(--border)]" />
      <span className="absolute bottom-0 text-[var(--muted)] text-[10px]">
        ▼
      </span>
      {label && (
        <span
          className="absolute right-[calc(50%+14px)] text-[var(--muted)] whitespace-nowrap"
          style={{
            fontSize: "0.6rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function Node({ text, sub, color }) {
  return (
    <div
      className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-default hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${color}`,
        color: "var(--text)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.borderLeftColor = color;
      }}
    >
      <span>{text}</span>
      {sub && (
        <span
          className="block text-[var(--muted)] mt-0.5"
          style={{ fontWeight: 300, fontSize: "0.7rem" }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function ArchLayer({ label, accent, children }) {
  return (
    <div
      className="relative rounded-2xl p-5 transition-all duration-300"
      style={{
        border: `1px solid ${accent}33`,
        background: `${accent}0d`,
      }}
    >
      <div
        className="absolute -top-[11px] left-5 px-3 text-[10px] font-bold uppercase tracking-widest"
        style={{
          background: "var(--bg)",
          color: accent,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "1.5px",
        }}
      >
        {label}
      </div>
      <div className="flex flex-wrap gap-2.5 mt-1">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */

function TechArchitecture() {
  // Removed unused themeName to satisfy no-unused-vars lint rule

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@300;400;600;700;800&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ta-fadein { animation: fadeUp 0.5s ease both; }
      `}</style>

      <Navbar />

      <main className="flex-1 px-6 pb-16 pt-10 font-[Outfit,sans-serif]">
        <div className="max-w-5xl mx-auto">
          {/* ── Header ── */}
          <div className="text-center mb-12 ta-fadein">
            <span
              className="block text-xs font-bold uppercase tracking-[2px] mb-3"
              style={{
                color: "var(--accent)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Technical Architecture &amp; Backend Flow
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 gradient-text">
              SmartClass LMS Backend
            </h1>
            <p className="text-[var(--text-secondary)] text-lg font-light">
              Express 5 · MongoDB · Socket.IO · Claude AI · Cloudinary
            </p>
          </div>

          {/* ── Architecture Layers ── */}
          <div className="flex flex-col gap-5">
            {LAYERS.map((layer, li) => (
              <div
                key={layer.id}
                className="ta-fadein"
                style={{ animationDelay: `${li * 80}ms` }}
              >
                {layer.arrow && <FlowArrow label={layer.arrow} />}
                <ArchLayer label={layer.label} accent={layer.accent}>
                  {layer.nodes.map((n) => (
                    <Node
                      key={n.text}
                      text={n.text}
                      sub={n.sub}
                      color={n.color}
                    />
                  ))}
                </ArchLayer>
              </div>
            ))}

            {/* AI / Agentic Layer — special 2-column layout */}
            <FlowArrow label="Business logic" />
            <div
              className="relative rounded-2xl p-5 ta-fadein"
              style={{
                border: "1px solid #fbbf2433",
                background: "#fbbf240d",
              }}
            >
              <div
                className="absolute -top-[11px] left-5 px-3 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: "var(--bg)",
                  color: "#fbbf24",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "1.5px",
                }}
              >
                ④ AI / Agentic Layer — Claude API
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {/* Left: core files */}
                <div className="flex flex-col gap-2">
                  {[
                    {
                      text: "agent.js",
                      sub: "Agentic loop · Max 10 iterations\nAuto tool selection · Multi-step chains",
                    },
                    {
                      text: "llm.js",
                      sub: "callClaude() base helper\nModel: claude-sonnet-4-6",
                    },
                    {
                      text: "tools.js",
                      sub: "7 tool schemas for Claude tool_use",
                    },
                  ].map((n) => (
                    <Node
                      key={n.text}
                      text={n.text}
                      sub={n.sub}
                      color="#fbbf24"
                    />
                  ))}
                </div>
                {/* Right: tools grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  {AI_TOOLS.map((t) => (
                    <div
                      key={t}
                      className="rounded-lg px-2.5 py-1.5 text-center text-xs font-semibold cursor-default transition-all duration-200 hover:scale-[1.03]"
                      style={{
                        background: "rgba(251,191,36,0.10)",
                        border: "1px solid rgba(251,191,36,0.22)",
                        color: "#fbbf24",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Request Lifecycle ── */}
          <div className="mt-14">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text)]">
              Request <span className="text-[var(--accent)]">Lifecycle</span>{" "}
              Flow
            </h2>
            <div className="relative flex flex-col gap-3 pl-8">
              {/* vertical line */}
              <div
                className="absolute left-[11px] top-0 bottom-0 w-0.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(to bottom, #5b9cf6, #a78bfa, #34d399, #fbbf24, #22d3ee, #f472b6)",
                }}
              />
              {FLOW_STEPS.map((s, i) => (
                <div
                  key={i}
                  className="relative rounded-xl p-4 border ta-fadein transition-colors duration-300"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  {/* dot */}
                  <div
                    className="absolute -left-[27px] top-[18px] w-3 h-3 rounded-full border-2"
                    style={{
                      borderColor: "var(--bg)",
                      background: STEP_COLORS[i],
                    }}
                  />
                  <div
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{
                      color: STEP_COLORS[i],
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {s.num}
                  </div>
                  <h4 className="text-sm font-bold mb-1 text-[var(--text)]">
                    {s.title}
                  </h4>
                  <p className="text-xs text-[var(--muted)] font-light leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Socket Events ── */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-5 text-[var(--text)]">
              Real-time{" "}
              <span style={{ color: "var(--danger)" }}>Socket.IO</span> Events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SOCKET_EVENTS.map((ev) => (
                <div
                  key={ev.name}
                  className="rounded-xl p-3 border transition-all duration-200 cursor-default hover:-translate-y-0.5"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--danger)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <div
                    className="text-xs font-bold mb-1"
                    style={{
                      color: "var(--danger)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {ev.name}
                  </div>
                  <div className="text-xs text-[var(--muted)] font-light leading-snug">
                    {ev.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Legend ── */}
          <div
            className="mt-12 rounded-2xl p-5 border transition-colors duration-300"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <h3 className="text-sm font-bold text-[var(--text)] mb-4 uppercase tracking-wider">
              Layer Legend
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Client", color: "#5b9cf6" },
                { label: "Middleware", color: "#a78bfa" },
                { label: "Routes", color: "#34d399" },
                { label: "AI / Agent", color: "#fbbf24" },
                { label: "Data", color: "#22d3ee" },
                { label: "External", color: "#f472b6" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs text-[var(--muted)] font-medium">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default TechArchitecture;

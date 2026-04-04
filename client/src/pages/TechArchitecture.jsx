import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ARCH_LAYERS = [
  {
    cls: "client",
    label: "① Client Layer",
    nodes: [
      { text: "React SPA", sub: "Vite · CORS: localhost:5173", color: "blue" },
      {
        text: "Socket.IO Client",
        sub: "Real-time events & WebRTC",
        color: "blue",
      },
      {
        text: "Google OAuth UI",
        sub: "ID Token / Access Token flow",
        color: "blue",
      },
    ],
  },
  {
    cls: "middleware",
    label: "② Middleware Layer — Express 5",
    nodes: [
      { text: "CORS", sub: "Origin whitelist", color: "purple" },
      { text: "Body Parser", sub: "express.json()", color: "purple" },
      { text: "Cookie Parser", sub: "httpOnly cookies", color: "purple" },
      { text: "JWT Auth", sub: "requireAuth middleware", color: "purple" },
      { text: "Multer", sub: "Memory + Disk storage", color: "purple" },
      { text: "Socket.IO", sub: "WebRTC signaling server", color: "purple" },
      { text: "Static Files", sub: "/uploads directory", color: "purple" },
    ],
  },
  {
    cls: "routes",
    label: "③ Routes & Controllers",
    nodes: [
      {
        text: "/api/auth",
        sub: "Register · OTP · Login · Google · Logout",
        color: "green",
      },
      {
        text: "/api/courses",
        sub: "CRUD · Enroll · Unenroll · Students",
        color: "green",
      },
      {
        text: "/api/assignments",
        sub: "CRUD · Submit · Grade",
        color: "green",
      },
      { text: "/api/quizzes", sub: "CRUD · Submit · Results", color: "green" },
      {
        text: "/api/live-classes",
        sub: "Schedule · Join · Comments · Q&A · Recording",
        color: "green",
      },
      {
        text: "/api/enrollments",
        sub: "Enroll · Unenroll · Progress tracking",
        color: "green",
      },
      {
        text: "/api/notifications",
        sub: "List · Mark all read",
        color: "green",
      },
      {
        text: "/api/dashboard",
        sub: "Teacher & Student dashboards",
        color: "green",
      },
      {
        text: "/api/ai/*",
        sub: "Chat · Quiz · Summarize · Agent · Feedback",
        color: "amber",
      },
    ],
  },
  {
    cls: "data",
    label: "⑤ Data Layer — MongoDB + Mongoose",
    nodes: [
      {
        text: "User",
        sub: "name · email · password · role · googleId",
        color: "teal",
      },
      {
        text: "Course",
        sub: "title · teacher · enrolledStudents[]",
        color: "teal",
      },
      {
        text: "Assignment",
        sub: "title · dueDate · maxScore · course",
        color: "teal",
      },
      {
        text: "Submission",
        sub: "content · score · feedback · status",
        color: "teal",
      },
      {
        text: "Quiz",
        sub: "questions[] · timeLimit · isActive",
        color: "teal",
      },
      {
        text: "QuizResult",
        sub: "answers[] · score · totalPoints",
        color: "teal",
      },
      {
        text: "LiveClass",
        sub: "type: meetLink|platform · status · attendees",
        color: "teal",
      },
      {
        text: "Material",
        sub: "fileUrl · cloudinaryPublicId · order",
        color: "teal",
      },
      {
        text: "Enrollment",
        sub: "progress · status · completedAt",
        color: "teal",
      },
      { text: "Notification", sub: "message · type · read", color: "teal" },
      {
        text: "AIStudyPlan",
        sub: "student · content · courses[]",
        color: "teal",
      },
      {
        text: "AICourseOutline",
        sub: "teacher · content · subject",
        color: "teal",
      },
    ],
  },
  {
    cls: "external",
    label: "⑥ External Services",
    nodes: [
      {
        text: "MongoDB Atlas",
        sub: "Cloud database · retryWrites",
        color: "pink",
      },
      {
        text: "Anthropic API",
        sub: "Claude claude-sonnet-4-6 · Tool use",
        color: "pink",
      },
      { text: "Cloudinary", sub: "Video · Image · PDF uploads", color: "pink" },
      {
        text: "Gmail SMTP",
        sub: "OTP emails · Course notifications",
        color: "pink",
      },
      { text: "Google OAuth", sub: "ID token verification", color: "pink" },
    ],
  },
];

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

const LAYER_COLORS = {
  client: {
    border: "rgba(91,156,246,0.3)",
    bg: "rgba(91,156,246,0.06)",
    tag: "#5b9cf6",
  },
  middleware: {
    border: "rgba(167,139,250,0.3)",
    bg: "rgba(167,139,250,0.06)",
    tag: "#a78bfa",
  },
  routes: {
    border: "rgba(52,211,153,0.3)",
    bg: "rgba(52,211,153,0.06)",
    tag: "#34d399",
  },
  ai: {
    border: "rgba(251,191,36,0.3)",
    bg: "rgba(251,191,36,0.06)",
    tag: "#fbbf24",
  },
  data: {
    border: "rgba(34,211,238,0.3)",
    bg: "rgba(34,211,238,0.06)",
    tag: "#22d3ee",
  },
  external: {
    border: "rgba(244,114,182,0.3)",
    bg: "rgba(244,114,182,0.06)",
    tag: "#f472b6",
  },
};

const NODE_COLORS = {
  blue: "#5b9cf6",
  purple: "#a78bfa",
  green: "#34d399",
  amber: "#fbbf24",
  teal: "#22d3ee",
  pink: "#f472b6",
  red: "#f87171",
};

const STEP_COLORS = [
  "#5b9cf6",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#22d3ee",
  "#f472b6",
  "#5b9cf6",
];

function FlowArrow({ label }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 36,
        position: "relative",
      }}
    >
      <div
        style={{
          width: 2,
          height: "100%",
          background: "linear-gradient(to bottom, #2a2f4a, #8b90b0)",
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: -2,
          fontSize: 10,
          color: "#8b90b0",
        }}
      >
        ▼
      </span>
      {label && (
        <span
          style={{
            position: "absolute",
            right: "calc(50% + 14px)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            color: "#8b90b0",
            whiteSpace: "nowrap",
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
      style={{
        background: "#1c2038",
        border: "1px solid #2a2f4a",
        borderLeft: `3px solid ${NODE_COLORS[color] || "#8b90b0"}`,
        borderRadius: 10,
        padding: "10px 16px",
        fontSize: "0.82rem",
        fontWeight: 600,
        color: "#e2e4f0",
        cursor: "default",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = NODE_COLORS[color];
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.borderColor = "#2a2f4a";
        e.currentTarget.style.borderLeftColor = NODE_COLORS[color];
      }}
    >
      {text}
      {sub && (
        <span
          style={{
            display: "block",
            fontWeight: 300,
            fontSize: "0.7rem",
            color: "#8b90b0",
            marginTop: 2,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function ArchLayer({ cls, label, children }) {
  const c = LAYER_COLORS[cls] || LAYER_COLORS.client;
  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        padding: 20,
        background: c.bg,
        position: "relative",
        animation: "fadeUp 0.6s ease both",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -11,
          left: 20,
          background: "#0c0f1a",
          padding: "0 12px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: c.tag,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
        {children}
      </div>
    </div>
  );
}

function TechArchitecture() {
  return (
    <div
      style={{
        background: "#0c0f1a",
        color: "#e2e4f0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@300;400;600;700;800&display=swap');
        .ta-root * { box-sizing: border-box; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Navbar />

      <main
        className="ta-root"
        style={{
          flex: 1,
          fontFamily: "'Outfit', sans-serif",
          padding: "40px 24px 60px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                color: "#a78bfa",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: 12,
                display: "block",
              }}
            >
              Technical Architecture &amp; Backend Flow
            </span>
            <h1
              style={{
                fontSize: "2.4rem",
                fontWeight: 800,
                letterSpacing: -1,
                background:
                  "linear-gradient(135deg, #5b9cf6, #a78bfa, #f472b6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: 8,
              }}
            >
              SmartClass LMS Backend
            </h1>
            <p
              style={{ color: "#8b90b0", fontSize: "1.05rem", fontWeight: 300 }}
            >
              Express 5 · MongoDB · Socket.IO · Claude AI · Cloudinary
            </p>
          </div>

          {/* Architecture Layers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <ArchLayer cls="client" label="① Client Layer">
              <Node
                text="React SPA"
                sub="Vite · CORS: localhost:5173"
                color="blue"
              />
              <Node
                text="Socket.IO Client"
                sub="Real-time events & WebRTC"
                color="blue"
              />
              <Node
                text="Google OAuth UI"
                sub="ID Token / Access Token flow"
                color="blue"
              />
            </ArchLayer>

            <FlowArrow label="HTTP REST + WebSocket" />

            <ArchLayer cls="middleware" label="② Middleware Layer — Express 5">
              <Node text="CORS" sub="Origin whitelist" color="purple" />
              <Node text="Body Parser" sub="express.json()" color="purple" />
              <Node
                text="Cookie Parser"
                sub="httpOnly cookies"
                color="purple"
              />
              <Node
                text="JWT Auth"
                sub="requireAuth middleware"
                color="purple"
              />
              <Node text="Multer" sub="Memory + Disk storage" color="purple" />
              <Node
                text="Socket.IO"
                sub="WebRTC signaling server"
                color="purple"
              />
              <Node
                text="Static Files"
                sub="/uploads directory"
                color="purple"
              />
            </ArchLayer>

            <FlowArrow label="Route matching → Controller" />

            <ArchLayer cls="routes" label="③ Routes & Controllers">
              <Node
                text="/api/auth"
                sub="Register · OTP · Login · Google · Logout"
                color="green"
              />
              <Node
                text="/api/courses"
                sub="CRUD · Enroll · Unenroll · Students"
                color="green"
              />
              <Node
                text="/api/assignments"
                sub="CRUD · Submit · Grade"
                color="green"
              />
              <Node
                text="/api/quizzes"
                sub="CRUD · Submit · Results"
                color="green"
              />
              <Node
                text="/api/live-classes"
                sub="Schedule · Join · Comments · Q&A · Recording"
                color="green"
              />
              <Node
                text="/api/enrollments"
                sub="Enroll · Unenroll · Progress tracking"
                color="green"
              />
              <Node
                text="/api/notifications"
                sub="List · Mark all read"
                color="green"
              />
              <Node
                text="/api/dashboard"
                sub="Teacher & Student dashboards"
                color="green"
              />
              <Node
                text="/api/ai/*"
                sub="Chat · Quiz · Summarize · Agent · Feedback"
                color="amber"
              />
            </ArchLayer>

            <FlowArrow label="Business logic" />

            {/* AI Layer */}
            <div
              style={{
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: 16,
                padding: 20,
                background: "rgba(251,191,36,0.06)",
                position: "relative",
                animation: "fadeUp 0.6s ease both",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -11,
                  left: 20,
                  background: "#0c0f1a",
                  padding: "0 12px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "#fbbf24",
                }}
              >
                ④ AI / Agentic Layer — Claude API
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <Node
                    text="agent.js"
                    sub={
                      "Agentic loop · Max 10 iterations\nAuto tool selection · Multi-step chains"
                    }
                    color="amber"
                  />
                  <Node
                    text="llm.js"
                    sub={"callClaude() base helper\nModel: claude-sonnet-4-6"}
                    color="amber"
                  />
                  <Node
                    text="tools.js"
                    sub="7 tool schemas for Claude tool_use"
                    color="amber"
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                  }}
                >
                  {AI_TOOLS.map((t) => (
                    <div
                      key={t}
                      style={{
                        background: "rgba(251,191,36,0.1)",
                        border: "1px solid rgba(251,191,36,0.2)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#fbbf24",
                        textAlign: "center",
                        transition: "all 0.2s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(251,191,36,0.2)";
                        e.currentTarget.style.transform = "scale(1.03)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(251,191,36,0.1)";
                        e.currentTarget.style.transform = "";
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <FlowArrow label="Mongoose queries" />

            <ArchLayer cls="data" label="⑤ Data Layer — MongoDB + Mongoose">
              <Node
                text="User"
                sub="name · email · password · role · googleId"
                color="teal"
              />
              <Node
                text="Course"
                sub="title · teacher · enrolledStudents[]"
                color="teal"
              />
              <Node
                text="Assignment"
                sub="title · dueDate · maxScore · course"
                color="teal"
              />
              <Node
                text="Submission"
                sub="content · score · feedback · status"
                color="teal"
              />
              <Node
                text="Quiz"
                sub="questions[] · timeLimit · isActive"
                color="teal"
              />
              <Node
                text="QuizResult"
                sub="answers[] · score · totalPoints"
                color="teal"
              />
              <Node
                text="LiveClass"
                sub="type: meetLink|platform · status · attendees"
                color="teal"
              />
              <Node
                text="Material"
                sub="fileUrl · cloudinaryPublicId · order"
                color="teal"
              />
              <Node
                text="Enrollment"
                sub="progress · status · completedAt"
                color="teal"
              />
              <Node
                text="Notification"
                sub="message · type · read"
                color="teal"
              />
              <Node
                text="AIStudyPlan"
                sub="student · content · courses[]"
                color="teal"
              />
              <Node
                text="AICourseOutline"
                sub="teacher · content · subject"
                color="teal"
              />
            </ArchLayer>

            <FlowArrow label="External API calls" />

            <ArchLayer cls="external" label="⑥ External Services">
              <Node
                text="MongoDB Atlas"
                sub="Cloud database · retryWrites"
                color="pink"
              />
              <Node
                text="Anthropic API"
                sub="Claude claude-sonnet-4-6 · Tool use"
                color="pink"
              />
              <Node
                text="Cloudinary"
                sub="Video · Image · PDF uploads"
                color="pink"
              />
              <Node
                text="Gmail SMTP"
                sub="OTP emails · Course notifications"
                color="pink"
              />
              <Node
                text="Google OAuth"
                sub="ID token verification"
                color="pink"
              />
            </ArchLayer>
          </div>

          {/* Request Lifecycle */}
          <div style={{ marginTop: 56 }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: 24,
                color: "#e2e4f0",
              }}
            >
              Request <span style={{ color: "#a78bfa" }}>Lifecycle</span> Flow
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                position: "relative",
                paddingLeft: 32,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 11,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background:
                    "linear-gradient(to bottom, #5b9cf6, #a78bfa, #34d399, #fbbf24, #22d3ee, #f472b6)",
                  borderRadius: 2,
                }}
              />
              {FLOW_STEPS.map((s, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    padding: "12px 16px",
                    background: "#141829",
                    border: "1px solid #2a2f4a",
                    borderRadius: 10,
                    marginBottom: 12,
                    animation: "fadeUp 0.5s ease both",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: -27,
                      top: 18,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      border: "2px solid #0c0f1a",
                      background: STEP_COLORS[i],
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginBottom: 4,
                      color: STEP_COLORS[i],
                    }}
                  >
                    {s.num}
                  </div>
                  <h4
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      marginBottom: 3,
                      color: "#e2e4f0",
                    }}
                  >
                    {s.title}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "#8b90b0",
                      fontWeight: 300,
                      lineHeight: 1.5,
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Socket Events */}
          <div style={{ marginTop: 48 }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: 20,
                color: "#e2e4f0",
              }}
            >
              Real-time <span style={{ color: "#f87171" }}>Socket.IO</span>{" "}
              Events
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {SOCKET_EVENTS.map((ev) => (
                <div
                  key={ev.name}
                  style={{
                    background: "#141829",
                    border: "1px solid #2a2f4a",
                    borderRadius: 10,
                    padding: "12px 14px",
                    transition: "all 0.2s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#f87171";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2a2f4a";
                    e.currentTarget.style.transform = "";
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "#f87171",
                      marginBottom: 4,
                    }}
                  >
                    {ev.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "#8b90b0",
                      fontWeight: 300,
                    }}
                  >
                    {ev.desc}
                  </div>
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

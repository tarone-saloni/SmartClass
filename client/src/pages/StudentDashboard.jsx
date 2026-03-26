import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashData, setDashData] = useState({
    enrolledCourses: [],
    pendingAssignments: 0,
    completedQuizzes: 0,
    totalEnrolled: 0,
    upcomingClasses: [],
    performanceData: [],
    progressData: [],
    timeSpentData: [],
  });
  const [allCourses, setAllCourses] = useState([]);
  const [enrollingId, setEnrollingId] = useState(null);
  const [unenrollingId, setUnenrollingId] = useState(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const dashResponse = await fetch(`/api/students/${user.id}/dashboard`);
      const dashDataRes = await dashResponse.json();
      if (!dashDataRes.error) {
        setDashData(dashDataRes);
      }

      const coursesResponse = await fetch("/api/courses");
      const coursesData = await coursesResponse.json();
      if (Array.isArray(coursesData)) {
        setAllCourses(coursesData);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      load();
      const socket = getSocket(user.id);
      socket.on("new-course", () => load());
      socket.on("live-class-scheduled", () => load());
      socket.on("dashboard-update", () => load());
      return () => {
        socket.off("new-course");
        socket.off("live-class-scheduled");
        socket.off("dashboard-update");
      };
    }
  }, [user?.id]);

  const enroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, courseId }),
      });
      if (response.ok) {
        await load();
      }
    } catch (error) {
      console.error("Enrollment failed:", error);
    } finally {
      setEnrollingId(null);
    }
  };

  const unenroll = async () => {
    if (!confirmUnenroll) return;
    setUnenrollingId(confirmUnenroll.id);
    try {
      const response = await fetch("/api/enrollments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, courseId: confirmUnenroll.id }),
      });
      if (response.ok) {
        setConfirmUnenroll(null);
        await load();
      }
    } catch (error) {
      console.error("Unenrollment failed:", error);
    } finally {
      setUnenrollingId(null);
    }
  };

  const enrolled = dashData.enrolledCourses || [];
  const enrolledIds = enrolled.map((c) => c.id);
  const available = allCourses.filter((c) => !enrolledIds.includes(c.id));

  const stats = [
    { icon: "📚", val: dashData.totalEnrolled ?? enrolled.length, label: "Enrolled", color: "from-blue-500 to-blue-600", bg: "from-blue-500/15 to-blue-600/5" },
    { icon: "📋", val: dashData.pendingAssignments ?? 0, label: "Pending", color: "from-amber-500 to-amber-600", bg: "from-amber-500/15 to-amber-600/5" },
    { icon: "🧠", val: dashData.completedQuizzes ?? 0, label: "Quizzes Done", color: "from-purple-500 to-purple-600", bg: "from-purple-500/15 to-purple-600/5" },
    { icon: "📹", val: dashData.upcomingClasses?.length ?? 0, label: "Upcoming", color: "from-emerald-500 to-emerald-600", bg: "from-emerald-500/15 to-emerald-600/5" },
  ];

  const chartColors = ["#818cf8", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];

  const tooltipStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    boxShadow: "0 12px 32px -8px rgba(0,0,0,0.2)",
    fontSize: "12px",
    fontWeight: 600,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative overflow-hidden">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 relative z-10">
        {/* Header */}
        <div className="mb-12 animate-[slide-down_0.6s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="flex items-center gap-5 mb-2">
            <div className="text-5xl sm:text-6xl drop-shadow-lg animate-float">👋</div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)] sc-title">
                Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0] || "Student"}</span>!
              </h1>
              <p className="text-sm text-[var(--muted)] mt-2 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Your personalized learning dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`group sc-card-premium glass rounded-2xl p-6 bg-gradient-to-br ${s.bg}
                         animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4
                              bg-gradient-to-br ${s.color} shadow-lg
                              group-hover:scale-110 group-hover:rotate-[-5deg] transition-all duration-500`}>
                <span className="brightness-0 invert">{s.icon}</span>
              </div>
              <div className="text-4xl font-extrabold text-[var(--text)] mb-1 tracking-tighter font-[var(--font-mono)]
                              animate-[count-up_0.8s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: `${200 + i * 100}ms` }}>
                {s.val}
              </div>
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        {dashData.performanceData?.length > 0 || dashData.progressData?.length > 0 || dashData.timeSpentData?.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {dashData.performanceData?.length > 0 && (
              <div className="sc-card-premium glass rounded-2xl p-6 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: "100ms" }}>
                <h3 className="text-lg font-bold text-[var(--text)] mb-5 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-sm">📊</span>
                  Performance Trend
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dashData.performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis stroke="var(--muted)" style={{ fontSize: "11px", fontWeight: 600 }} />
                    <YAxis stroke="var(--muted)" style={{ fontSize: "11px", fontWeight: 600 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--accent)", strokeWidth: 2, strokeDasharray: "4 4" }} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={{ fill: "#818cf8", r: 5, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {dashData.progressData?.length > 0 && (
              <div className="sc-card-premium glass rounded-2xl p-6 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: "200ms" }}>
                <h3 className="text-lg font-bold text-[var(--text)] mb-5 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-sm">🎯</span>
                  Course Progress
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dashData.progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis stroke="var(--muted)" style={{ fontSize: "11px", fontWeight: 600 }} />
                    <YAxis stroke="var(--muted)" style={{ fontSize: "11px", fontWeight: 600 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="completion" fill="#a78bfa" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {dashData.timeSpentData?.length > 0 && (
              <div className="sc-card-premium glass rounded-2xl p-6 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: "300ms" }}>
                <h3 className="text-lg font-bold text-[var(--text)] mb-5 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center text-sm">⏱️</span>
                  Time Spent by Course
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={dashData.timeSpentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="hours"
                      strokeWidth={2}
                      stroke="var(--bg)"
                    >
                      {dashData.timeSpentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : null}

        {/* Upcoming Live Classes */}
        {dashData.upcomingClasses?.length > 0 && (
          <div className="mb-12 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: "200ms" }}>
            <h2 className="text-2xl font-extrabold text-[var(--text)] mb-5 flex items-center gap-3 sc-title">
              <span className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-xl">📹</span>
              Upcoming Live Classes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashData.upcomingClasses.slice(0, 3).map((lc, i) => (
                <div
                  key={lc.id}
                  className="sc-card-premium glass rounded-2xl p-5 hover-lift
                           animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${lc.status === "live"
                      ? "bg-red-500/15 text-red-500 animate-pulse border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                      : "bg-blue-500/15 text-blue-500 border border-blue-500/30"
                      }`}>
                      {lc.status === "live" ? "🔴 LIVE" : "🗓️ Scheduled"}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-semibold">
                      {new Date(lc.scheduledAt).toLocaleDateString()} · {new Date(lc.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[var(--text)] mb-2 line-clamp-2">{lc.title}</p>
                  {lc.course?.title && (
                    <p className="text-xs text-[var(--muted)] mb-3 font-medium">📚 {lc.course.title}</p>
                  )}
                  {lc.meetingLink && (
                    <a
                      href={lc.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-light)] 
                                 transition-all duration-300 hover:translate-x-0.5"
                    >
                      Join Meeting <span>→</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Courses */}
        {enrolled.length > 0 && (
          <div className="mb-12 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[var(--text)] flex items-center gap-3 sc-title">
                  <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-xl">📖</span>
                  My Learning Path
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1 font-medium ml-[52px]">Continue where you left off</p>
              </div>
              <span className="px-4 py-2 rounded-full glass text-[var(--accent)] text-xs font-bold
                               border border-[var(--accent)]/25 shadow-[0_4px_16px_-4px_var(--accent)]">
                {enrolled.length} active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolled.map((c, i) => (
                <div
                  key={c.id}
                  className="group sc-card-premium glass rounded-2xl p-6 overflow-hidden
                           animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0
                                 group-hover:from-[var(--accent)]/5 group-hover:to-[var(--accent)]/0 transition-all duration-500" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <h3 className="text-lg font-bold text-[var(--text)] flex-1 leading-snug group-hover:text-[var(--accent)] transition-colors duration-300">
                        {c.title}
                      </h3>
                      {c.subject && (
                        <span className="px-3 py-1 bg-[var(--accent)]/12 text-[var(--accent)] rounded-lg text-[10px] font-bold whitespace-nowrap
                                         uppercase tracking-wider border border-[var(--accent)]/15">
                          {c.subject}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--muted)] mb-4 flex items-center gap-1.5 font-medium">
                      👨‍🏫 {c.teacher?.name || "Unknown"}
                    </p>

                    {/* Stats mini-grid */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {[
                        { val: c.materialCount || 0, label: "Materials", color: "blue" },
                        { val: c.assignmentCount || 0, label: "Tasks", color: "amber" },
                        { val: c.quizCount || 0, label: "Quizzes", color: "purple" },
                      ].map((stat) => (
                        <div key={stat.label} className={`p-2.5 rounded-xl bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 
                                  border border-${stat.color}-500/15 text-center transition-all duration-300
                                  group-hover:border-${stat.color}-500/30`}>
                          <p className="font-extrabold text-[var(--text)] text-lg">{stat.val}</p>
                          <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/course/${c.id}`)}
                        className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer sc-btn-glow active:scale-95"
                      >
                        Open Course →
                      </button>
                      <button
                        onClick={() => setConfirmUnenroll(c)}
                        className="px-3 py-3 rounded-xl text-sm font-bold border border-red-500/25 bg-red-500/8 
                                   hover:bg-red-500/15 text-red-500 cursor-pointer transition-all duration-300
                                   hover:border-red-500/40 active:scale-95"
                        title="Unenroll"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Courses */}
        {available.length > 0 && (
          <div className="animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[var(--text)] flex items-center gap-3 sc-title">
                  <span className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl">🌟</span>
                  Explore More
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1 font-medium ml-[52px]">Expand your skills with new courses</p>
              </div>
              <span className="px-4 py-2 rounded-full glass text-emerald-500 text-xs font-bold
                               border border-emerald-500/25">
                {available.length} available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {available.map((c, i) => (
                <div
                  key={c.id}
                  className="group sc-card-premium glass rounded-2xl p-6 overflow-hidden
                           animate-[slide-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${(enrolled.length + i) * 80}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0
                                 group-hover:from-emerald-500/5 group-hover:to-emerald-500/0 transition-all duration-500" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <h3 className="text-lg font-bold text-[var(--text)] flex-1 leading-snug group-hover:text-emerald-500 transition-colors duration-300">
                        {c.title}
                      </h3>
                      {c.subject && (
                        <span className="px-3 py-1 bg-emerald-500/12 text-emerald-500 rounded-lg text-[10px] font-bold whitespace-nowrap
                                         uppercase tracking-wider border border-emerald-500/15">
                          {c.subject}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--muted)] mb-3 flex items-center gap-1.5 font-medium">
                      👨‍🏫 {c.teacher?.name || "Unknown"}
                    </p>

                    <p className="text-sm text-[var(--muted)] mb-4 leading-relaxed line-clamp-2 font-medium">
                      {c.description || "Explore this amazing course and expand your knowledge"}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/15 text-center">
                        <p className="font-extrabold text-[var(--text)] text-lg">{c.enrollmentCount || 0}</p>
                        <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-wider mt-0.5">Enrolled</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/15 text-center">
                        <p className="font-extrabold text-[var(--text)] text-lg">{c.materialCount || 0}</p>
                        <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-wider mt-0.5">Materials</p>
                      </div>
                    </div>

                    <button
                      onClick={() => enroll(c.id)}
                      disabled={enrollingId === c.id}
                      className="w-full py-3 rounded-xl text-sm font-bold border-2 cursor-pointer disabled:cursor-not-allowed transition-all duration-300
                               bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-60 text-emerald-500 border-emerald-500/30
                               hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-95"
                    >
                      {enrollingId === c.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                          Enrolling...
                        </span>
                      ) : (
                        "+ Enroll Now"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {enrolled.length === 0 && available.length === 0 && !loading && (
          <div className="text-center py-24 animate-[scale-in_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="text-8xl mb-6 drop-shadow-lg animate-float">🎓</div>
            <h3 className="text-2xl font-extrabold text-[var(--text)] mb-3 sc-title">No Courses Yet</h3>
            <p className="text-[var(--muted)] text-base max-w-md mx-auto font-medium leading-relaxed">
              Your learning journey starts here! Ask your teacher to create courses for you.
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 border-[3px] border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin
                           shadow-[0_0_16px_var(--accent)]" />
            <p className="text-sm text-[var(--muted)] font-medium animate-pulse">Loading your dashboard...</p>
          </div>
        )}
      </div>

      <Footer />

      {/* Unenroll confirmation modal */}
      {confirmUnenroll && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setConfirmUnenroll(null)}
        >
          <div className="glass-heavy border border-[var(--border)]/60 rounded-2xl p-8 w-full max-w-sm 
                          shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)] text-center
                          animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-extrabold text-[var(--text)] mb-3 sc-title">Unenroll from course?</h3>
            <p className="text-sm text-[var(--muted)] mb-7 font-medium leading-relaxed">
              You will lose access to <strong className="text-[var(--text)] font-bold">"{confirmUnenroll.title}"</strong>.
              You can re-enroll at any time.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmUnenroll(null)}
                className="px-6 py-3 glass hover:bg-[var(--border)]/30 text-[var(--text)] rounded-xl text-sm font-bold 
                           border border-[var(--border)]/50 cursor-pointer transition-all duration-300 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={unenroll}
                disabled={unenrollingId === confirmUnenroll.id}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:shadow-[0_8px_24px_-4px_rgba(239,68,68,0.4)] 
                           disabled:opacity-60 text-white rounded-xl text-sm font-bold border-none cursor-pointer transition-all duration-300
                           active:scale-95"
              >
                {unenrollingId === confirmUnenroll.id ? "Leaving..." : "Unenroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;

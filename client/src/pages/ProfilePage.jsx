import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api.js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function StatCard({ icon, label, value, color = "text-[var(--accent)]", sub }) {
  return (
    <div className="rounded-2xl p-5 border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-1.5 hover:border-[var(--accent)]/30 transition-all duration-300">
      <span className="text-2xl">{icon}</span>
      <p className={`text-2xl font-black ${color}`}>{value ?? "—"}</p>
      <p className="text-xs font-bold text-[var(--text)] leading-tight">
        {label}
      </p>
      {sub && <p className="text-[11px] text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

function AchievementBadge({ achievement }) {
  return (
    <div
      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300
        ${
          achievement.unlocked
            ? "border-[var(--accent)]/25 bg-[var(--accent)]/6 hover:bg-[var(--accent)]/10"
            : "border-[var(--border)]/30 bg-[var(--surface-elevated)] opacity-45"
        }`}
    >
      <span className={`text-2xl ${!achievement.unlocked ? "grayscale" : ""}`}>
        {achievement.icon}
      </span>
      <div className="min-w-0">
        <p
          className={`text-[13px] font-bold leading-tight ${achievement.unlocked ? "text-[var(--text)]" : "text-[var(--muted)]"}`}
        >
          {achievement.title}
        </p>
        <p className="text-[11px] text-[var(--muted)] leading-snug mt-0.5">
          {achievement.description}
        </p>
      </div>
      {achievement.unlocked && (
        <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="text-emerald-400"
          >
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
          </svg>
        </span>
      )}
    </div>
  );
}

function ProgressBar({
  value,
  max,
  color = "from-[var(--accent)] to-[var(--accent)]",
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[var(--border)]/20 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-black text-[var(--muted)] w-9 text-right shrink-0">
        {pct}%
      </span>
    </div>
  );
}

// ── Chart tooltip style ───────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    padding: "8px 12px",
    fontSize: 11,
  },
  labelStyle: { color: "var(--muted)", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "var(--text)" },
  cursor: { stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 },
};

// ── Performance score trends chart ────────────────────────────────────────────
function PerformanceChart({ submissionHistory, quizHistory }) {
  const data = [
    ...submissionHistory.map((s) => ({
      ts: new Date(s.date).getTime(),
      label: new Date(s.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      assignment: s.scorePercent,
      quiz: null,
    })),
    ...quizHistory.map((r) => ({
      ts: new Date(r.date).getTime(),
      label: new Date(r.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      assignment: null,
      quiz: r.scorePercent,
    })),
  ].sort((a, b) => a.ts - b.ts);

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
        <span className="text-lg">📈</span>
        <h3 className="text-sm font-bold text-[var(--text)]">Score Trends</h3>
        <div className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            Assignments
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
            Quizzes
          </span>
        </div>
      </div>
      <div className="px-2 pt-4 pb-3">
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradAssign" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradQuiz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(val, name) =>
                val !== null ? [`${val}%`, name] : [null, name]
              }
            />
            <Area
              type="monotone"
              dataKey="assignment"
              name="Assignment"
              stroke="#10b981"
              fill="url(#gradAssign)"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#10b981", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="quiz"
              name="Quiz"
              stroke="#a855f7"
              fill="url(#gradQuiz)"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#a855f7", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#a855f7", strokeWidth: 0 }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Course progress bar chart ─────────────────────────────────────────────────
function CourseProgressChart({ courses }) {
  if (courses.length === 0) return null;

  const data = courses.slice(0, 8).map((c) => ({
    name: c.title.length > 22 ? c.title.slice(0, 20) + "…" : c.title,
    progress: c.progress,
  }));

  const getColor = (v) =>
    v >= 75 ? "#10b981" : v >= 40 ? "#f59e0b" : "#818cf8";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
        <span className="text-lg">📊</span>
        <h3 className="text-sm font-bold text-[var(--text)]">
          Course Completion
        </h3>
      </div>
      <div className="px-2 pt-4 pb-3">
        <ResponsiveContainer
          width="100%"
          height={Math.max(140, data.length * 46)}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--text)" }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(val) => [`${val}%`, "Completion"]}
            />
            <Bar dataKey="progress" radius={[0, 5, 5, 0]} maxBarSize={18}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={getColor(entry.progress)}
                  fillOpacity={0.88}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2">
          {[
            ["#10b981", "≥75%"],
            ["#f59e0b", "40–74%"],
            ["#818cf8", "<40%"],
          ].map(([color, label]) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]"
            >
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: color }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Student profile view ──────────────────────────────────────────────────────
function StudentProfile({ profile }) {
  const {
    stats,
    courses,
    recentSubmissions,
    recentQuizzes,
    achievements,
    submissionHistory = [],
    quizHistory = [],
  } = profile;
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const hasChartData = submissionHistory.length > 0 || quizHistory.length > 0;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon="📚"
          label="Courses Enrolled"
          value={stats.coursesEnrolled}
          color="text-blue-400"
        />
        <StatCard
          icon="📝"
          label="Submitted"
          value={stats.assignmentsSubmitted}
          color="text-amber-400"
          sub={`${stats.pendingAssignments} pending`}
        />
        <StatCard
          icon="🧠"
          label="Quizzes Done"
          value={stats.quizzesCompleted}
          color="text-pink-400"
        />
        <StatCard
          icon="⭐"
          label="Avg Score"
          color="text-emerald-400"
          value={
            stats.avgAssignmentScore !== null
              ? `${stats.avgAssignmentScore}%`
              : "—"
          }
          sub="assignments"
        />
        <StatCard
          icon="🎯"
          label="Quiz Avg"
          color="text-purple-400"
          value={stats.avgQuizScore !== null ? `${stats.avgQuizScore}%` : "—"}
          sub="quizzes"
        />
        <StatCard
          icon="✅"
          label="Materials"
          color="text-teal-400"
          value={`${stats.materialsCompleted}/${stats.totalMaterials}`}
          sub="completed"
        />
      </div>

      {/* Charts section */}
      {hasChartData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <PerformanceChart
              submissionHistory={submissionHistory}
              quizHistory={quizHistory}
            />
          </div>
          <div>
            <CourseProgressChart courses={courses} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <span className="text-lg">📚</span>
              <h3 className="text-sm font-bold text-[var(--text)]">
                Enrolled Courses
              </h3>
              <span className="ml-auto text-xs font-black text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-lg">
                {courses.length}
              </span>
            </div>
            {courses.length === 0 ? (
              <p className="text-sm text-[var(--muted)] text-center py-10">
                Not enrolled in any courses yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]/20">
                {courses.map((c) => (
                  <Link
                    key={c.id}
                    to={`/course/${c.id}/materials`}
                    className="flex flex-col gap-2.5 px-5 py-4 hover:bg-[var(--accent)]/4 transition-colors duration-200 no-underline"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[var(--text)] truncate">
                          {c.title}
                        </p>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">
                          {c.teacher?.name && `by ${c.teacher.name}`}
                          {c.subject && ` · ${c.subject}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 text-[11px] text-[var(--muted)]">
                        <span className="font-bold text-[var(--accent)]">
                          {c.progress}%
                        </span>
                        <span>
                          {c.assignmentProgress.submitted}/
                          {c.assignmentProgress.total} tasks
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={c.progress}
                      max={100}
                      color="from-emerald-500 to-teal-400"
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          {recentSubmissions.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
                <span className="text-lg">📋</span>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Recent Submissions
                </h3>
              </div>
              <div className="divide-y divide-[var(--border)]/20">
                {recentSubmissions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <span className="text-base">
                      {s.status === "graded"
                        ? "✅"
                        : s.status === "late"
                          ? "⏰"
                          : "📤"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                        {s.assignmentOrder != null
                          ? `#${s.assignmentOrder} `
                          : ""}
                        {s.assignmentTitle}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {new Date(s.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {s.status === "graded" && s.score !== null && (
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl border
                        ${
                          Math.round((s.score / s.maxScore) * 100) >= 70
                            ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/12 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {s.score}/{s.maxScore}
                      </span>
                    )}
                    {s.status !== "graded" && (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border
                        ${
                          s.status === "late"
                            ? "bg-red-500/10 text-red-400 border-red-500/15"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/15"
                        }`}
                      >
                        {s.status === "late" ? "Late" : "Submitted"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Quizzes */}
          {recentQuizzes.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
                <span className="text-lg">🧠</span>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Recent Quizzes
                </h3>
              </div>
              <div className="divide-y divide-[var(--border)]/20">
                {recentQuizzes.map((r) => {
                  const pct =
                    r.totalPoints > 0
                      ? Math.round((r.score / r.totalPoints) * 100)
                      : 0;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <span className="text-base">🧠</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                          {r.quizTitle}
                        </p>
                        <p className="text-[11px] text-[var(--muted)]">
                          {new Date(r.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl border
                        ${
                          pct >= 70
                            ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/20"
                            : pct >= 40
                              ? "bg-amber-500/12 text-amber-400 border-amber-500/20"
                              : "bg-red-500/12 text-red-400 border-red-500/20"
                        }`}
                      >
                        {r.score}/{r.totalPoints} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden self-start">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <span className="text-lg">🏆</span>
            <h3 className="text-sm font-bold text-[var(--text)]">
              Achievements
            </h3>
            <span className="ml-auto text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
              {unlocked}/{achievements.length}
            </span>
          </div>
          <div className="p-3 space-y-2">
            {achievements.map((a) => (
              <AchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Teacher profile view ──────────────────────────────────────────────────────
function TeacherProfile({ profile }) {
  const { stats, courses, recentActivity, achievements } = profile;
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon="📚"
          label="Courses Created"
          value={stats.totalCourses}
          color="text-blue-400"
        />
        <StatCard
          icon="👥"
          label="Total Students"
          value={stats.totalStudents}
          color="text-emerald-400"
        />
        <StatCard
          icon="📋"
          label="Assignments"
          value={stats.totalAssignments}
          color="text-amber-400"
        />
        <StatCard
          icon="🧠"
          label="Quizzes"
          value={stats.totalQuizzes}
          color="text-pink-400"
        />
        <StatCard
          icon="📹"
          label="Live Classes"
          value={stats.totalLiveClasses}
          color="text-red-400"
        />
        <StatCard
          icon="✅"
          label="Graded"
          value={stats.gradedCount}
          color="text-teal-400"
          sub={`${stats.pendingReviews} pending`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Courses */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <span className="text-lg">📚</span>
              <h3 className="text-sm font-bold text-[var(--text)]">
                Your Courses
              </h3>
              <span className="ml-auto text-xs font-black text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-lg">
                {courses.length}
              </span>
            </div>
            {courses.length === 0 ? (
              <p className="text-sm text-[var(--muted)] text-center py-10">
                No courses created yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]/20">
                {courses.map((c) => (
                  <Link
                    key={c.id}
                    to={`/course/${c.id}/materials`}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-[var(--accent)]/4 transition-colors duration-200 no-underline"
                  >
                    <div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5
                                    border border-[var(--accent)]/15 flex items-center justify-center text-sm font-black text-[var(--accent)] shrink-0"
                    >
                      {c.title[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[var(--text)] truncate">
                        {c.title}
                      </p>
                      {c.subject && (
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">
                          {c.subject}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2.5 mt-2">
                        {[
                          {
                            icon: "👥",
                            val: c.enrollmentCount,
                            label: "students",
                          },
                          {
                            icon: "📋",
                            val: c.assignmentCount,
                            label: "tasks",
                          },
                          { icon: "🧠", val: c.quizCount, label: "quizzes" },
                          { icon: "📹", val: c.liveClassCount, label: "live" },
                        ].map((s) => (
                          <span
                            key={s.label}
                            className="flex items-center gap-1 text-[11px] text-[var(--muted)]"
                          >
                            <span>{s.icon}</span>
                            <span className="font-bold text-[var(--text)]">
                              {s.val}
                            </span>
                            <span>{s.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-[var(--muted)] shrink-0 mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent student activity */}
          {recentActivity.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
                <span className="text-lg">📥</span>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Recent Student Submissions
                </h3>
              </div>
              <div className="divide-y divide-[var(--border)]/20">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5
                                    border border-[var(--accent)]/15 flex items-center justify-center text-xs font-black text-[var(--accent)] shrink-0"
                    >
                      {a.student?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text)]">
                        <span className="text-[var(--accent)]">
                          {a.student?.name ?? "Student"}
                        </span>
                        {" submitted "}
                        <span className="font-bold">"{a.assignmentTitle}"</span>
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {new Date(a.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {a.status === "late" && (
                          <span className="ml-2 text-red-400 font-bold">
                            Late
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border shrink-0
                      ${
                        a.status === "graded"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                          : a.status === "late"
                            ? "bg-red-500/10 text-red-400 border-red-500/15"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/15"
                      }`}
                    >
                      {a.status === "graded"
                        ? "Graded"
                        : a.status === "late"
                          ? "Late"
                          : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden self-start">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <span className="text-lg">🏆</span>
            <h3 className="text-sm font-bold text-[var(--text)]">
              Achievements
            </h3>
            <span className="ml-auto text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
              {unlocked}/{achievements.length}
            </span>
          </div>
          <div className="p-3 space-y-2">
            {achievements.map((a) => (
              <AchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ProfilePage ──────────────────────────────────────────────────────────
function ProfilePage() {
  const { userId } = useParams();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const targetId = userId || authUser.id;
  const isOwnProfile = targetId === authUser.id;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    apiFetch(`/api/profile/${targetId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setProfile(d);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [targetId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
        <Navbar showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl glass border border-[var(--border)]/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-[var(--muted)] font-semibold">
              Loading profile...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
        <Navbar showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 font-semibold mb-4">
              {error || "Profile not found."}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { user: profileUser } = profile;
  const joinYear = new Date(profileUser.joinedAt).getFullYear();
  const joinMonth = new Date(profileUser.joinedAt).toLocaleDateString("en-US", {
    month: "long",
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col transition-colors duration-300">
      <Navbar showBack />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile Hero */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-[var(--accent)]/30 via-[var(--accent)]/15 to-transparent" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-2xl border-4 border-[var(--surface)] bg-gradient-to-br
                              from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_60%,#ec4899)]
                              flex items-center justify-center text-3xl font-black text-[var(--accent-contrast)]
                              shadow-[0_8px_32px_-8px_var(--accent)] shrink-0"
              >
                {profileUser.avatar ? (
                  <img
                    src={profileUser.avatar}
                    alt={profileUser.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  profileUser.name?.[0]?.toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-extrabold text-[var(--text)]">
                    {profileUser.name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider
                    ${
                      profileUser.role === "teacher"
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                        : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {profileUser.role}
                  </span>
                  {profileUser.isVerified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/12 text-emerald-400 border border-emerald-500/20">
                      ✓ Verified
                    </span>
                  )}
                  {isOwnProfile && (
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/20">
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {profileUser.email}
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Joined {joinMonth} {joinYear}
                </p>
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => navigate("/")}
                  className="px-5 py-2.5 sc-btn-glow rounded-xl text-sm font-bold cursor-pointer active:scale-95 shrink-0"
                >
                  Dashboard →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Role-specific content */}
        {profileUser.role === "teacher" ? (
          <TeacherProfile profile={profile} />
        ) : (
          <StudentProfile profile={profile} />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default ProfilePage;

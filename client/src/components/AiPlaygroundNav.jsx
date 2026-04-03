import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "quiz", label: "Quiz Generator", icon: "📝" },
  { id: "summarize", label: "Summarize", icon: "📋" },
  { id: "feedback", label: "Feedback", icon: "✅" },
  { id: "study-plan", label: "Study Plan", icon: "📅" },
  { id: "explain", label: "Explain", icon: "💡" },
  { id: "performance", label: "Performance", icon: "📊" },
  { id: "course-outline", label: "Course Outline", icon: "🎓" },
  { id: "agent", label: "Agent", icon: "🤖" },
];

export default function AiPlaygroundNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = pathname.split("/").pop() || "chat";

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = tab.id === current;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate(`/ai-playground/${tab.id}`)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              active
                ? "bg-[var(--accent)] text-white shadow-lg"
                : "glass border border-[var(--border)]/40 text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

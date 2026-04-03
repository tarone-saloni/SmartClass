import { useTheme } from "../../context/ThemeContext";

function BackgroundBlur() {
  const { themeName } = useTheme();
  const isDark = themeName === "dark";
  const isCosmic = themeName === "custom";

  const gradientClass = isDark
    ? "from-emerald-950/20 via-transparent to-slate-900/20"
    : isCosmic
      ? "from-violet-950/30 via-transparent to-purple-950/20"
      : "from-emerald-50/50 via-transparent to-emerald-100/30";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />

      {/* Animated accent orbs */}
      <div
        className="bg-orb absolute -left-24 -top-28 w-[420px] h-[420px] rounded-full
                   bg-[var(--accent)]/10 blur-[110px]"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="bg-orb absolute right-[-6rem] bottom-[-8rem] w-[520px] h-[520px] rounded-full
                   bg-[var(--accent)]/10 blur-[130px]"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="bg-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[320px] h-[320px] rounded-full bg-[var(--accent)]/5 blur-[90px]"
        style={{ animationDelay: "-3s" }}
      />
    </div>
  );
}

export default BackgroundBlur;

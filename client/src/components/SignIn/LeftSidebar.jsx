import { useNavigate } from "react-router-dom";

function LeftSidebar() {
  const navigate = useNavigate();

  return (
    <div
      className="lg:w-[42%] flex flex-col items-center justify-between p-10 lg:p-12
                 text-white relative overflow-hidden min-h-[260px] lg:min-h-0
                 animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]
                 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800"
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-14 -right-14 w-56 h-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-white/[0.07]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-white/[0.04]" />

      {/* Brand header */}
      <div className="flex items-center gap-3 self-start relative z-10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
          <span className="text-base leading-none">🎓</span>
        </div>
        <span className="text-base font-extrabold tracking-tight">
          SmartClass
        </span>
      </div>

      {/* Main greeting */}
      <div className="flex flex-col items-center text-center relative z-10 py-8 lg:py-0">
        <h2 className="text-4xl lg:text-5xl font-extrabold sc-title leading-tight mb-4">
          Hey There!
        </h2>
        <p className="text-white/75 font-medium max-w-[240px] leading-relaxed text-sm lg:text-base">
          Welcome back — your learning journey continues here.
        </p>
      </div>

      {/* Sign Up CTA */}
      <div className="flex flex-col items-center gap-3 relative z-10">
        <p className="text-white/55 text-sm font-medium">New to SmartClass?</p>
        <button
          onClick={() => navigate("/signup")}
          className="px-9 py-2.5 rounded-full border-2 border-white/50 text-white text-sm font-bold
                     hover:bg-white/15 hover:border-white/80 active:scale-95
                     transition-all duration-300 cursor-pointer"
        >
          Create an account
        </button>
      </div>
    </div>
  );
}

export default LeftSidebar;

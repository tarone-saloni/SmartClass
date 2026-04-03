function BackgroundBlur() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="bg-orb absolute -left-20 -top-24 w-[400px] h-[400px] rounded-full bg-[var(--accent)]/15 blur-[100px]"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="bg-orb absolute right-[-5rem] bottom-[-7rem] w-[500px] h-[500px] rounded-full bg-[var(--accent)]/10 blur-[120px]"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="bg-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-purple-500/8 blur-[80px]"
        style={{ animationDelay: "-3s" }}
      />
    </div>
  );
}

export default BackgroundBlur;

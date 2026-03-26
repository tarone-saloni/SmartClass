function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div className="text-sm text-red-500 bg-red-500/8 border border-red-500/20 px-4 py-3 rounded-xl mb-4
                    animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both] flex items-center gap-2 font-medium">
      <span>⚠️</span>
      {error}
    </div>
  );
}

export default ErrorMessage;
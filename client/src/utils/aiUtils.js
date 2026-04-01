export const AI_BASE = "/api/ai";

export const inp =
  "w-full px-4 py-3 border border-[var(--border)]/50 rounded-xl text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all duration-300 glass text-[var(--text)] placeholder:text-[var(--muted)]/50 hover:border-[var(--accent)]/30";

export const lbl =
  "block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5";

export async function post(path, body) {
  const res = await fetch(`${AI_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

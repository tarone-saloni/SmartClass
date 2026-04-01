import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function SendBtn({ loading, label = "Send" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Thinking…
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function MarkdownText({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-[var(--text)] mt-4 mb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-[var(--text)] mt-4 mb-1">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-bold text-[var(--accent)] mt-3 mb-1">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-[var(--text)] mt-2 mb-1">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-[var(--text)] mb-2">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--text)]">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-[var(--muted)]">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="list-none space-y-1 my-2 pl-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-2 pl-2 text-sm text-[var(--text)]">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-[var(--text)] flex gap-2 items-start">
            <span className="text-[var(--accent)] mt-0.5 shrink-0">•</span>
            <span>{children}</span>
          </li>
        ),
        code: ({ className, children }) =>
          className ? (
            <code
              className={`text-xs font-mono text-[var(--text)] leading-relaxed whitespace-pre-wrap ${className}`}
            >
              {children}
            </code>
          ) : (
            <code className="px-1.5 py-0.5 rounded bg-[var(--border)]/30 text-[var(--accent)] text-xs font-mono">
              {children}
            </code>
          ),
        pre: ({ children }) => (
          <pre className="my-3 p-4 rounded-xl bg-[var(--border)]/20 border border-[var(--border)]/40 overflow-x-auto text-xs font-mono leading-relaxed">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-2 pl-4 border-l-4 border-[var(--accent)]/50 text-[var(--muted)] italic text-sm">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[var(--border)]/20">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider border border-[var(--border)]/30">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm text-[var(--text)] border border-[var(--border)]/20">
            {children}
          </td>
        ),
        hr: () => <hr className="my-4 border-[var(--border)]/30" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function ResponseRenderer({ data }) {
  if (data.questions && Array.isArray(data.questions)) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
          {data.count} questions · {data.topic} · {data.difficulty}
        </p>
        {data.questions.map((q, i) => (
          <div
            key={i}
            className="border border-[var(--border)]/40 rounded-xl p-4 space-y-3"
          >
            <p className="font-semibold text-sm text-[var(--text)]">
              <span className="text-[var(--accent)] mr-2">Q{i + 1}.</span>
              {q.question}
            </p>
            <ul className="space-y-1.5">
              {q.options.map((opt, j) => (
                <li
                  key={j}
                  className={`text-sm px-3 py-1.5 rounded-lg ${
                    j === q.correct_answer
                      ? "bg-green-500/15 text-green-400 font-semibold border border-green-500/30"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {String.fromCharCode(65 + j)}. {opt}
                </li>
              ))}
            </ul>
            {q.explanation && (
              <p className="text-xs text-[var(--muted)] bg-[var(--border)]/10 rounded-lg px-3 py-2">
                💡 {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (data.tools_used !== undefined) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {data.tools_used.map((t, i) => (
            <span
              key={i}
              className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                t.success
                  ? "border-green-500/30 text-green-400 bg-green-500/10"
                  : "border-red-400/30 text-red-400 bg-red-500/10"
              }`}
            >
              {t.success ? "✓" : "✗"} {t.tool}
            </span>
          ))}
          <span className="text-xs px-3 py-1 rounded-full border border-[var(--border)]/40 text-[var(--muted)]">
            {data.iterations} iteration{data.iterations !== 1 ? "s" : ""}
          </span>
        </div>
        <MarkdownText text={data.response} />
      </div>
    );
  }

  const textKey =
    data.response ||
    data.feedback ||
    data.summary ||
    data.explanation ||
    data.study_plan ||
    data.analysis ||
    data.outline;
  if (textKey) return <MarkdownText text={textKey} />;

  return (
    <pre className="text-xs text-[var(--text)] whitespace-pre-wrap font-mono leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function ResponseBox({ data, error }) {
  if (error)
    return (
      <div className="mt-4 p-4 rounded-xl border border-red-400/40 bg-red-500/10 text-red-400 text-sm font-mono">
        Error: {error}
      </div>
    );
  if (!data) return null;
  return (
    <div className="mt-4 glass rounded-2xl border border-[var(--border)]/40 overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border)]/30 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
          Response
        </span>
      </div>
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        <ResponseRenderer data={data} />
      </div>
    </div>
  );
}

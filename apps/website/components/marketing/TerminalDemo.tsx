export function TerminalDemo() {
  return (
    <div className="rounded-2xl border border-border bg-[#0b1220] p-1 shadow-2xl shadow-primary/10">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-xs text-slate-400">
          agent-inspect · local terminal
        </span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-slate-200 sm:text-sm">
        <code>
          <span className="text-slate-500">$ </span>
          <span>npx agent-inspect init --yes</span>
          {"\n"}
          <span className="text-success">✓</span>
          <span> created agent-inspect.config.ts</span>
          {"\n"}
          <span className="text-success">✓</span>
          <span> created examples/agent-inspect-demo.mjs</span>
          {"\n\n"}
          <span className="text-slate-500">$ </span>
          <span>node examples/agent-inspect-demo.mjs</span>
          {"\n"}
          <span className="text-success">✓</span>
          <span> wrote .agent-inspect/run_….jsonl</span>
          {"\n\n"}
          <span className="text-slate-500">$ </span>
          <span>npx agent-inspect list --dir .agent-inspect</span>
          {"\n"}
          <span className="text-indigo-300">run_abc123</span>
          <span>  ok  42ms</span>
          {"\n\n"}
          <span className="text-slate-500">$ </span>
          <span>npx agent-inspect check run_abc123 --dir .agent-inspect</span>
          {"\n"}
          <span className="text-success">✓</span>
          <span> checks passed</span>
          {"\n\n"}
          <span className="text-slate-500">$ </span>
          <span>npx agent-inspect bundle run_abc123 --dir .agent-inspect --profile share</span>
          {"\n"}
          <span className="text-success">✓</span>
          <span> share-safe bundle written</span>
          {"\n\n"}
          <span className="text-slate-500">$ </span>
          <span>npx agent-inspect verify-safe run_abc123 --dir .agent-inspect</span>
          {"\n"}
          <span className="text-success">✓</span>
          <span> SAFE (best-effort)</span>
        </code>
      </pre>
    </div>
  );
}

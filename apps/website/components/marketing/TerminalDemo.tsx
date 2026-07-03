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
          <span>npx agent-inspect init --framework ai-sdk</span>
          {"\n"}
          <span className="text-success">✓</span>
          <span> created agent-inspect.config.ts</span>
          {"\n"}
          <span className="text-success">✓</span>
          <span> wrote .agent-inspect/demo-support-agent.jsonl</span>
          {"\n\n"}
          <span className="text-slate-500">$ </span>
          <span>npx agent-inspect view demo-support-agent</span>
          {"\n"}
          <span className="text-indigo-300">support-agent</span>
          <span> 1.8s </span>
          <span className="text-success">✓</span>
          {"\n"}
          <span className="text-slate-500">├─ </span>
          <span>classify intent 120ms </span>
          <span className="text-success">✓</span>
          {"\n"}
          <span className="text-slate-500">├─ </span>
          <span>search knowledge base 740ms </span>
          <span className="text-success">✓</span>
          {"\n"}
          <span className="text-slate-500">├─ </span>
          <span>draft response 890ms </span>
          <span className="text-success">✓</span>
          {"\n"}
          <span className="text-slate-500">└─ </span>
          <span>verify-safe 40ms </span>
          <span className="text-success">✓</span>
        </code>
      </pre>
    </div>
  );
}

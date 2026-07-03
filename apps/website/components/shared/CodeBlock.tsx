import { clsx } from "clsx";

import { CopyButton } from "./CopyButton";

type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
};

export function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
}: CodeBlockProps) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-xl border border-border bg-[#0b1220] shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono uppercase tracking-wide">{language}</span>
          {filename ? <span className="text-slate-500">· {filename}</span> : null}
        </div>
        <CopyButton value={code} className="border-white/10 bg-white/5 text-slate-200" />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-100">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

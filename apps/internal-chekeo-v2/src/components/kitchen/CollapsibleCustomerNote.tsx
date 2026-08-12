import { useState } from 'react';

interface CollapsibleCustomerNoteProps {
  note: string;
  className?: string;
}

export function CollapsibleCustomerNote({ note, className = "" }: CollapsibleCustomerNoteProps) {
  const [expanded, setExpanded] = useState(false);
  if (!note || !note.trim()) return null;

  return (
    <div className={`mb-3 space-y-1 font-sans ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
        aria-expanded={expanded}
      >
        <span>📝 Nota del cliente</span>
        <span className="text-[10px] opacity-70">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed transition-all">
          {note}
        </div>
      )}
    </div>
  );
}

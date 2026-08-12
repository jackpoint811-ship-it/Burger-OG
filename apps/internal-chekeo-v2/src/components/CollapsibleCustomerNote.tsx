import { useState } from "react";

interface CollapsibleCustomerNoteProps {
  note?: string | null;
  label?: string;
  className?: string;
}

export function CollapsibleCustomerNote({
  note,
  label = "📝 Nota del cliente",
  className = "",
}: CollapsibleCustomerNoteProps) {
  const [expanded, setExpanded] = useState(false);

  if (!note || !note.trim()) return null;

  return (
    <div className={`mt-2 space-y-1 font-sans ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
      >
        <span>{label}</span>
        <span className="text-[10px] opacity-80">{expanded ? "▲ Plegar" : "▼ Desplegar"}</span>
      </button>

      {expanded && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed transition-all">
          {note}
        </div>
      )}
    </div>
  );
}

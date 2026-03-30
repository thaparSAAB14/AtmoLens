"use client";

import { useTransition, useState, useEffect } from "react";
import { addNote, fetchNotes } from "@/app/actions/notes";
import { timeAgo } from "@/lib/utils";
import { Send, FileText } from "lucide-react";

export function Notebook() {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch
    fetchNotes().then(setNotes);
  }, []);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      await addNote(formData);
      const updatedNotes = await fetchNotes();
      setNotes(updatedNotes);
    });
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4 glow-md">
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <FileText size={18} className="text-[var(--accent)]" />
        <h3 className="text-[var(--text-secondary)] font-label text-sm uppercase tracking-widest">
          Meteorologist&apos;s Notebook
        </h3>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
        {notes.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm italic">No observational logs active.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="bg-[var(--surface-container)] p-3 rounded-lg text-sm border-l-2 border-[var(--accent)]">
              <p className="text-[var(--text-primary)]">{n.note}</p>
              <span className="text-[var(--text-muted)] text-xs mt-1 block">
                {timeAgo(String(n.created_at))}
              </span>
            </div>
          ))
        )}
      </div>

      <form action={handleSubmit} className="relative mt-4">
        <input
          type="text"
          name="note"
          placeholder="Log atmospheric conditions..."
          className="w-full bg-[var(--surface-container-high)] text-[var(--text-primary)] text-sm rounded-xl py-3 pl-4 pr-12 outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-shadow"
          disabled={isPending}
          required
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Sparkles, Plus, Brain, RefreshCw, FileText, PanelLeftClose } from "lucide-react";
import { fetchMemories, fetchDocuments } from "../api/chatApi";

const CATEGORY_COLORS = {
  personal: "text-sky-300 bg-sky-500/10",
  skill: "text-emerald-300 bg-emerald-500/10",
  preference: "text-amber-300 bg-amber-500/10",
  goal: "text-purple-300 bg-purple-500/10",
  general: "text-slate-300 bg-slate-600/20",
};

export default function Sidebar({ onNewChat, refreshKey, isOpen, onClose, onToggle, isMobile }) {
  const [memories, setMemories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [memData, docData] = await Promise.all([
        fetchMemories(),
        fetchDocuments().catch(() => ({ documents: [] })),
      ]);
      setMemories(memData.memories || []);
      setDocuments(docData.documents || []);
    } catch {
      setMemories([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const sidebarContent = (
    <>
      {/* Header: Brand + collapse toggle */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">Context Chat</p>
            <p className="text-[11px] text-slate-500">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          title="Close sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 pb-1">
        <button
          onClick={() => { onNewChat(); if (isMobile) onClose(); }}
          className="flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 transition hover:border-indigo-500/50 hover:bg-slate-800"
        >
          <Plus size={16} /> New chat
        </button>
      </div>

      {/* Uploaded documents */}
      {documents.length > 0 && (
        <>
          <div className="mt-4 flex items-center gap-2 px-4 text-xs font-medium uppercase tracking-wide text-slate-400">
            <FileText size={14} /> Documents
          </div>
          <div className="mt-2 space-y-1.5 px-3">
            {documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/30 px-2.5 py-2"
              >
                <FileText size={14} className="shrink-0 text-indigo-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">
                    {doc.filename}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {doc.chunks} chunks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Memories panel */}
      <div className="mt-4 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          <Brain size={14} /> Long-term memory
        </div>
        <button
          onClick={load}
          title="Refresh"
          className="text-slate-500 transition hover:text-slate-300"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="mt-2 flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {memories.length === 0 && !loading && (
          <p className="px-1 py-3 text-xs text-slate-600">
            Nothing remembered yet. Tell the assistant something about yourself.
          </p>
        )}
        {memories.map((m) => {
          const color = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.general;
          return (
            <div
              key={m.id}
              className="rounded-lg border border-slate-800 bg-slate-800/30 p-2.5"
            >
              <span
                className={`mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${color}`}
              >
                {m.category}
              </span>
              <p className="text-xs leading-snug text-slate-300">{m.text}</p>
            </div>
          );
        })}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile: overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={onClose}
        />
        <aside
          className={`fixed left-0 top-0 z-50 flex w-72 flex-col bg-slate-900 transition-transform duration-300 ease-in-out app-shell ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-900/60 transition-[width] duration-300 ease-in-out"
      style={{ width: isOpen ? "18rem" : "0rem" }}
    >
      <div className="flex h-full w-72 flex-col">
        {sidebarContent}
      </div>
    </aside>
  );
}

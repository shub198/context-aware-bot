import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import MessageBubble from "./MessageBubble";
import SystemBanner from "./SystemBanner";
import ToolIndicator from "./ToolIndicator";

const SUGGESTIONS = [
  "My name is Rachit and I'm a backend developer.",
  "What do you know about me?",
  "Suggest a weekend project based on my skills.",
];

function EmptyState({ onPick }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
        <Sparkles size={26} className="text-white" />
      </div>
      <h2 className="text-xl font-semibold text-slate-100">
        Context-Aware Chatbot
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        I remember what you tell me and can answer questions about documents you
        upload. Try one of these to start:
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs text-slate-300 transition hover:border-indigo-500/60 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isStreaming, currentTool, onPick }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentTool]);

  if (messages.length === 0) {
    return <EmptyState onPick={onPick} />;
  }

  const lastId = messages[messages.length - 1]?.id;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      {messages.map((m) =>
        m.role === "system" ? (
          <SystemBanner key={m.id} content={m.content} type={m.type} />
        ) : (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            isStreaming={isStreaming && m.id === lastId && m.role === "assistant"}
          />
        )
      )}
      {currentTool && (
        <div className="pl-11">
          <ToolIndicator tool={currentTool} />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

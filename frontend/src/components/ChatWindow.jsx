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
    <div className="flex h-full flex-col items-center justify-center px-4 text-center sm:px-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 sm:h-14 sm:w-14">
        <Sparkles size={22} className="text-white sm:hidden" />
        <Sparkles size={26} className="hidden text-white sm:block" />
      </div>
      <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">
        Context-Aware Chatbot
      </h2>
      <p className="mt-2 max-w-md text-xs text-slate-400 sm:text-sm">
        I remember what you tell me and can answer questions about documents you
        upload. Try one of these to start:
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:justify-center">
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-6">
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

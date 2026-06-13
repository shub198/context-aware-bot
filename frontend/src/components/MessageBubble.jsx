import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { User, Sparkles } from "lucide-react";

function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || "");
  if (inline || !match) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
  return (
    <SyntaxHighlighter
      style={oneDark}
      language={match[1]}
      PreTag="div"
      customStyle={{ margin: 0, borderRadius: "0.6rem", fontSize: "0.85rem" }}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-indigo-400" />
      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-indigo-400 [animation-delay:0.2s]" />
      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-indigo-400 [animation-delay:0.4s]" />
    </span>
  );
}

export default function MessageBubble({ role, content, isStreaming }) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full animate-fade-in gap-3 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-purple-600"
            : "border border-slate-700 bg-slate-800"
        }`}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Sparkles size={16} className="text-indigo-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[75%] sm:px-4 sm:py-2.5 ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
            : "border border-slate-700/70 bg-slate-800/60 text-slate-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="markdown">
            {!content && isStreaming ? (
              <TypingDots />
            ) : (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{ code: CodeBlock }}
                >
                  {content || ""}
                </ReactMarkdown>
                {isStreaming && content && (
                  <span className="ml-0.5 inline-block h-4 w-[2px] animate-blink bg-indigo-400 align-text-bottom" />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

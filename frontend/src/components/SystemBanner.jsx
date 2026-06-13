import { FileText, CheckCircle2, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BANNER_STYLES = {
  upload: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    icon: <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />,
    accent: "text-emerald-300",
  },
  error: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    icon: <Info size={16} className="shrink-0 text-rose-400" />,
    accent: "text-rose-300",
  },
  default: {
    border: "border-slate-700/50",
    bg: "bg-slate-800/30",
    icon: <Info size={16} className="shrink-0 text-slate-400" />,
    accent: "text-slate-300",
  },
};

export default function SystemBanner({ content, type = "default" }) {
  const style = BANNER_STYLES[type] || BANNER_STYLES.default;

  return (
    <div
      className={`animate-fade-in mx-auto flex w-full max-w-2xl items-start gap-3 rounded-xl border px-4 py-3 ${style.border} ${style.bg}`}
    >
      <div className="mt-0.5">{style.icon}</div>
      <div className={`text-sm leading-relaxed ${style.accent}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

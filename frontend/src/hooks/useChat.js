import { useState, useRef, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
let nextId = 1;

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const ctrlRef = useRef(null);

  const stop = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
    setIsStreaming(false);
    setCurrentTool(null);
  }, []);

  const addSystemMessage = useCallback((content, meta = {}) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId++, role: "system", content, ...meta },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isStreaming) return;

      const userMsg = { id: nextId++, role: "user", content: text };
      const assistantMsg = { id: nextId++, role: "assistant", content: "" };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      setCurrentTool(null);

      const ctrl = new AbortController();
      ctrlRef.current = ctrl;

      try {
        await fetchEventSource(`${API_BASE}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
          signal: ctrl.signal,

          onmessage(ev) {
            switch (ev.event) {
              case "tool":
                setCurrentTool(ev.data);
                break;

              case "token":
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + ev.data,
                    };
                  }
                  return updated;
                });
                setCurrentTool(null);
                break;

              case "done":
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant" && !last.content && ev.data) {
                    updated[updated.length - 1] = {
                      ...last,
                      content: ev.data,
                    };
                  }
                  return updated;
                });
                setIsStreaming(false);
                setCurrentTool(null);
                break;

              case "error":
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: `Error: ${ev.data}`,
                    };
                  }
                  return updated;
                });
                setIsStreaming(false);
                setCurrentTool(null);
                break;
            }
          },

          onclose() {
            setIsStreaming(false);
            setCurrentTool(null);
          },

          onerror(err) {
            if (ctrl.signal.aborted) return;
            console.error("SSE error:", err);
            setIsStreaming(false);
            setCurrentTool(null);
            throw err;
          },

          openWhenHidden: true,
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Stream failed:", err);
        setIsStreaming(false);
        setCurrentTool(null);
      }
    },
    [isStreaming]
  );

  return { messages, isStreaming, currentTool, sendMessage, stop, addSystemMessage };
}

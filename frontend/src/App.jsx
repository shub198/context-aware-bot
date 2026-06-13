import { useState, useCallback, useEffect } from "react";
import { PanelLeftOpen } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import FileUpload from "./components/FileUpload";
import { useChat } from "./hooks/useChat";

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

export default function App() {
  const { messages, isStreaming, currentTool, sendMessage, stop, addSystemMessage } =
    useChat();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleSend = (text) => {
    sendMessage(text);
    setTimeout(() => setMemoryRefreshKey((k) => k + 1), 4000);
  };

  const handleNewChat = () => {
    if (isStreaming) stop();
    window.location.reload();
  };

  const handleUploaded = (res) => {
    addSystemMessage(
      `**${res.filename}** uploaded and indexed (${res.chunks} chunks). You can now ask questions about it.`,
      { type: "upload", filename: res.filename, chunks: res.chunks }
    );
    setMemoryRefreshKey((k) => k + 1);
    setTimeout(() => setUploadOpen(false), 800);
  };

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="app-shell flex w-screen overflow-hidden bg-slate-950">
      <Sidebar
        onNewChat={handleNewChat}
        refreshKey={memoryRefreshKey}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Show open-sidebar button when sidebar is collapsed */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            title="Open sidebar"
            className="absolute left-2 top-2 z-30 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

        <div className="flex-1 overflow-y-auto">
          <ChatWindow
            messages={messages}
            isStreaming={isStreaming}
            currentTool={currentTool}
            onPick={handleSend}
          />
        </div>

        <InputBar
          onSend={handleSend}
          onStop={stop}
          isStreaming={isStreaming}
          onOpenUpload={() => setUploadOpen(true)}
        />
      </main>

      <FileUpload
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
    </div>
  );
}

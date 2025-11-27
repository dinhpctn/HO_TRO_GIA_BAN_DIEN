import React, { useState, useCallback, useEffect } from 'react';
import { DocumentSidebar } from './components/DocumentSidebar';
import { ChatArea } from './components/ChatArea';
import { KnowledgeDoc, ChatMessage, AppState } from './types';
import { generateAnswer } from './services/geminiService';
import { Menu, X } from 'lucide-react';

const STORAGE_KEY = 'legal_chat_documents_v1';

const App: React.FC = () => {
  // 1. Lazy initialization: Try to load documents from localStorage on startup
  const [documents, setDocuments] = useState<KnowledgeDoc[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Không thể tải tài liệu từ bộ nhớ:", error);
      return [];
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 2. Persistence effect: Save documents to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch (error) {
      console.error("Lỗi lưu trữ:", error);
      // If quota is exceeded, we might want to alert the user, 
      // but for now we just log it to avoid blocking the UI.
      if (documents.length > 0) {
        alert("Cảnh báo: Bộ nhớ trình duyệt đã đầy. Các tài liệu mới nhất có thể không được lưu lại sau khi tải lại trang.");
      }
    }
  }, [documents]);

  const handleAddDocument = (newDoc: KnowledgeDoc) => {
    setDocuments((prev) => {
      // 3. Smart Update Logic: Check if a document with the same name exists
      const existingIndex = prev.findIndex((d) => d.name === newDoc.name);

      if (existingIndex !== -1) {
        // Update existing document (overwrite content and effective date)
        const updatedDocs = [...prev];
        updatedDocs[existingIndex] = {
          ...newDoc,
          id: prev[existingIndex].id, // Keep the old ID if you want, or use newDoc.id. Here we keep consistency.
          uploadTimestamp: Date.now() // Update upload time
        };
        return updatedDocs;
      } else {
        // Add new document
        return [newDoc, ...prev];
      }
    });
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAppState(AppState.PROCESSING);

    try {
      const answer = await generateAnswer(text, documents, messages);
      
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: answer,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: error.message || "Đã xảy ra lỗi không xác định.",
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setAppState(AppState.IDLE);
    }
  }, [documents, messages]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-800 text-white rounded-md shadow-lg"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar - Conditional on Mobile, Fixed on Desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out h-full shadow-xl md:shadow-none`}
      >
        <DocumentSidebar
          documents={documents}
          onAddDocument={handleAddDocument}
          onRemoveDocument={handleRemoveDocument}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full w-full relative">
        <ChatArea
          messages={messages}
          appState={appState}
          onSendMessage={handleSendMessage}
          hasDocuments={documents.length > 0}
        />
        
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
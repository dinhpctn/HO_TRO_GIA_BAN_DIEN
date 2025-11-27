import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AppState } from '../types';
import { Send, User, Bot, Loader2, AlertTriangle } from 'lucide-react';

interface ChatAreaProps {
  messages: ChatMessage[];
  appState: AppState;
  onSendMessage: (text: string) => void;
  hasDocuments: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  appState,
  onSendMessage,
  hasDocuments,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && appState === AppState.IDLE) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm flex-none">
        <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          Hỏi đáp Pháp lý Thông minh
        </h1>
        <p className="text-sm text-slate-500">
          Câu trả lời được trích xuất trực tiếp từ các tài liệu bạn tải lên.
        </p>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <Bot className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Bắt đầu trò chuyện</p>
            <p className="text-sm">Hãy tải lên tài liệu và đặt câu hỏi.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.isError
                    ? 'bg-red-100 text-red-600'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : msg.isError
                    ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {msg.isError && (
                  <div className="flex items-center gap-2 mb-1 font-bold">
                    <AlertTriangle className="w-4 h-4" /> Lỗi
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {appState === AppState.PROCESSING && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-sm text-slate-500">Đang phân tích các tài liệu...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 flex-none">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              hasDocuments
                ? "Đặt câu hỏi về tài liệu của bạn..."
                : "Vui lòng tải lên ít nhất một tài liệu để bắt đầu..."
            }
            disabled={!hasDocuments || appState === AppState.PROCESSING}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-slate-800"
          />
          <button
            type="submit"
            disabled={!input.trim() || !hasDocuments || appState === AppState.PROCESSING}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        {!hasDocuments && (
          <p className="text-center text-xs text-amber-600 mt-2">
            <AlertTriangle className="inline w-3 h-3 mr-1" />
            Cần tải lên tài liệu để Bot có thể trả lời.
          </p>
        )}
      </div>
    </div>
  );
};

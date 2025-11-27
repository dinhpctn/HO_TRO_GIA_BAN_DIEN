import React, { useState, useRef } from 'react';
import { KnowledgeDoc } from '../types';
import { Upload, Trash2, Calendar, AlertCircle, FileType, CheckCircle, Scale } from 'lucide-react';
import { parseFileContent } from '../utils/fileParser';
import { getLegalRank, getRankName } from '../utils/legalRank';

interface DocumentSidebarProps {
  documents: KnowledgeDoc[];
  onAddDocument: (doc: KnowledgeDoc) => void;
  onRemoveDocument: (id: string) => void;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  documents,
  onAddDocument,
  onRemoveDocument,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadStatus('Đang đọc tài liệu...');
    
    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const textContent = await parseFileContent(file);
        
        if (!textContent.trim()) {
           throw new Error("File trống hoặc không thể trích xuất văn bản.");
        }

        const newDoc: KnowledgeDoc = {
          id: crypto.randomUUID(),
          name: file.name,
          content: textContent,
          effectiveDate: effectiveDate,
          uploadTimestamp: Date.now(),
        };

        onAddDocument(newDoc);
      } catch (error: any) {
        console.error("Lỗi khi đọc file:", file.name, error);
        alert(`Lỗi: Không thể đọc file ${file.name}. ${error.message}`);
      }
    }

    // Reset input and state
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsUploading(false);
    setUploadStatus('');
  };

  // Sort docs for display: 
  // 1. Legal Rank (Low number = High priority)
  // 2. Effective Date (Newest first)
  const displayDocs = [...documents].sort((a, b) => {
    const rankA = getLegalRank(a.name);
    const rankB = getLegalRank(b.name);
    
    if (rankA !== rankB) return rankA - rankB;
    return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
  });

  return (
    <div className="w-full md:w-80 bg-slate-900 text-white flex flex-col h-full border-r border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-400" />
          Kho Tài Liệu
        </h2>
        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
          Sắp xếp ưu tiên: <strong>Thứ bậc pháp lý</strong> (1-15) &gt; <strong>Ngày hiệu lực</strong>.
        </p>
      </div>

      <div className="p-4 bg-slate-800/50">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          1. Ngày hiệu lực văn bản
        </label>
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md leading-5 bg-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <label className="block text-sm font-medium text-slate-300 mb-1">
          2. Chọn tài liệu
        </label>
        <p className="text-[10px] text-slate-400 mb-2">
          Hỗ trợ: PDF, Word (.doc, .docx), Excel, Text
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {isUploading ? (
            <span className="animate-pulse flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-bounce"></span>
              {uploadStatus}
            </span>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Tải lên
            </>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".txt,.md,.json,.csv,.pdf,.docx,.doc,.xlsx,.xls"
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayDocs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có tài liệu nào.</p>
          </div>
        ) : (
          displayDocs.map((doc, index) => {
            const rank = getLegalRank(doc.name);
            return (
              <div 
                key={doc.id} 
                className={`relative group p-3 rounded-lg border border-slate-700 bg-slate-800 hover:border-blue-500/50 transition-all ${index === 0 ? 'ring-1 ring-green-500/30' : ''}`}
              >
                {index === 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-600 text-[10px] px-2 py-0.5 rounded-full text-white font-bold shadow-sm z-10 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Ưu tiên số 1
                  </span>
                )}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 overflow-hidden w-full">
                    <FileType className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <h3 className="font-medium text-slate-200 text-sm truncate" title={doc.name}>
                        {doc.name}
                      </h3>
                      {rank < 99 && (
                        <p className="text-[10px] text-blue-300 font-semibold bg-blue-900/30 inline-block px-1 rounded mt-0.5">
                          {getRankName(rank)} (Bậc {rank})
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveDocument(doc.id)}
                    className="text-slate-500 hover:text-red-400 p-1 -mr-1 flex-shrink-0"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center text-xs text-slate-400 ml-6 mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  HL: <span className="text-slate-200 font-medium ml-1">{doc.effectiveDate}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-500 text-center">
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
};
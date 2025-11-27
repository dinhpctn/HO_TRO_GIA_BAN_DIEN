import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Thiết lập worker cho PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.mjs`;

/**
 * Trích xuất text từ file PDF
 */
const parsePDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n`;
  }
  return fullText;
};

/**
 * Trích xuất text từ file Word (.docx)
 */
const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

/**
 * Trích xuất text từ file Word cũ (.doc)
 * Sử dụng chiến thuật "Best Effort":
 * 1. Thử dùng mammoth (vì đôi khi file .doc thực chất là .docx đổi tên)
 * 2. Nếu lỗi, dùng TextDecoder để trích xuất chuỗi ký tự thô từ binary, lọc bỏ ký tự rác.
 */
const parseLegacyDoc = async (file: File): Promise<string> => {
  try {
    // Cách 1: Thử coi như file docx
    return await parseDocx(file);
  } catch (error) {
    console.warn("Mammoth failed for .doc, attempting raw text extraction", error);
    
    // Cách 2: Trích xuất thô
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Thử decode utf-8
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      
      // Regex lọc: Giữ lại ký tự in được (ASCII), Newline, Tab và Unicode (cho tiếng Việt)
      // Loại bỏ các ký tự điều khiển binary gây nhiễu
      const cleanText = text.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF\u0100-\uFFFF]/g, ' ')
                            .replace(/\s+/g, ' ') // Gộp khoảng trắng thừa
                            .trim();
                            
      if (cleanText.length < 10) {
        throw new Error("Không tìm thấy nội dung văn bản rõ ràng.");
      }
      
      return `[LƯU Ý: Đây là nội dung trích xuất thô từ file .doc cũ]\n${cleanText}`;
    } catch (e: any) {
      throw new Error(`Không hỗ trợ định dạng .doc này. Vui lòng chuyển sang .docx. (${e.message})`);
    }
  }
};

/**
 * Trích xuất text từ Excel (.xlsx, .xls)
 * Chuyển đổi từng sheet thành dạng CSV
 */
const parseExcel = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let fullText = '';

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    fullText += `--- Sheet: ${sheetName} ---\n${csv}\n`;
  });

  return fullText;
};

/**
 * Hàm chính để xử lý file dựa trên extension
 */
export const parseFileContent = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith('.pdf')) {
      return await parsePDF(file);
    } else if (fileName.endsWith('.docx')) {
      return await parseDocx(file);
    } else if (fileName.endsWith('.doc')) {
      return await parseLegacyDoc(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return await parseExcel(file);
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv') || fileName.endsWith('.json')) {
      return await file.text();
    } else {
      throw new Error('Định dạng file không được hỗ trợ. Vui lòng sử dụng PDF, DOCX, DOC, Excel hoặc Text.');
    }
  } catch (error: any) {
    console.error("Error parsing file:", error);
    throw new Error(`Không thể đọc file ${file.name}. Lỗi: ${error.message}`);
  }
};
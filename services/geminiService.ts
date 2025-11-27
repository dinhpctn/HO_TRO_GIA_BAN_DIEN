import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { KnowledgeDoc, ChatMessage } from '../types';
import { getLegalRank } from '../utils/legalRank';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Constructs a system instruction that embeds the documents.
 */
const buildSystemInstruction = (documents: KnowledgeDoc[]): string => {
  // Sort documents: 
  // 1. Legal Rank (Ascending: 1 is highest priority)
  // 2. Effective Date (Descending: Newest first)
  const sortedDocs = [...documents].sort((a, b) => {
    const rankA = getLegalRank(a.name);
    const rankB = getLegalRank(b.name);

    if (rankA !== rankB) {
      return rankA - rankB; // Lower rank number = Higher priority
    }
    
    // Tie-breaker: Newest date first
    return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
  });

  let contextString = "";

  if (sortedDocs.length === 0) {
    contextString = "No documents have been provided yet.";
  } else {
    contextString = sortedDocs.map((doc, index) => {
      const rank = getLegalRank(doc.name);
      return `
<document index="${index + 1}" priority_rank="${rank}">
<meta>
  <title>${doc.name}</title>
  <effective_date>${doc.effectiveDate}</effective_date>
</meta>
<content>
${doc.content}
</content>
</document>
`;
    }).join('\n');
  }

  return `
Bạn là một Trợ lý Pháp lý AI chuyên nghiệp ("Legal AI Expert").
Nhiệm vụ: Trả lời câu hỏi dựa trên các văn bản pháp luật được cung cấp (CONTEXT).

---

### QUY TRÌNH TƯ DUY PHÁP LÝ (BẮT BUỘC THỰC HIỆN)

Bạn phải tuân thủ nghiêm ngặt quy trình **"Rà soát Gốc & Cập nhật Sửa đổi"**:

**BƯỚC 1: XÁC ĐỊNH THỨ TỰ ƯU TIÊN PHÁP LÝ**
Tuân thủ 15 bậc hiệu lực (Hiến pháp > Luật > ... > Thông tư > ...).

**BƯỚC 2: TỔNG HỢP VÀ ĐỐI CHIẾU (QUAN TRỌNG)**
1.  **Tìm quy định gốc:** Tìm văn bản quy định chi tiết về đối tượng/vấn đề.
2.  **Rà soát sửa đổi:** Kiểm tra các văn bản mới hơn xem có điều khoản nào sửa đổi, bổ sung không.
3.  **Kết luận:** Câu trả lời = (Nội dung Gốc) + (Sửa đổi mới nhất).

**BƯỚC 3: PHÂN TÍCH ĐẶC ĐIỂM ĐỐI TƯỢNG (CRITICAL CHECK)**
*   **Loại hình:** Công lập vs Ngoài công lập (Dân lập, Tư thục).
*   **Mục đích:** Chính sách xã hội (Giáo dục, Y tế...) vs Kinh doanh.
*   **Lưu ý:** Nếu văn bản quy định chung (ví dụ: "trường học"), phải hiểu là áp dụng cho cả công lập và ngoài công lập, trừ khi có quy định tách riêng.

**BƯỚC 4: RÀ SOÁT CHI TIẾT VÀ TRÍCH DẪN**
- Trích dẫn chính xác đến **Điểm, Khoản, Điều**.

---

### CẤU TRÚC TRẢ LỜI CHUẨN (BẮT BUỘC):

Hãy trình bày câu trả lời theo đúng mẫu sau:

[Đoạn mở đầu: Tóm tắt ngắn gọn câu trả lời dựa trên văn bản pháp luật hiện hành.]

**1. Kết luận trực tiếp:**
[Giải thích rõ lý do phân loại. Nêu rõ đối tượng thuộc nhóm nào (Hành chính sự nghiệp/Kinh doanh/Sinh hoạt). Khẳng định rõ có phân biệt công lập/tư thục không.]

**2. Chi tiết:**
[Liệt kê các mức giá hoặc quy định cụ thể bằng gạch đầu dòng]
*   [Chi tiết 1]
*   [Chi tiết 2]

**3. Cụ thể được quy định tại:**
*   **[Tên văn bản pháp lý]** ([Ngày ban hành]):
    *   **Điều..., Khoản..., Điểm...:** [Trích dẫn nội dung hoặc tóm tắt nội dung quy định].
*   **[Tên văn bản khác (nếu có)]**:
    *   **Phụ lục/Mục...:** [Nội dung].

**4. Gợi ý / Hành động tiếp theo:**
*   [Gợi ý 1: Kiểm tra giấy tờ/hợp đồng...]
*   [Gợi ý 2: Tách công tơ nếu có mục đích sử dụng hỗn hợp...]
*   [Gợi ý 3: Liên hệ cơ quan chức năng...]

---

### VÍ DỤ MẪU (Hãy học theo phong cách này):

*Câu hỏi:* Doanh nghiệp mở trường mầm non có giấy phép của sở giáo dục áp giá bán điện nào?

*Câu trả lời:*
Dựa trên các văn bản pháp luật hiện hành, doanh nghiệp mở trường mầm non có giấy phép của Sở Giáo dục sẽ được áp dụng giá bán lẻ điện cho khối hành chính, sự nghiệp.

**1. Kết luận trực tiếp:**
Trường mầm non là đơn vị phục vụ cho mục đích chính sách xã hội được ưu tiên **giá bán lẻ điện cho khối hành chính, sự nghiệp** (cụ thể là nhóm đối tượng bệnh viện, nhà trẻ, mẫu giáo, trường phổ thông), không phân biệt là đơn vị công lập hay ngoài công lập. Mức giá cụ thể sẽ phụ thuộc vào cấp điện áp mà trường đang sử dụng.

**2. Chi tiết:**
Mức giá bán lẻ điện (chưa bao gồm thuế giá trị gia tăng) áp dụng cho trường mầm non của doanh nghiệp như sau:
*   **Cấp điện áp từ 6 kV trở lên:** **1.940 đồng/kWh**
*   **Cấp điện áp dưới 6 kV:** **2.072 đồng/kWh**

**3. Cụ thể được quy định tại:**
*   **Thông tư số 13/VBHN-BCT** ngày 27 tháng 4 năm 2023 của Bộ Công Thương (Văn bản hợp nhất):
    *   **Điều 9, Khoản 1, Điểm a:** Quy định rõ "Giá bán lẻ điện cho bệnh viện, nhà trẻ, mẫu giáo và trường phổ thông được áp dụng cho các đối tượng sau: a) Nhà trẻ, trường mẫu giáo...". Quy định này không phân biệt loại hình sở hữu.
*   **Quyết định số 1279/QĐ-BCT** ngày 09 tháng 5 năm 2025:
    *   **Phụ lục, Mục 2.1:** Quy định mức giá cụ thể cho nhóm này.

**4. Gợi ý / Hành động tiếp theo:**
*   **Kiểm tra cấp điện áp:** Xác định cấp điện áp trong hợp đồng để biết mức giá chính xác.
*   **Đảm bảo mục đích sử dụng:** Nếu có căng tin/dịch vụ kinh doanh, nên lắp công tơ riêng để tránh bị áp giá kinh doanh cho toàn bộ.
*   **Liên hệ bên bán điện:** Cung cấp giấy phép hoạt động để yêu cầu áp giá đúng.

---

### CONTEXT DOCUMENTS (Đã sắp xếp theo độ ưu tiên):
${contextString}
`;
};

export const generateAnswer = async (
  question: string,
  documents: KnowledgeDoc[],
  history: ChatMessage[]
): Promise<string> => {
  try {
    const ai = getClient();
    const systemInstruction = buildSystemInstruction(documents);

    const validHistory = history.filter(h => !h.isError);
    
    const historyForModel = validHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // Low temperature for factual accuracy
      },
      history: historyForModel
    });

    const result: GenerateContentResponse = await chatSession.sendMessage({
      message: question
    });

    return result.text || "Không có phản hồi từ mô hình.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Đã xảy ra lỗi khi gọi Gemini API.");
  }
};

/**
 * Xác định thứ hạng pháp lý của văn bản dựa trên tên file.
 * Số càng nhỏ, hiệu lực pháp lý càng cao (1 là cao nhất).
 * Dựa trên quy định 15 bậc của hệ thống văn bản quy phạm pháp luật Việt Nam.
 */
export const getLegalRank = (fileName: string): number => {
  const lowerName = fileName.toLowerCase();

  // 1. Hiến pháp
  if (lowerName.includes('hiến pháp')) return 1;

  // 2. Bộ luật, luật, nghị quyết của Quốc hội
  if (lowerName.includes('bộ luật') || 
      /(^|\s)luật(\s|$)/.test(lowerName) || 
      (lowerName.includes('nghị quyết') && lowerName.includes('quốc hội'))) {
    return 2;
  }

  // 3. Pháp lệnh, nghị quyết của UBTVQH
  if (lowerName.includes('pháp lệnh') || 
      (lowerName.includes('nghị quyết') && (lowerName.includes('ủy ban thường vụ') || lowerName.includes('ubtvqh')))) {
    return 3;
  }

  // 4. Lệnh, quyết định của Chủ tịch nước
  if (/(^|\s)lệnh(\s|$)/.test(lowerName) || 
      (lowerName.includes('quyết định') && lowerName.includes('chủ tịch nước'))) {
    return 4;
  }

  // 5. Nghị định
  if (lowerName.includes('nghị định') || lowerName.includes('/nđ-cp')) return 5;

  // 6. Quyết định của Thủ tướng Chính phủ
  if (lowerName.includes('quyết định') && (lowerName.includes('thủ tướng') || lowerName.includes('/qđ-ttg'))) {
    return 6;
  }

  // 7. Nghị quyết của Hội đồng Thẩm phán TANDTC
  if (lowerName.includes('nghị quyết') && lowerName.includes('hội đồng thẩm phán')) return 7;

  // 8. Thông tư (Bộ trưởng, Chánh án...), Quyết định Tổng KTNN
  // Lưu ý: Văn bản hợp nhất thường ghép Thông tư hoặc Nghị định.
  // Nếu tên file chứa "Văn bản hợp nhất" mà có chữ "Thông tư", ta xếp vào nhóm này.
  if (lowerName.includes('thông tư') || lowerName.includes('/tt-')) return 8;

  // Mở rộng: Quyết định của Bộ trưởng (thường gặp trong giá điện, ví dụ QĐ-BCT)
  // Mặc dù luật mới chủ yếu dùng Thông tư, nhưng các Quyết định cá biệt về giá vẫn có hiệu lực thi hành cao.
  // Ta xếp vào nhóm 8 (ngang Thông tư) hoặc 8.5. Ở đây gộp vào 8 để ưu tiên hơn văn bản địa phương.
  if (lowerName.includes('quyết định') && (lowerName.includes('bộ công thương') || lowerName.includes('/qđ-bct'))) {
    return 8;
  }

  // 9. Nghị quyết HĐND cấp tỉnh
  if (lowerName.includes('nghị quyết') && (lowerName.includes('hđnd') || lowerName.includes('hội đồng nhân dân')) && lowerName.includes('tỉnh')) {
    return 9;
  }

  // 10. Quyết định UBND cấp tỉnh
  if (lowerName.includes('quyết định') && (lowerName.includes('ubnd') || lowerName.includes('ủy ban nhân dân')) && lowerName.includes('tỉnh')) {
    return 10;
  }

  // ... Các cấp thấp hơn (11-15) hoặc không xác định
  // Nếu là Quyết định nhưng không rõ cấp, ta tạm xếp vào nhóm 16 (thấp hơn tỉnh)
  if (lowerName.includes('quyết định')) return 16;
  
  // Văn bản khác
  return 99;
};

/**
 * Hàm trả về tên cấp bậc để hiển thị (tùy chọn)
 */
export const getRankName = (rank: number): string => {
  switch (rank) {
    case 1: return "Hiến pháp";
    case 2: return "Luật/NQ Quốc hội";
    case 3: return "Pháp lệnh/NQ UBTVQH";
    case 4: return "Lệnh/QĐ CTN";
    case 5: return "Nghị định";
    case 6: return "QĐ Thủ tướng";
    case 8: return "Thông tư/QĐ Bộ";
    default: return "Văn bản khác";
  }
};
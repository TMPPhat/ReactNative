import { ProductData } from './apiProduct';
import { CONFIG } from './config';

const apiGemini = {
  chatWithMenu: async (userQuery: string, products: ProductData[]) => {
    // 1. Tối ưu và làm giàu dữ liệu gửi đi
    const menuContext = products.map(p => ({
      id: p.id,
      name: p.name,
      desc: p.description,
      price: p.price,
      cat: p.category?.[0]?.value || '',
      is_on_sale: p.is_on_sale,
      discount: p.is_on_sale ? `${p.discount_value} ${p.discount_type}` : null,
      sold: p.sold_quantity ? Number(p.sold_quantity) : 0,
    }));

    // 2. Prompt chi tiết hơn
    const prompt = `
      Bạn là nhân viên phục vụ nhà hàng thông minh.
      
      DỮ LIỆU THỰC ĐƠN (JSON):
      ${JSON.stringify(menuContext)}

      CÂU HỎI CỦA KHÁCH: "${userQuery}"

      NHIỆM VỤ:
      1. Phân tích nhu cầu khách hàng (tìm món ngon, món rẻ, đang giảm giá, món hot/bán chạy...).
      2. Ưu tiên gợi ý các món có 'is_on_sale': true nếu khách hỏi về khuyến mãi.
      3. Ưu tiên các món có 'sold' cao nếu khách hỏi món ngon/nổi bật.
      
      TRẢ VỀ KẾT QUẢ (CHỈ JSON THUẦN TÚY):
      { 
        "message": "Câu trả lời ngắn gọn, thân thiện (tiếng Việt)", 
        "product_ids": [danh_sách_id_số_nguyên] 
      }
    `;

    try {
      console.log("--- BẮT ĐẦU GỌI GEMINI ---");
      // console.log("Prompt:", prompt); // Uncomment để debug prompt nếu cần

      const response = await fetch(`${CONFIG.GEMINI_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // Config để phản hồi ổn định hơn
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000,
          }
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error("GOOGLE API ERROR:", JSON.stringify(data.error, null, 2));
        throw new Error(data.error.message);
      }

      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) throw new Error('AI không trả về nội dung text');

      console.log("RAW AI RESPONSE:", textResponse);

      // Xử lý chuỗi JSON an toàn hơn bằng Regex
      // Tìm chuỗi bắt đầu bằng { và kết thúc bằng }
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
          throw new Error("Không tìm thấy JSON hợp lệ trong phản hồi");
      }
      
      const cleanJson = jsonMatch[0];
      return JSON.parse(cleanJson);

    } catch (error) {
      console.error("LỖI XỬ LÝ AI:", error);
      return {
        message: "Xin lỗi, hiện tại tôi đang gặp chút trục trặc khi tra cứu thực đơn. Bạn thử lại sau nhé!",
        product_ids: []
      };
    }
  }
};

export default apiGemini;
import axiosClient from './axiosClient';
import { CONFIG } from './config';

// --- Types ---
export interface ReviewData {
  id: number;
  review: string; // Tiêu đề ngắn (nếu có)
  product_id: { id: number; value: string }[];
  user_name: string;
  rating: string; // Baserow trả về string
  comment: string;
  date: string;
}

// --- API Functions ---
const getReviewUrl = () => `${CONFIG.REVIEW_TABLE_ID}/?user_field_names=true`;

const apiReview = {
  // Lấy đánh giá theo Product ID
  getReviewsByProductId: async (productId: number) => {
    // Sử dụng filter 'link_row_has' để tìm các review có liên kết với productId này
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [
        { type: "link_row_has", field: "product_id", value: productId.toString() }
      ]
    });
    
    const response = await axiosClient.get(`${getReviewUrl()}&filters=${filters}`);
    return response.data;
  }
};

export default apiReview;
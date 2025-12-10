import axiosClient from './axiosClient';
import { CONFIG } from './config';

// --- Types ---

// Kiểu dữ liệu Category từ Baserow
export interface CategoryData {
  id: number;
  name: string;
  image: string; // Emoji hoặc URL
  description: string;
  // Có thể có danh sách sản phẩm con nếu cần
  products?: { id: number; value: string }[];
}

// --- API Functions ---

const getCategoryUrl = () => `${CONFIG.CATEGORY_TABLE_ID}/?user_field_names=true`;

const apiCategory = {
  // 1. Lấy tất cả danh mục
  getAllCategories: async () => {
    const response = await axiosClient.get(getCategoryUrl());
    return response.data;
  },

  // 2. Lấy chi tiết danh mục (nếu cần)
  getCategoryDetail: async (id: number) => {
    const response = await axiosClient.get(`${CONFIG.CATEGORY_TABLE_ID}/${id}/?user_field_names=true`);
    return response.data;
  }
};

export default apiCategory;
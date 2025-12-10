import axiosClient from './axiosClient';
import { CONFIG } from './config';

// --- Types ---

export interface BaserowFile {
  url: string;
  thumbnails: {
    tiny: { url: string };
    small: { url: string };
    card_cover: { url: string };
  };
  visible_name: string;
}

// CategoryLink chỉ dùng để định nghĩa mối quan hệ trong object Product
export interface CategoryLink {
  id: number;
  value: string;
}

export interface ProductData {
  id: number;
  name: string;
  price: string;
  category: CategoryLink[]; // Mảng liên kết
  image: BaserowFile[];
  description: string;
  is_on_sale: boolean;
  discount_type: string;
  discount_value: string;
  sold_quantity: string;
}

// --- API Functions ---

const getProductUrl = () => `${CONFIG.PRODUCT_TABLE_ID}/?user_field_names=true`;

const apiProduct = {
  // 1. Lấy tất cả sản phẩm
  getAllProducts: async () => {
    const response = await axiosClient.get(getProductUrl());
    return response.data;
  },

  // 2. Lấy chi tiết sản phẩm
  getProductDetail: async (id: number) => {
    const response = await axiosClient.get(`${CONFIG.PRODUCT_TABLE_ID}/${id}/?user_field_names=true`);
    return response.data;
  }
};

export default apiProduct;
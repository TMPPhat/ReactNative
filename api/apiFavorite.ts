import axiosClient from './axiosClient';
import { CONFIG } from './config';

export interface FavoriteData {
  id: number;
  user: { id: number; value: string }[];
  products: { id: number; value: string }[]; // Danh sách sản phẩm (chỉ có ID và Tên)
}

const getFavoriteUrl = () => `${CONFIG.FAVORITE_TABLE_ID}/?user_field_names=true`;

const apiFavorite = {
  // Lấy danh sách yêu thích của User
  getFavoritesByUser: async (userId: number) => {
    // Filter theo user (Link row)
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [
        { type: "link_row_has", field: "user", value: userId.toString() }
      ]
    });
    
    const response = await axiosClient.get(`${getFavoriteUrl()}&filters=${filters}`);
    return response.data;
  },

  // Tạo dòng yêu thích mới (nếu user chưa có)
  createFavorite: async (userId: number, productIds: number[]) => {
    const payload = {
      user: [userId], // Link tới user
      products: productIds // Mảng ID sản phẩm
    };
    const response = await axiosClient.post(getFavoriteUrl(), payload);
    return response.data;
  },

  // Cập nhật danh sách sản phẩm yêu thích
  updateFavoriteList: async (rowId: number, productIds: number[]) => {
    const payload = {
      products: productIds // Gửi lên mảng ID mới (ghi đè mảng cũ)
    };
    // Endpoint: /table/{table_id}/{row_id}/
    const response = await axiosClient.patch(`${CONFIG.FAVORITE_TABLE_ID}/${rowId}/?user_field_names=true`, payload);
    return response.data;
  }
};

export default apiFavorite;
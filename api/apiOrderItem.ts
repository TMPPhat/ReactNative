import axiosClient from './axiosClient';
import { CONFIG } from './config';

export interface CreateOrderItemPayload {
  order_ref: number[]; 
  product: number[]; 
  product_name: string;
  quantity: number;
  price: number;
  total_price: number;
}

export interface OrderItemData {
  id: number;
  product_name: string;
  quantity: string; // Baserow number thường trả về string hoặc number tùy config, ta ép kiểu sau
  price: string;
}

const apiOrderItem = {
  // Tạo chi tiết đơn hàng
  create: async (payload: CreateOrderItemPayload) => {
    const response = await axiosClient.post(`${CONFIG.ORDER_ITEM_TABLE_ID}/?user_field_names=true`, payload);
    return response.data;
  },

  // Lấy danh sách món theo Order ID
  getItemsByOrderId: async (orderId: number) => {
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [
        { type: "link_row_has", field: "order_ref", value: orderId.toString() }
      ]
    });
    const response = await axiosClient.get(`${CONFIG.ORDER_ITEM_TABLE_ID}/?user_field_names=true&filters=${filters}`);
    return response.data;
  }
};

export default apiOrderItem;
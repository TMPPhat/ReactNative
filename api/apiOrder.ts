import axiosClient from './axiosClient';
import { CONFIG } from './config';

export interface CreateOrderPayload {
  order_number: string;
  user: number[];
  address: number[];
  voucher: number[];
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_price: number;
  note: string;
  status: string;
  created_at: string;
  order_items: any[]; 
  order_status_history: any[]; 
}

export interface OrderData {
  id: number;
  order_number: string;
  total_price: string;
  subtotal: string;
  shipping_fee: string;
  discount_amount: string;
  payment_method: { id: number; value: string; color: string };
  status: { id: number; value: string; color: string };
  created_at: string;
  address: { id: number; value: string }[]; // Link row trả về mảng
  user: { id: number; value: string }[];
  // ... các trường khác
}

const apiOrder = {
  // Tạo đơn hàng mới
  createOrder: async (payload: CreateOrderPayload) => {
    const response = await axiosClient.post(`${CONFIG.ORDER_TABLE_ID}/?user_field_names=true`, payload);
    return response.data;
  },

  // Lấy danh sách đơn hàng theo User ID
  getOrdersByUser: async (userId: number) => {
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [
        { type: "link_row_has", field: "user", value: userId.toString() }
      ]
    });
    const response = await axiosClient.get(`${CONFIG.ORDER_TABLE_ID}/?user_field_names=true&filters=${filters}&order_by=-created_at`);
    return response.data;
  },

  // Lấy chi tiết đơn hàng
  getOrderDetail: async (orderId: number) => {
    const response = await axiosClient.get(`${CONFIG.ORDER_TABLE_ID}/${orderId}/?user_field_names=true`);
    return response.data;
  },

    // Cập nhật trạng thái đơn hàng (MỚI)
  updateOrderStatus: async (orderId: number, statusValue: string) => {
    // Với Single Select của Baserow, ta gửi value dạng string
    const response = await axiosClient.patch(`${CONFIG.ORDER_TABLE_ID}/${orderId}/?user_field_names=true`, {
      status: statusValue
    });
    return response.data;
  }
};

export default apiOrder;
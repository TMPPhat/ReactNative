import axiosClient from './axiosClient';
import { CONFIG } from './config';

export interface CreateOrderStatusPayload {
  order_id: number[];  
  status: string;      
  note: string;
  created_at: string;
  updated_by: string;  
}

export interface OrderStatusData {
  id: number;
  status: { id: number; value: string; color: string };
  note: string;
  created_at: string;
}

const apiOrderStatus = {
  // Tạo lịch sử trạng thái
  create: async (payload: CreateOrderStatusPayload) => {
    const response = await axiosClient.post(`${CONFIG.ORDER_STATUS_HISTORY_TABLE_ID}/?user_field_names=true`, payload);
    return response.data;
  },

  // Lấy lịch sử theo Order ID
  getHistoryByOrderId: async (orderId: number) => {
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [
        { type: "link_row_has", field: "order_id", value: orderId.toString() }
      ]
    });
    // Sắp xếp theo thời gian tăng dần để hiện timeline đúng thứ tự
    const response = await axiosClient.get(`${CONFIG.ORDER_STATUS_HISTORY_TABLE_ID}/?user_field_names=true&filters=${filters}&order_by=created_at`);
    return response.data;
  }
};

export default apiOrderStatus;
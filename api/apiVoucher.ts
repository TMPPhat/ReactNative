import axiosClient from './axiosClient';
import { CONFIG } from './config';

export interface VoucherData {
  id: number;
  code: string;
  type: { id: number; value: string; color: string }; // Single select: 'discount' | 'shipping'
  description: string;
  discount_value: string; // Baserow trả về string
  min_order_value: string; // Baserow trả về string
  is_used: boolean;
  expiry_date: string;
}

const getVoucherUrl = () => `${CONFIG.VOUCHER_TABLE_ID}/?user_field_names=true`;

const apiVoucher = {
  // Lấy tất cả voucher còn hạn sử dụng (Logic lọc ngày nên xử lý ở Client hoặc backend phức tạp hơn)
  // Ở đây ta lấy hết về rồi lọc ở client cho đơn giản với Baserow Free
  getAllVouchers: async () => {
    const response = await axiosClient.get(getVoucherUrl());
    return response.data;
  }
};

export default apiVoucher;
import axiosClient from './axiosClient';
import { CONFIG } from './config';

export interface AddressData {
  id: number;
  label: string;
  detail: string;
  phone: string;
  is_default: boolean;
  user_id: { id: number; value: string }[];
}

export interface CreateAddressPayload {
  label: string;
  detail: string;
  phone: string;
  is_default?: boolean;
  user_id?: number[];
}

const getAddressUrl = () => `${CONFIG.ADDRESS_TABLE_ID}/?user_field_names=true`;

const apiAddress = {
  // Lấy danh sách địa chỉ
  getAddressesByUser: async (userId: number) => {
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [
        { type: "link_row_has", field: "user_id", value: userId.toString() }
      ]
    });
    const response = await axiosClient.get(`${getAddressUrl()}&filters=${filters}`);
    return response.data;
  },

  // Lấy chi tiết
  getAddressDetail: async (addressId: number) => {
    const response = await axiosClient.get(`${CONFIG.ADDRESS_TABLE_ID}/${addressId}/?user_field_names=true`);
    return response.data;
  },

  // Tạo mới
  createAddress: async (payload: CreateAddressPayload) => {
    const response = await axiosClient.post(getAddressUrl(), payload);
    return response.data;
  },

  // Cập nhật (MỚI)
  updateAddress: async (addressId: number, payload: Partial<CreateAddressPayload>) => {
    // Endpoint update từng dòng: /table/{id}/{row_id}/
    const response = await axiosClient.patch(`${CONFIG.ADDRESS_TABLE_ID}/${addressId}/?user_field_names=true`, payload);
    return response.data;
  },

  // Xóa
  deleteAddress: async (addressId: number) => {
    const response = await axiosClient.delete(`${CONFIG.ADDRESS_TABLE_ID}/${addressId}/`);
    return response.data;
  }
};

export default apiAddress;
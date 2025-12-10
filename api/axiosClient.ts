import axios from 'axios';
import { CONFIG } from './config'; // Import cùng thư mục api

const axiosClient = axios.create({
  baseURL: CONFIG.BASEROW_BASE_URL,
  headers: {
    'Authorization': `Token ${CONFIG.BASEROW_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Interceptor để xử lý lỗi hoặc log nếu cần
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;
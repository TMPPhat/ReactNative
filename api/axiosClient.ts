import axios from 'axios';
import { CONFIG } from './config';

const axiosClient = axios.create({
  baseURL: CONFIG.BASEROW_BASE_URL,
  headers: {
    'Authorization': `Token ${CONFIG.BASEROW_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Hàm chờ (delay)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Interceptor xử lý lỗi & Retry
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu gặp lỗi 429 (Too Many Requests) và chưa retry quá 3 lần
    if (error.response && error.response.status === 429) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount += 1;
        
        // Thời gian chờ tăng dần: 1s, 2s, 4s (Exponential Backoff)
        const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;
        
        console.log(`⚠️ Gặp lỗi 429. Đang thử lại lần ${originalRequest._retryCount} sau ${delay}ms...`);
        
        await wait(delay);
        return axiosClient(originalRequest);
      }
    }

    // Xử lý lỗi chung
    return Promise.reject(error);
  }
);

export default axiosClient;
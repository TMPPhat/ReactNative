import axiosClient from './axiosClient';
import { CONFIG } from './config';

// --- Types ---
export interface SelectField {
  id: number;
  value: string;
  color: string;
}

export interface UserData {
  id: number;
  username: string;
  email: string;
  name: string;
  phone: string;
  birthday: string;
  gender: SelectField | null;
  AvatarUrl: string | null;
  roleValue: string;
  point: number;
  image?: { url: string; thumbnails: any; name: string }[];
  role?: SelectField;
}

// --- API Functions ---

const getTableUrl = () => `${CONFIG.TABLE_ID}/?user_field_names=true`;
const getRowUrl = (rowId: number) => `${CONFIG.TABLE_ID}/${rowId}/?user_field_names=true`;

const apiUser = {
  // 1. Đăng nhập
  login: async (email: string, pass: string) => {
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [
        { type: "equal", field: "email", value: email },
        { type: "equal", field: "password", value: pass }
      ]
    });
    const response = await axiosClient.get(`${getTableUrl()}&filters=${filters}`);
    return response.data;
  },

  // 2. Kiểm tra email tồn tại
  checkEmailExists: async (email: string) => {
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [{ type: "equal", field: "email", value: email }]
    });
    const response = await axiosClient.get(`${getTableUrl()}&filters=${filters}`);
    return response.data;
  },

  // 3. Tạo user mới
  createUser: async (payload: any) => {
    const response = await axiosClient.post(getTableUrl(), payload);
    return response.data;
  },

  // 4. Cập nhật user
  updateUser: async (userId: number, payload: any) => {
    const response = await axiosClient.patch(getRowUrl(userId), payload);
    return response.data;
  },

  // 5. Upload File lên Baserow (MỚI)
  uploadFile: async (fileUri: string) => {
    const formData = new FormData();
    // Lấy tên file từ đường dẫn URI
    const fileName = fileUri.split('/').pop() || 'avatar.jpg';
    // Xác định loại file (cơ bản)
    const match = /\.(\w+)$/.exec(fileName);
    const type = match ? `image/${match[1]}` : `image`;

    // @ts-ignore: FormData trong React Native yêu cầu object có uri, name, type
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: type, 
    });

    // Endpoint upload file của Baserow nằm ngoài endpoint database
    const uploadUrl = 'https://api.baserow.io/api/user-files/upload-file/';
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${CONFIG.BASEROW_TOKEN}`,
        // Không set Content-Type thủ công để fetch tự động set boundary cho multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        throw new Error('Upload failed');
    }

    return await response.json(); // Trả về object chứa thông tin file (bao gồm tên file để link)
  }
};

export default apiUser;
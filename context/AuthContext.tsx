import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import apiUser, { UserData } from '../api/apiUser';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  // CẬP NHẬT: Thêm tham số image (optional) vào đây để fix lỗi TypeScript
  updateProfile: (data: { name: string; phone: string; birthday: string; gender: string; image?: any[] }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user_session');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Lỗi tải user:', error);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    if (!validateEmail(email)) {
      Alert.alert('Lỗi định dạng', 'Vui lòng nhập email hợp lệ.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiUser.login(email, pass);

      if (data.results && data.results.length > 0) {
        const rawUser = data.results[0];
        const avatarUrl = rawUser.image && rawUser.image.length > 0 ? rawUser.image[0].url : null;
        const userRoleValue = rawUser.role?.value || 'guest';

        const loggedInUser: UserData = {
          id: rawUser.id,
          username: rawUser.username || '',
          email: rawUser.email,
          name: rawUser.name || '',
          phone: rawUser.phone || '',
          birthday: rawUser.birthday || '',
          gender: rawUser.gender || null,
          AvatarUrl: avatarUrl,
          roleValue: userRoleValue,
          point: rawUser.point ? Number(rawUser.point) : 0,
          role: rawUser.role || null,
          image: rawUser.image,
        };

        setUser(loggedInUser);
        await AsyncStorage.setItem('user_session', JSON.stringify(loggedInUser));
        Alert.alert('Thành công', `Chào mừng ${loggedInUser.name || 'bạn'} quay lại!`);
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Đăng nhập thất bại', 'Email hoặc mật khẩu không chính xác.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ Baserow.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    if (!validateEmail(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ.');
      return false;
    }

    setIsLoading(true);
    try {
      const checkData = await apiUser.checkEmailExists(email);

      if (checkData.results && checkData.results.length > 0) {
        Alert.alert('Lỗi đăng ký', 'Email này đã được sử dụng.');
        setIsLoading(false);
        return false;
      }

      const username = email.split('@')[0];
      const newUserPayload = {
        name: name,
        email: email,
        password: pass,
        username: username,
        role: "customer",
        point: 0,
      };

      const rawUser = await apiUser.createUser(newUserPayload);

      const userRoleValue = rawUser.role?.value || 'customer';
      const loggedInUser: UserData = {
        id: rawUser.id,
        username: rawUser.username,
        email: rawUser.email,
        name: rawUser.name,
        phone: rawUser.phone || '',
        birthday: rawUser.birthday || '',
        gender: null,
        AvatarUrl: null,
        roleValue: userRoleValue,
        point: 0,
        role: rawUser.role || null,
        image: [],
      };

      setUser(loggedInUser);
      await AsyncStorage.setItem('user_session', JSON.stringify(loggedInUser));

      Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
      router.replace('/(tabs)/home');
      return true;

    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng ký.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // --- HÀM UPDATE PROFILE ---
  const updateProfile = async (updateData: { name: string; phone: string; birthday: string; gender: string; image?: any[] }): Promise<boolean> => {
    if (!user || !user.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      return false;
    }

    setIsLoading(true);
    try {
      // Chuẩn bị payload
      const payload: any = {
        name: updateData.name,
        phone: updateData.phone,
        birthday: updateData.birthday,
        gender: updateData.gender
      };

      // Nếu có thông tin ảnh (mảng chứa tên file), thêm vào payload
      if (updateData.image) {
          payload.image = updateData.image;
      }

      // Gọi API update
      const updatedRawUser = await apiUser.updateUser(user.id, payload);

      // Lấy URL ảnh mới nhất để cập nhật vào state hiển thị ngay lập tức
      const avatarUrl = updatedRawUser.image && updatedRawUser.image.length > 0 
            ? updatedRawUser.image[0].url 
            : user.AvatarUrl; 

      const updatedUser: UserData = {
        ...user,
        name: updatedRawUser.name,
        phone: updatedRawUser.phone,
        birthday: updatedRawUser.birthday,
        gender: updatedRawUser.gender,
        AvatarUrl: avatarUrl,
        image: updatedRawUser.image
      };

      setUser(updatedUser);
      await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));

      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
      return true;

    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
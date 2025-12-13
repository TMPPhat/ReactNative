import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto'; // 1. Import thư viện mã hóa
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import apiUser, { UserData } from '../api/apiUser';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  hasSeenIntro: boolean; 
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  updateProfile: (data: { name: string; phone: string; birthday: string; gender: string; image?: any[] }) => Promise<boolean>;
  logout: () => void;
  finishIntro: () => void; 
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [hasSeenIntro, setHasSeenIntro] = useState(false); 
  const router = useRouter();

  // Load user và trạng thái intro khi mở app
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        // Load User
        const storedUser = await AsyncStorage.getItem('user_session');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Load Intro Status
        const viewedIntro = await AsyncStorage.getItem('has_seen_intro');
        if (viewedIntro === 'true') {
          setHasSeenIntro(true);
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu local:', error);
      } finally {
        setIsLoading(false); // Load xong mới tắt loading
      }
    };
    loadStorageData();
  }, []);

  // Hàm gọi khi người dùng bấm "Bắt đầu" ở trang Intro
  const finishIntro = async () => {
    setHasSeenIntro(true);
    await AsyncStorage.setItem('has_seen_intro', 'true');
    router.replace('/login');
  };

  const login = async (email: string, pass: string) => {
    if (!validateEmail(email)) {
      Alert.alert('Lỗi định dạng', 'Vui lòng nhập email hợp lệ.');
      return;
    }

    setIsLoading(true);
    try {
      // 2. Mã hóa mật khẩu trước khi gửi đi đăng nhập
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pass
      );
      
      // Gọi API với mật khẩu đã mã hóa
      const data = await apiUser.login(email, hashedPassword);

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
        
        if (!hasSeenIntro) {
           setHasSeenIntro(true);
           await AsyncStorage.setItem('has_seen_intro', 'true');
        }
        
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

      // 3. Mã hóa mật khẩu trước khi tạo tài khoản mới
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pass
      );

      const username = email.split('@')[0];
      const newUserPayload = {
        name: name,
        email: email,
        password: hashedPassword, // Lưu mật khẩu đã mã hóa
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
      
      if (!hasSeenIntro) {
          setHasSeenIntro(true);
          await AsyncStorage.setItem('has_seen_intro', 'true');
      }

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

  const updateProfile = async (updateData: { name: string; phone: string; birthday: string; gender: string; image?: any[] }): Promise<boolean> => {
    if (!user || !user.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      return false;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        name: updateData.name,
        phone: updateData.phone,
        birthday: updateData.birthday,
        gender: updateData.gender
      };

      if (updateData.image) {
          payload.image = updateData.image;
      }

      const updatedRawUser = await apiUser.updateUser(user.id, payload);

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
    <AuthContext.Provider value={{ user, isLoading, hasSeenIntro, login, register, updateProfile, logout, finishIntro }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
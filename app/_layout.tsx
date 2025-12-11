import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
// 1. Thêm các import cần thiết cho Notification
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import AiAssistant from '../components/AiAssistant';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
// 2. Import helper
import { registerForPushNotificationsAsync } from '../utils/notificationHelper';

export const unstable_settings = {
  initialRouteName: 'intro',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 3. State quản lý thông báo
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  
  // SỬA LỖI: Thêm giá trị khởi tạo null cho useRef
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // A. Đăng ký lấy Token
    registerForPushNotificationsAsync().then(token => {
        if (token) setExpoPushToken(token);
        // Sau này bạn có thể gọi API để lưu token này vào user profile trên Baserow
    });

    // B. Lắng nghe thông báo khi App đang mở (Foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // C. Lắng nghe khi người dùng BẤM vào thông báo (Background/Killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User clicked notification:', response);
    });

    // D. Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    // Bọc CartProvider ở ngoài cùng để toàn bộ app dùng được giỏ hàng
    <AuthProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack initialRouteName="intro">
            <Stack.Screen name="intro" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product-detail" options={{ headerShown: false }} />
            <Stack.Screen name="order-detail" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
            <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
            <Stack.Screen name="address" options={{ headerShown: false }} />
            <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="favorites" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="help" options={{ headerShown: false }} />

          </Stack>
          <AiAssistant /> 
          <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}
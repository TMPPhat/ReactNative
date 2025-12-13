import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AiAssistant from '../components/AiAssistant';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { registerForPushNotificationsAsync } from '../utils/notificationHelper';

export const unstable_settings = {
  initialRouteName: 'intro',
};

// --- 1. COMPONENT ĐIỀU HƯỚNG CHÍNH (Được memo để tránh re-render khi route đổi) ---
// Sửa lỗi ESLint: Thêm tên function để React nhận diện display name
const AppNavigation = React.memo(function AppNavigation() {
  return (
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
  );
});

// --- 2. COMPONENT LOGIC PHỤ TRỢ (Redirect & AI) ---
// Component này sẽ re-render khi route thay đổi, nhưng không ảnh hưởng tới Stack
const AppOverlays = () => {
  const segments = useSegments();
  const router = useRouter();
  const { user, isLoading, hasSeenIntro } = useAuth();

  // Logic Redirect
  useEffect(() => {
    if (isLoading) return;

    // const inTabsGroup = segments[0] === '(tabs)'; // Không cần dùng biến này để chặn nữa
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const inIntro = segments[0] === 'intro';

    // LOGIC MỚI: Chỉ chặn người dùng đã đăng nhập vào lại trang Auth/Intro
    if (user) {
      if (inAuthGroup || inIntro) {
        router.replace('/(tabs)/home');
      }
      // Nếu user đang ở các trang khác (product-detail, checkout...), cho phép giữ nguyên
    } else {
      // Nếu chưa đăng nhập
      if (!hasSeenIntro) {
         if (!inIntro) router.replace('/intro');
      } else {
         if (!inAuthGroup) router.replace('/login');
      }
    }
  }, [user, isLoading, segments, hasSeenIntro]);

  // Logic ẩn hiện AI Assistant
  const hideAiAssistant = segments.some(segment => 
    ['intro', 'login', 'signup', 'checkout', 'address', 'settings', 'help', 'profile-edit'].includes(segment)
  );

  if (isLoading) {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', zIndex: 999 }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return !hideAiAssistant ? <AiAssistant /> : null;
};

// --- 3. LAYOUT KHỞI TẠO (Notifications) ---
function InitialLayout() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
        if (token) setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User clicked notification:', response);
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <AppNavigation />
      <AppOverlays />
    </View>
  );
}

// --- 4. ROOT LAYOUT ---
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
           <InitialLayout />
           <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}
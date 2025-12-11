import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 1. Cấu hình cách hiển thị thông báo
// Cập nhật: Thêm shouldShowBanner và shouldShowList để thỏa mãn type checker
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// --- LƯU Ý QUAN TRỌNG ---
// Nếu bạn chưa cấu hình EAS (eas build:configure), hãy lấy Project ID từ https://expo.dev
// và điền vào đây để test. Ví dụ: '12345678-1234-1234-1234-1234567890ab'
// Nếu đã cấu hình EAS, bạn có thể để chuỗi rỗng, nó sẽ tự lấy từ Constants.
const HARDCODED_PROJECT_ID = '388a22f1-98b3-4484-b6cb-09aad9b1469f'; 

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Không thể lấy quyền gửi thông báo!');
      return;
    }

    // Lấy Project ID
    // Ưu tiên lấy từ cấu hình EAS, nếu không có thì dùng ID điền cứng
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId ?? 
      HARDCODED_PROJECT_ID;

    if (!projectId) {
      console.warn('CẢNH BÁO: Không tìm thấy Project ID. Thông báo Push sẽ không hoạt động.');
      console.warn('Vui lòng chạy "npx expo install expo-constants" và cấu hình EAS, hoặc điền ID vào utils/notificationHelper.ts');
      return;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log("EXPO PUSH TOKEN:", token);
    } catch (e) {
      console.error("Lỗi lấy token:", e);
    }
  } else {
    alert('Vui lòng sử dụng thiết bị thật để test thông báo (Push Notification)');
  }

  return token;
}
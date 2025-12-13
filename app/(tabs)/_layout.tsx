import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { ClipboardList, Home, QrCode, ShoppingBag, User } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.bottomBarWrapper}>
      <View style={styles.bottomBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // --- Xử lý nút QR Code đặc biệt ---
          if (route.name === 'qr') {
            return (
              <View key={route.key} style={styles.qrButtonWrapper}>
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.9}
                  style={styles.qrButtonShadow}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#4f46e5']}
                    style={styles.qrButtonGradient}
                  >
                    <QrCode size={28} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.qrLabel}>Quét QR</Text>
              </View>
            );
          }

          // --- Ẩn tab index (chỉ dùng để redirect) ---
          if (route.name === 'index') return null;

          let Icon;
          let label;
          
          switch (route.name) {
            case 'home':
              Icon = Home;
              label = 'Trang chủ';
              break;
            case 'products':
              Icon = ShoppingBag;
              label = 'Sản phẩm';
              break;
            case 'orders':
              Icon = ClipboardList;
              label = 'Đơn hàng';
              break;
            case 'account':
              Icon = User;
              label = 'Tài khoản';
              break;
            default:
              return null; // Ẩn các route lạ nếu có (ví dụ explore cũ)
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.tabItem,
                // Thêm margin để tránh đè lên nút QR
                route.name === 'products' ? { marginRight: 20 } : {},
                route.name === 'orders' ? { marginLeft: 20 } : {},
              ]}
            >
              <Icon 
                size={24} 
                color={isFocused ? '#3b82f6' : '#9ca3af'} 
                fill={isFocused && route.name !== 'orders' ? '#3b82f6' : 'none'} 
              />
              <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >      
      {/* Các tab chính thức */}
      <Tabs.Screen name="home" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="products" options={{ title: 'Sản phẩm' }} />
      <Tabs.Screen name="qr" options={{ title: 'Quét QR' }} />
      <Tabs.Screen name="orders" options={{ title: 'Đơn hàng' }} />
      <Tabs.Screen name="account" options={{ title: 'Tài khoản' }} />
      
 
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  qrButtonWrapper: {
    position: 'absolute',
    bottom: 25,
    left: '50%',
    marginLeft: -35,
    alignItems: 'center',
    zIndex: 10,
  },
  qrButtonShadow: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'white',
    padding: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qrButtonGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '500',
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
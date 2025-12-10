import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CreditCard,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Settings,
  User
} from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// Import hook lấy dữ liệu người dùng
import { useAuth } from '../../context/AuthContext';

// Màu sắc chủ đạo (Blue Theme)
const COLORS = {
  background: '#f9fafb',
  primary: '#3b82f6',
  secondary: '#4f46e5',
  text: '#111827',
  textLight: '#6b7280',
  white: '#ffffff',
  border: '#f3f4f6',
  red: '#ef4444',
  redBg: '#fef2f2',
};

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đăng xuất", 
          style: "destructive", 
          onPress: () => {
            logout();
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      section: 'Tài khoản',
      items: [
        { icon: User, label: 'Thông tin cá nhân', color: '#3b82f6', bg: '#eff6ff', route: '/profile-edit' },
        { icon: MapPin, label: 'Địa chỉ giao hàng', color: '#22c55e', bg: '#dcfce7', route: '/address' },
        { icon: CreditCard, label: 'Phương thức thanh toán', color: '#a855f7', bg: '#f3e8ff', route: '/payment-methods' },
      ],
    },
    {
      section: 'Cài đặt',
      items: [
        { icon: Bell, label: 'Thông báo', color: '#f97316', bg: '#ffedd5', route: '/notifications' },
        { icon: Heart, label: 'Sản phẩm yêu thích', color: '#ec4899', bg: '#fce7f3', route: '/favorites' },
        { icon: Settings, label: 'Cài đặt', color: '#6b7280', bg: '#f3f4f6', route: '/settings' },
        { icon: HelpCircle, label: 'Trợ giúp & Hỗ trợ', color: '#06b6d4', bg: '#cffafe', route: '/help' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header Profile Section */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {user?.AvatarUrl ? (
              <Image 
                source={{ uri: user.AvatarUrl }} 
                style={styles.avatarImage} 
                resizeMode="cover"
              />
            ) : (
              <User size={32} color="white" />
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Khách'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Vui lòng đăng nhập'}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/profile-edit')}
          >
            <ChevronRight size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Điểm tích lũy</Text>
            <Text style={styles.statValue}>
              {typeof user?.point === 'number' ? user.point.toLocaleString() : '0'}
            </Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statLabel}>Voucher</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Đã mua</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        {menuItems.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                const isLast = idx === section.items.length - 1;
                
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[
                      styles.menuItem,
                      !isLast && styles.menuItemBorder
                    ]}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.bg }]}> 
                      <Icon size={20} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <ChevronRight size={20} color="#9ca3af" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.redBg }]}>
            <LogOut size={20} color={COLORS.red} />
          </View>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* App Version Info */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>TMP.MP Shop v1.0.0</Text>
        </View>
        
        {/* Spacer for Bottom Tab Bar */}
        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#dbeafe',
  },
  editButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  statBorder: {
    // Nếu muốn viền giữa, nhưng ở đây dùng card riêng lẻ đẹp hơn
  },
  statLabel: {
    fontSize: 12,
    color: '#e0e7ff',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  menuContainer: {
    padding: 24,
    marginTop: -10, 
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 15,
    color: COLORS.red,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
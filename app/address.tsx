import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Edit2, MapPin, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Màu sắc chủ đạo (Đồng bộ)
const COLORS = {
  primary: '#3b82f6',
  secondary: '#4f46e5',
  text: '#111827',
  textLight: '#6b7280',
  bg: '#f9fafb',
  white: '#ffffff',
  gray: '#f3f4f6',
  border: '#e5e7eb',
  green: '#22c55e',
  greenBg: '#dcfce7',
  red: '#ef4444',
  redBg: '#fef2f2',
  blueBg: '#eff6ff',
};

interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export default function AddressScreen() {
  const router = useRouter();
  
  const [addresses] = useState<Address[]>([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      address: '123 Đường ABC, Phường XYZ, Quận 1, TP.HCM',
      isDefault: true,
    },
    {
      id: 2,
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      address: '456 Đường DEF, Phường UVW, Quận 3, TP.HCM',
      isDefault: false,
    },
  ]);

  return (
    <View style={styles.container}>
      {/* Header với Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>
            <View style={{ width: 40 }} /> 
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.addressList}>
          {addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <MapPin size={20} color={COLORS.green} />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.nameText}>{address.name}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.phoneText}>{address.phone}</Text>
                  <Text style={styles.addressText}>{address.address}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionButton, styles.editButton]}>
                  <Edit2 size={16} color={COLORS.textLight} style={{ marginRight: 6 }} />
                  <Text style={styles.actionText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
                  <Trash2 size={16} color={COLORS.red} style={{ marginRight: 6 }} />
                  <Text style={styles.deleteText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        
        {/* Padding bottom để không bị che bởi nút thêm */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Address Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.addButtonWrapper}
          // onPress={() => router.push('/address-add')} // Logic thêm sau
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButton}
          >
            <Plus size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 40 : 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollContent: {
    padding: 20,
  },
  addressList: {
    gap: 16,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.greenBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: COLORS.blueBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  phoneText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  editButton: {
    borderColor: COLORS.border,
    backgroundColor: 'white',
  },
  deleteButton: {
    borderColor: '#fecaca', // red-200
    backgroundColor: 'white',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.red,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  addButtonWrapper: {
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Banknote, Check, CreditCard, MapPin, Wallet } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Context
import { useCart } from '../context/CartContext';

// Đổi tên interface Props cho khớp
interface CheckoutModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Màu sắc chủ đạo
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
  blueBg: '#dbeafe',
  purple: '#a855f7',
  purpleBg: '#f3e8ff',
};

// Đổi tên Component thành CheckoutModal
export function CheckoutModal({ isVisible, onClose, onSuccess }: CheckoutModalProps) {
  const { items, getTotalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [note, setNote] = useState('');

  const deliveryFee = 15000;
  const discount = 0;
  const totalPrice = getTotalPrice() + deliveryFee - discount;

  const handleCheckout = () => {
    // Xử lý logic thanh toán ở đây (gọi API, v.v.)
    clearCart();
    onSuccess(); // Gọi hàm callback khi thành công (để đóng modal và hiện thông báo)
  };

  const paymentMethods = [
    { id: 'cash', label: 'Tiền mặt', icon: Banknote, color: COLORS.green, bg: COLORS.greenBg },
    { id: 'card', label: 'Thẻ ngân hàng', icon: CreditCard, color: COLORS.primary, bg: COLORS.blueBg },
    { id: 'wallet', label: 'Ví điện tử', icon: Wallet, color: COLORS.purple, bg: COLORS.purpleBg },
  ];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header với Gradient */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.header}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.backButton}
              >
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Thanh toán</Text>
              <View style={{ width: 40 }} /> 
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Delivery Address */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MapPin size={20} color={COLORS.green} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.changeText}>Thay đổi</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.customerName}>Nguyễn Văn A</Text>
              <Text style={styles.customerPhone}>0912345678</Text>
              <Text style={styles.customerAddress}>123 Đường ABC, Phường XYZ, Quận 1, TP.HCM</Text>
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Sản phẩm ({items.length})</Text>
            <View style={styles.itemsList}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.sectionCard}>
            <View style={[styles.sectionTitleRow, { marginBottom: 12 }]}>
              <CreditCard size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            </View>
            <View style={styles.methodList}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setPaymentMethod(method.id as any)}
                  style={[
                    styles.methodItem,
                    paymentMethod === method.id && styles.methodItemActive
                  ]}
                >
                  <View style={[styles.methodIconBox, { backgroundColor: method.bg }]}>
                    <method.icon size={20} color={method.color} />
                  </View>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  {paymentMethod === method.id && (
                    <View style={styles.checkIcon}>
                      <Check size={14} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note */}
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Ghi chú</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Thêm ghi chú cho đơn hàng (tùy chọn)"
              placeholderTextColor={COLORS.textLight}
              multiline
              textAlignVertical="top"
              style={styles.noteInput}
            />
          </View>

          {/* Price Summary */}
          <View style={[styles.sectionCard, styles.summaryCard]}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Chi tiết thanh toán</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>{getTotalPrice().toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí giao hàng</Text>
              <Text style={styles.summaryValue}>{deliveryFee.toLocaleString('vi-VN')}đ</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={[styles.summaryValue, { color: COLORS.green }]}>
                  -{discount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleCheckout}
            activeOpacity={0.9}
            style={styles.checkoutButtonWrapper}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkoutButton}
            >
              <Text style={styles.checkoutText}>
                Đặt hàng • {totalPrice.toLocaleString('vi-VN')}đ
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  changeText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  addressContent: {
    paddingLeft: 28,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.gray,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  methodList: {
    gap: 8,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: 'white',
  },
  methodItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff', 
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteInput: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    padding: 12,
    height: 80,
    fontSize: 14,
    color: COLORS.text,
  },
  summaryCard: {
    backgroundColor: '#eff6ff', 
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#bfdbfe',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  checkoutButtonWrapper: {
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  checkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  MapPin,
  Ticket,
  Wallet
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Import API
import apiAddress, { AddressData } from '../api/apiAddress';
import apiOrder from '../api/apiOrder';
import apiOrderItem from '../api/apiOrderItem';
import apiOrderStatus from '../api/apiOrderStatus';
import apiVoucher, { VoucherData } from '../api/apiVoucher';

// Màu sắc
const COLORS = {
  primary: '#3b82f6',
  secondary: '#4f46e5',
  text: '#111827',
  textLight: '#6b7280',
  bg: '#f9fafb',
  white: '#ffffff',
  border: '#e5e7eb',
  green: '#22c55e',
  orange: '#f97316',
  purple: '#a855f7',
  blueBg: '#eff6ff',
  orangeBg: '#ffedd5',
  purpleBg: '#f3e8ff',
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  
  // --- Data State ---
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [vouchers, setVouchers] = useState<VoucherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); 
  
  // State quản lý thanh toán & Ghi chú
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // State quản lý Voucher
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<{
    discount: number | null; 
    shipping: number | null; 
  }>({ discount: null, shipping: null });
  
  const [showAllDiscount, setShowAllDiscount] = useState(false);
  const [showAllShipping, setShowAllShipping] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        setIsLoading(true);
        // 1. Lấy địa chỉ của User
        const addressRes = user ? await apiAddress.getAddressesByUser(user.id) : { results: [] };
        
        // 2. Lấy danh sách Voucher và lọc theo User hiện tại
        const voucherRes = await apiVoucher.getAllVouchers();
        const allVouchers = voucherRes.results || [];
        
        const userVouchers = user 
            ? allVouchers.filter((v: any) => v.user && v.user.some((u: any) => u.id === user.id))
            : [];

        setAddresses(addressRes.results || []);
        setVouchers(userVouchers);
      } catch (error) {
        console.error("Lỗi tải thông tin thanh toán:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckoutData();
  }, [user]);

  // --- Logic Địa chỉ ---
  const currentAddress = useMemo(() => {
    if (addresses.length === 0) return null;
    return addresses.find(addr => addr.is_default) || addresses[0];
  }, [addresses]);

  // --- Logic Voucher ---
  const discountVouchers = useMemo(() => 
    vouchers.filter(v => v.type?.value === 'discount'), 
  [vouchers]);
  
  const shippingVouchers = useMemo(() => 
    vouchers.filter(v => v.type?.value === 'shipping'), 
  [vouchers]);

  // Tính toán giá tiền
  const deliveryFee = 15000;
  const subtotal = getTotalPrice();
  
  const discountAmount = useMemo(() => {
    if (!selectedVoucher.discount) return 0;
    const v = discountVouchers.find(item => item.id === selectedVoucher.discount);
    return v ? Number(v.discount_value) : 0;
  }, [selectedVoucher.discount, discountVouchers]);
  
  const shippingDiscountAmount = useMemo(() => {
    if (!selectedVoucher.shipping) return 0;
    const v = shippingVouchers.find(item => item.id === selectedVoucher.shipping);
    return v ? Number(v.discount_value) : 0;
  }, [selectedVoucher.shipping, shippingVouchers]);
  
  const totalDiscount = discountAmount + shippingDiscountAmount;
  const totalPrice = Math.max(0, subtotal + deliveryFee - totalDiscount);
  const savings = totalDiscount;

  // --- Xử lý Đặt hàng ---
  const handleCheckout = async () => {
    if (items.length === 0) {
        Alert.alert("Giỏ hàng trống", "Vui lòng chọn món trước khi thanh toán.");
        return;
    }
    if (!currentAddress) {
        Alert.alert("Thiếu thông tin", "Vui lòng thêm địa chỉ giao hàng.");
        return;
    }
    if (!user) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để đặt hàng.");
        return;
    }

    setIsProcessing(true);

    try {
        // 1. Thời gian hiện tại (ISO format)
        const now = new Date();
        const createdAtISO = now.toISOString();

        // 2. Tạo mã đơn hàng (VD: DH + timestamp)
        const orderNumber = `DH${now.getTime().toString().slice(-6)}`;
        
        // 3. Chuẩn bị dữ liệu Voucher
        const voucherIds = [];
        if (selectedVoucher.discount) voucherIds.push(selectedVoucher.discount);
        if (selectedVoucher.shipping) voucherIds.push(selectedVoucher.shipping);

        // 4. Tạo Order Payload
        const orderPayload = {
            order_number: orderNumber,
            user: [user.id], 
            address: [currentAddress.id], 
            voucher: voucherIds, 
            payment_method: paymentMethod, 
            subtotal: subtotal,
            shipping_fee: deliveryFee,
            discount_amount: totalDiscount,
            total_price: totalPrice,
            note: note,
            status: 'pending',
            created_at: createdAtISO, 
            order_items: [], 
            order_status_history: []
        };

        // 5. Gọi API tạo Order
        const createdOrder = await apiOrder.createOrder(orderPayload);
        const orderId = createdOrder.id;

        // 6. Tạo Order Items (Sửa key 'order' thành 'order_ref')
        const orderItemPromises = items.map(item => {
            return apiOrderItem.create({
                order_ref: [orderId], // <-- SỬA ĐÚNG KEY NÀY
                product: [item.id], 
                product_name: item.name,
                quantity: item.quantity,
                price: item.price,
                total_price: item.price * item.quantity
            });
        });

        // 7. Tạo Order Status History (Sửa key 'order' thành 'order_id')
        const statusHistoryPromise = apiOrderStatus.create({
            order_id: [orderId], // <-- SỬA ĐÚNG KEY NÀY
            status: 'pending',
            note: 'Đơn hàng mới',
            created_at: createdAtISO,
            updated_by: 'customer'
        });

        await Promise.all([...orderItemPromises, statusHistoryPromise]);

        // 8. Thành công
        clearCart();
        Alert.alert(
            "Đặt hàng thành công", 
            `Mã đơn: ${orderNumber}\nTổng: ${totalPrice.toLocaleString('vi-VN')}đ`, 
            [{ text: "OK", onPress: () => router.replace('/orders') }] 
        );

    } catch (error) {
        console.error("Lỗi đặt hàng:", error);
        Alert.alert("Lỗi", "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.");
    } finally {
        setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'cash', label: 'Tiền mặt', icon: Banknote, color: COLORS.green, bg: '#dcfce7' },
    { id: 'card', label: 'Thẻ ngân hàng', icon: CreditCard, color: COLORS.primary, bg: '#dbeafe' },
    { id: 'wallet', label: 'Ví điện tử', icon: Wallet, color: COLORS.purple, bg: '#f3e8ff' },
  ];

  const getVoucherDisplayText = () => {
    const selectedDiscountVoucher = discountVouchers.find(v => v.id === selectedVoucher.discount);
    const selectedShippingVoucher = shippingVouchers.find(v => v.id === selectedVoucher.shipping);
    
    if (selectedDiscountVoucher && selectedShippingVoucher) {
      return `${selectedDiscountVoucher.code} + ${selectedShippingVoucher.code}`;
    } else if (selectedDiscountVoucher) {
      return selectedDiscountVoucher.code;
    } else if (selectedShippingVoucher) {
      return selectedShippingVoucher.code;
    }
    return 'Chọn hoặc nhập mã';
  };

  const renderVoucherItem = (voucher: VoucherData, type: 'discount' | 'shipping') => {
    const isSelected = type === 'discount' 
      ? selectedVoucher.discount === voucher.id 
      : selectedVoucher.shipping === voucher.id;
    
    const minOrder = Number(voucher.min_order_value);
    
    const canUse = subtotal >= minOrder && !voucher.is_used; 

    return (
      <TouchableOpacity
        key={voucher.id}
        disabled={!canUse}
        onPress={() => {
          setSelectedVoucher(prev => ({
            ...prev,
            [type]: isSelected ? null : voucher.id
          }));
        }}
        style={[
          styles.voucherItem,
          isSelected && styles.voucherItemActive,
          !canUse && styles.voucherItemDisabled
        ]}
      >
        <View style={styles.voucherRow}>
          <View style={[styles.voucherIconBox, { backgroundColor: type === 'discount' ? '#fb923c' : '#2dd4bf' }]}>
            <Ticket size={24} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.voucherLabel}>Mã: {voucher.code}</Text>
            <Text style={styles.voucherDesc} numberOfLines={1}>{voucher.description}</Text>
            <Text style={styles.voucherSub}>Đơn tối thiểu {minOrder.toLocaleString('vi-VN')}đ</Text>
          </View>
          {isSelected && (
            <View style={styles.checkCircle}>
              <Check size={12} color="white" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
      return (
          <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
              <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
      )
  }

  return (
    <View style={styles.container}>
      {/* Header với Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
            <TouchableOpacity onPress={() => router.push('/address')}>
              <Text style={styles.changeText}>Thay đổi</Text>
            </TouchableOpacity>
          </View>
          {currentAddress ? (
            <View style={styles.addressContent}>
              <Text style={styles.customerName}>{currentAddress.label} ({user?.name})</Text>
              <Text style={styles.customerPhone}>{currentAddress.phone}</Text>
              <Text style={styles.customerAddress}>{currentAddress.detail}</Text>
            </View>
          ) : (
            <View style={styles.addressContent}>
                <Text style={{color: COLORS.orange}}>Chưa có địa chỉ. Vui lòng thêm mới.</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Sản phẩm ({items.length})</Text>
          <View style={styles.itemsList}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
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

        {/* Voucher Selection */}
        <TouchableOpacity 
          style={styles.sectionCard} 
          onPress={() => setShowVoucherModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.voucherSelectorRow}>
            <View style={styles.voucherIconWrapper}>
              <Ticket size={20} color={COLORS.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Voucher giảm giá</Text>
              <Text style={styles.voucherDisplayText} numberOfLines={1}>
                {getVoucherDisplayText()}
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.textLight} />
          </View>
        </TouchableOpacity>

        {/* Payment Method */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 12, fontSize: 14 }]}>Phương thức thanh toán</Text>
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
          <TouchableOpacity 
            style={styles.noteSelector} 
            onPress={() => setShowNoteInput(!showNoteInput)}
          >
            <View style={styles.noteIconWrapper}>
              <FileText size={20} color={COLORS.purple} />
            </View>
            <Text style={styles.noteText}>
              {note || 'Thêm ghi chú cho đơn hàng (tùy chọn)'}
            </Text>
            <ChevronRight size={20} color={COLORS.textLight} />
          </TouchableOpacity>
          
          {showNoteInput && (
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Nhập ghi chú..."
              placeholderTextColor={COLORS.textLight}
              multiline
              style={styles.noteInputExpanded}
            />
          )}
        </View>

        {/* Price Summary */}
        <View style={[styles.sectionCard, styles.summaryCard]}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Chi tiết thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{subtotal.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí giao hàng</Text>
            <Text style={styles.summaryValue}>{deliveryFee.toLocaleString('vi-VN')}đ</Text>
          </View>
          {totalDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá</Text>
              <Text style={[styles.summaryValue, { color: COLORS.green }]}>
                -{totalDiscount.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
          </View>
          {savings > 0 && (
            <View style={styles.savingsRow}>
              <Text style={styles.savingsText}>Tiết kiệm</Text>
              <Text style={styles.savingsValue}>{savings.toLocaleString('vi-VN')}đ</Text>
            </View>
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bottomLabel}>Tổng thanh toán</Text>
            <Text style={styles.bottomPrice}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
            {savings > 0 && (
              <Text style={styles.bottomSavings}>Tiết kiệm {savings.toLocaleString('vi-VN')}đ</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleCheckout}
            activeOpacity={0.9}
            style={styles.checkoutButton}
            disabled={!currentAddress || items.length === 0 || isProcessing} // Disable khi đang xử lý
          >
            <LinearGradient
              colors={(!currentAddress || items.length === 0 || isProcessing) ? ['#9ca3af', '#9ca3af'] : [COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {isProcessing ? (
                 <ActivityIndicator color="white" />
              ) : (
                 <Text style={styles.checkoutText}>Đặt hàng</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Voucher Modal */}
      <Modal
        visible={showVoucherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.dragBar} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Chọn Voucher</Text>
                <TouchableOpacity onPress={() => setShowVoucherModal(false)}>
                  <Text style={styles.closeText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Discount Vouchers */}
              <View style={styles.voucherSection}>
                <Text style={styles.voucherSectionTitle}>Voucher giảm giá</Text>
                {discountVouchers.length > 0 ? (
                    (showAllDiscount ? discountVouchers : discountVouchers.slice(0, 4)).map(v => 
                    renderVoucherItem(v, 'discount')
                    )
                ) : (
                    <Text style={{color: '#9ca3af', fontStyle: 'italic'}}>Không có voucher khả dụng</Text>
                )}
                
                {!showAllDiscount && discountVouchers.length > 4 && (
                  <TouchableOpacity onPress={() => setShowAllDiscount(true)}>
                    <Text style={styles.showMoreText}>Xem tất cả ({discountVouchers.length - 4} voucher khác)</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Shipping Vouchers */}
              <View style={styles.voucherSection}>
                <Text style={styles.voucherSectionTitle}>Voucher vận chuyển</Text>
                {shippingVouchers.length > 0 ? (
                    (showAllShipping ? shippingVouchers : shippingVouchers.slice(0, 4)).map(v => 
                    renderVoucherItem(v, 'shipping')
                    )
                ) : (
                    <Text style={{color: '#9ca3af', fontStyle: 'italic'}}>Không có voucher khả dụng</Text>
                )}

                {!showAllShipping && shippingVouchers.length > 4 && (
                  <TouchableOpacity onPress={() => setShowAllShipping(true)}>
                    <Text style={styles.showMoreText}>Xem tất cả ({shippingVouchers.length - 4} voucher khác)</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{height: 40}} />
            </ScrollView>

            <View style={styles.modalFooter}>
               <TouchableOpacity 
                 style={styles.modalButton}
                 onPress={() => setShowVoucherModal(false)}
               >
                 <Text style={styles.modalButtonText}>Xong</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
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
    backgroundColor: '#f3f4f6',
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
  // Styles cho Voucher Selector
  voucherSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voucherIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.orangeBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherDisplayText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  // Styles cho Payment Method
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
    backgroundColor: COLORS.blueBg,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Note styles
  noteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.purpleBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  noteInputExpanded: {
    marginTop: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    height: 80,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Summary Styles
  summaryCard: {
    backgroundColor: COLORS.blueBg,
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
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  savingsText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  savingsValue: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bottomLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bottomSavings: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '500',
  },
  checkoutButton: {
    flex: 1,
    maxWidth: 200,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  checkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  voucherSection: {
    marginBottom: 24,
  },
  voucherSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  voucherItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  voucherItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.blueBg,
  },
  voucherItemDisabled: {
    borderColor: COLORS.border,
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voucherIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voucherLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  voucherDesc: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  voucherSub: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  showMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    backgroundColor: COLORS.bg,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  }
});
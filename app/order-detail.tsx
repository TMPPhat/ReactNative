import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    MapPin,
    MessageSquare,
    Package,
    Truck,
    XCircle
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Import API
import apiAddress, { AddressData } from '../api/apiAddress';
import apiOrder, { OrderData } from '../api/apiOrder';
import apiOrderItem, { OrderItemData } from '../api/apiOrderItem';
import apiOrderStatus, { OrderStatusData } from '../api/apiOrderStatus';
import apiProduct from '../api/apiProduct'; // Dùng để lấy ảnh sản phẩm

// Màu sắc
const COLORS = {
  background: '#f9fafb',
  white: '#ffffff',
  primary: '#3b82f6',
  text: '#111827',
  gray: '#6b7280',
  border: '#e5e7eb',
  success: '#22c55e',
  orange: '#f97316',
  blue: '#3b82f6',
  red: '#ef4444',
};

// Định nghĩa kiểu dữ liệu mở rộng cho UI
interface OrderDetailExtended extends OrderData {
  items: (OrderItemData & { image?: string })[]; // Thêm trường image vào item
  timeline: OrderStatusData[];
  fullAddress?: AddressData;
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const orderId = Number(id);

  const [order, setOrder] = useState<OrderDetailExtended | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setIsLoading(true);
        
        // 1. Lấy thông tin cơ bản của đơn hàng
        const orderData: OrderData = await apiOrder.getOrderDetail(orderId);

        // 2. Gọi song song các dữ liệu liên quan
        const [itemsRes, historyRes, addressData] = await Promise.all([
          apiOrderItem.getItemsByOrderId(orderId),
          apiOrderStatus.getHistoryByOrderId(orderId),
          // Nếu có địa chỉ, lấy chi tiết địa chỉ đầu tiên (vì link row trả về mảng)
          orderData.address && orderData.address.length > 0 
            ? apiAddress.getAddressDetail(orderData.address[0].id) 
            : Promise.resolve(null)
        ]);

        const rawItems = itemsRes.results || [];
        
        // 3. Lấy thêm ảnh cho từng sản phẩm (Vì bảng order_items ko lưu ảnh)
        // Lưu ý: Đây là giải pháp tạm thời, tốt nhất nên lưu ảnh thumbnail vào bảng order_items lúc tạo đơn
        const itemsWithImages = await Promise.all(
          rawItems.map(async (item: any) => {
            let imageUrl = 'https://via.placeholder.com/200';
            // Item có trường product (link row) chứa ID sản phẩm
            if (item.product && item.product.length > 0) {
              try {
                const prod = await apiProduct.getProductDetail(item.product[0].id);
                if (prod.image && prod.image.length > 0) {
                  imageUrl = prod.image[0].url;
                }
              } catch (e) {
                // Ignore error image fetch
              }
            }
            return { ...item, image: imageUrl };
          })
        );

        setOrder({
          ...orderData,
          items: itemsWithImages,
          timeline: historyRes.results || [],
          fullAddress: addressData
        });

      } catch (error) {
        console.error("Lỗi tải chi tiết đơn hàng:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  // Format ngày giờ
  const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDateFull = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper hiển thị trạng thái
  const getStatusDisplay = (statusVal: string) => {
     switch(statusVal) {
         case 'pending': return { label: 'Chờ xác nhận', color: COLORS.orange, icon: Clock };
         case 'preparing': return { label: 'Đang chuẩn bị', color: COLORS.orange, icon: Package };
         case 'shipping': return { label: 'Đang giao hàng', color: COLORS.blue, icon: Truck };
         case 'completed': return { label: 'Giao thành công', color: COLORS.success, icon: CheckCircle };
         case 'cancelled': return { label: 'Đã hủy', color: COLORS.red, icon: XCircle };
         default: return { label: 'Không xác định', color: COLORS.gray, icon: Clock };
     }
  };

  const renderStatusTimeline = () => {
    if (!order || !order.timeline) return null;

    // Các mốc trạng thái chuẩn
    const standardSteps = [
        { key: 'pending', label: 'Đã đặt hàng' },
        { key: 'preparing', label: 'Nhà hàng xác nhận' },
        { key: 'shipping', label: 'Tài xế đang giao' },
        { key: 'completed', label: 'Giao thành công' }
    ];

    // Tìm trạng thái hiện tại trong history
    // Logic đơn giản: Hiển thị list history thực tế từ API
    return (
      <View style={styles.timelineContainer}>
        {order.timeline.map((step, index) => {
            const isLast = index === order.timeline.length - 1;
            const config = getStatusDisplay(step.status.value);
            return (
                <View key={step.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                        <Text style={styles.timelineTime}>{formatTime(step.created_at)}</Text>
                    </View>
                    <View style={styles.timelineCenter}>
                        <View style={[styles.dot, { backgroundColor: config.color }]} />
                        {!isLast && <View style={[styles.line, { backgroundColor: '#e5e7eb' }]} />}
                    </View>
                    <View style={styles.timelineRight}>
                        <Text style={[styles.timelineTitle, { color: COLORS.text, fontWeight: '500' }]}>
                            {config.label}
                        </Text>
                        {step.note ? <Text style={styles.timelineNote}>{step.note}</Text> : null}
                    </View>
                </View>
            )
        })}
        {/* Nếu đơn hàng bị hủy, hiện thêm dòng hủy */}
        {order.status.value === 'cancelled' && order.timeline[order.timeline.length - 1]?.status.value !== 'cancelled' && (
            <View style={styles.timelineItem}>
                 <View style={styles.timelineLeft}><Text style={styles.timelineTime}>--:--</Text></View>
                 <View style={styles.timelineCenter}>
                     <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
                 </View>
                 <View style={styles.timelineRight}>
                     <Text style={[styles.timelineTitle, { color: COLORS.red }]}>Đã hủy</Text>
                 </View>
            </View>
        )}
      </View>
    );
  };

  if (isLoading) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
      );
  }

  if (!order) return null;

  const currentStatus = getStatusDisplay(order.status.value);
  const StatusIcon = currentStatus.icon;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Order Status Card */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderId}>Mã đơn: #{order.order_number}</Text>
              <Text style={styles.orderDate}>Đặt lúc: {formatDateFull(order.created_at)}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: currentStatus.color + '20' }]}>
              <StatusIcon size={14} color={currentStatus.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: currentStatus.color }]}>{currentStatus.label}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          {renderStatusTimeline()}
        </View>

        {/* Address Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Địa chỉ nhận hàng</Text>
          <View style={styles.addressRow}>
            <MapPin size={20} color={COLORS.primary} style={{ marginTop: 2 }} />
            <View style={styles.addressInfo}>
              {order.fullAddress ? (
                  <>
                    <Text style={styles.userName}>{order.fullAddress.label}</Text>
                    <Text style={styles.userPhone}>{order.fullAddress.phone}</Text>
                    <Text style={styles.userAddress}>{order.fullAddress.detail}</Text>
                  </>
              ) : (
                  <Text style={{color: COLORS.gray}}>Thông tin địa chỉ không khả dụng</Text>
              )}
            </View>
          </View>
        </View>

        {/* Product List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Danh sách món</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemPrice}>{Number(item.price).toLocaleString('vi-VN')}đ</Text>
                  <Text style={styles.itemQuantity}>x{Number(item.quantity)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tạm tính</Text>
            <Text style={styles.paymentValue}>{Number(order.subtotal).toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
            <Text style={styles.paymentValue}>{Number(order.shipping_fee).toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Giảm giá</Text>
            <Text style={[styles.paymentValue, { color: COLORS.success }]}>
              -{Number(order.discount_amount).toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.paymentRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{Number(order.total_price).toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.paymentMethodBox}>
            <Text style={styles.paymentMethodText}>
                {order.payment_method?.value === 'cash' ? 'Thanh toán tiền mặt' : 
                 order.payment_method?.value === 'card' ? 'Thanh toán thẻ' : 'Ví điện tử'}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.supportButton}>
          <MessageSquare size={20} color={COLORS.text} />
          <Text style={styles.supportText}>Liên hệ</Text>
        </TouchableOpacity>
        {/* Chỉ hiện nút Theo dõi nếu chưa hoàn thành/hủy */}
        {order.status.value !== 'completed' && order.status.value !== 'cancelled' && (
            <TouchableOpacity style={styles.trackButton}>
               <Text style={styles.trackText}>Theo dõi đơn hàng</Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  // Timeline
  timelineContainer: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 48,
  },
  timelineLeft: {
    width: 50,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  timelineTime: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: -2,
  },
  timelineCenter: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 2,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineTitle: {
    fontSize: 14,
    marginTop: -4,
  },
  timelineNote: {
      fontSize: 12,
      color: COLORS.gray,
      marginTop: 2,
  },
  // Address
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.gray,
    marginVertical: 2,
  },
  userAddress: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  // Items
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center'
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.gray,
  },
  // Payment
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  paymentValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentMethodBox: {
    marginTop: 12,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  paymentMethodText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500'
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 48,
    marginRight: 12,
  },
  supportText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  trackButton: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
  },
  trackText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});